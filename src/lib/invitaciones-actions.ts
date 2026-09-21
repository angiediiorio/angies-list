"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { esEstudioAprobado, getPerfil } from "@/lib/perfiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";

async function requireEstudio() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/estudios/clientes");

  const perfil = await getPerfil(user.id);
  if (!esEstudioAprobado(perfil)) redirect("/para-estudios");

  return user;
}

/** El estudio genera un link para compartirle a un cliente. No crea
 * ninguna cuenta todavía — eso pasa recién cuando el cliente reclama el
 * link en /invitacion/[id]. */
export async function crearInvitacionCliente(formData: FormData) {
  const user = await requireEstudio();

  const proyecto = String(formData.get("proyecto") ?? "").trim() || null;
  const diasValidez = Math.max(1, Number(formData.get("diasValidez") ?? 30) || 30);

  const supabase = await createClient();
  const { error } = await supabase.from("invitaciones_cliente").insert({
    estudio_id: user.id,
    proyecto,
    dias_validez: diasValidez,
  });

  if (error) {
    redirect(`/estudios/clientes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/estudios/clientes");
}

/** Un solo botón de "Revocar" para dos casos distintos: si el link
 * todavía no se usó, lo invalida (nadie va a poder reclamarlo); si ya se
 * usó, corta el acceso del cliente que lo reclamó. Se resuelve con la
 * Service Role Key porque toca el perfil de OTRO usuario (el cliente), no
 * el propio del estudio — RLS por sí sola no alcanza para ese caso y
 * preferimos no abrir una policy de UPDATE amplia sobre `perfiles`. El
 * chequeo de pertenencia (`eq("estudio_id", user.id)`) se hace a mano acá
 * mismo antes de tocar nada. */
export async function revocarInvitacion(formData: FormData) {
  const user = await requireEstudio();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();

  const { data: invitacion } = await admin
    .from("invitaciones_cliente")
    .select("usado_en, cliente_id, estudio_id")
    .eq("id", id)
    .maybeSingle();

  if (!invitacion || invitacion.estudio_id !== user.id) return;

  if (invitacion.usado_en && invitacion.cliente_id) {
    await admin
      .from("perfiles")
      .update({ revocado_en: new Date().toISOString() })
      .eq("id", invitacion.cliente_id)
      .eq("estudio_id", user.id);
  } else {
    await admin
      .from("invitaciones_cliente")
      .update({ revocado_en: new Date().toISOString() })
      .eq("id", id)
      .eq("estudio_id", user.id);
  }

  revalidatePath("/estudios/clientes");
}

/** El cliente reclama el link: crea su cuenta (pre-confirmada, sin pasar
 * por el mail de verificación — quien comparte el link ya es de
 * confianza) y queda logueado directo. */
export async function reclamarInvitacion(formData: FormData) {
  const invitacionId = String(formData.get("invitacionId") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!invitacionId) redirect("/");

  if (!email || password.length < 6) {
    redirect(
      `/invitacion/${invitacionId}?error=${encodeURIComponent(
        "Completá un email válido y una contraseña de al menos 6 caracteres.",
      )}`,
    );
  }

  const admin = createAdminClient();

  const { data: invitacion, error: errorLectura } = await admin
    .from("invitaciones_cliente")
    .select("*")
    .eq("id", invitacionId)
    .maybeSingle();

  if (errorLectura || !invitacion || invitacion.revocado_en || invitacion.usado_en) {
    redirect(
      `/invitacion/${invitacionId}?error=${encodeURIComponent(
        "Este link ya no es válido — pedile uno nuevo a tu estudio.",
      )}`,
    );
  }

  const { data: nuevoUsuario, error: errorCrear } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (errorCrear || !nuevoUsuario?.user) {
    redirect(
      `/invitacion/${invitacionId}?error=${encodeURIComponent(
        errorCrear?.message ?? "No pudimos crear tu cuenta.",
      )}`,
    );
  }

  const expiraEn = new Date(
    Date.now() + invitacion.dias_validez * 24 * 60 * 60 * 1000,
  ).toISOString();

  await admin.from("perfiles").upsert({
    id: nuevoUsuario.user.id,
    tipo_cuenta: "cliente_invitado",
    estudio_id: invitacion.estudio_id,
    proyecto: invitacion.proyecto,
    expira_en: expiraEn,
    revocado_en: null,
  });

  await admin
    .from("invitaciones_cliente")
    .update({ usado_en: new Date().toISOString(), cliente_id: nuevoUsuario.user.id })
    .eq("id", invitacionId);

  // El admin client no deja cookies de sesión: logueamos a la persona con
  // el cliente normal y las credenciales que acaba de elegir.
  const supabase = await createClient();
  const { error: errorLogin } = await supabase.auth.signInWithPassword({ email, password });

  if (errorLogin) {
    redirect(
      `/login?error=${encodeURIComponent("Tu cuenta se creó. Iniciá sesión con tu email y contraseña.")}`,
    );
  }

  redirect("/catalogo");
}
