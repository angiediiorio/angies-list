"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin-auth";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import type { SolicitudEstudio } from "@/types";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    redirect("/");
  }
}

/** Formulario público en /para-estudios/solicitar. No crea ninguna cuenta
 * — solo la solicitud, que un admin revisa después. */
export async function solicitarAcceso(formData: FormData) {
  const nombreEstudio = String(formData.get("nombreEstudio") ?? "").trim();
  const cuitMatricula = String(formData.get("cuitMatricula") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const sitioWebInstagram = String(formData.get("sitioWebInstagram") ?? "").trim();

  if (!nombreEstudio || !cuitMatricula || !email) {
    redirect(
      `/para-estudios/solicitar?error=${encodeURIComponent("Completá nombre del estudio, CUIT/matrícula y email.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("solicitudes_estudio").insert({
    nombre_estudio: nombreEstudio,
    cuit_matricula: cuitMatricula,
    email,
    sitio_web_instagram: sitioWebInstagram || null,
  });

  if (error) {
    redirect(
      `/para-estudios/solicitar?error=${encodeURIComponent("No pudimos enviar tu solicitud. Probá de nuevo en unos minutos.")}`,
    );
  }

  redirect("/para-estudios/solicitar?enviado=1");
}

/** Aprueba una solicitud: crea la cuenta real (invitación de Supabase,
 * manda el mail con el link para activar), y marca el perfil como
 * estudio aprobado. */
export async function aprobarSolicitud(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();

  const { data: solicitud, error: errorLectura } = await admin
    .from("solicitudes_estudio")
    .select("*")
    .eq("id", id)
    .single<SolicitudEstudio>();

  if (errorLectura || !solicitud) {
    redirect(`/admin/estudios?error=${encodeURIComponent("No se encontró la solicitud.")}`);
  }

  const siteUrl = await getSiteUrl();
  const { data: invitado, error: errorInvite } = await admin.auth.admin.inviteUserByEmail(
    solicitud.email,
    { redirectTo: `${siteUrl}/auth/callback?next=/activar-cuenta` },
  );

  if (errorInvite || !invitado?.user) {
    redirect(
      `/admin/estudios?error=${encodeURIComponent(
        `No pudimos invitar a ${solicitud.email}: ${errorInvite?.message ?? "error desconocido"}. Si el mail ya tiene una cuenta, hay que resolverlo a mano desde Supabase.`,
      )}`,
    );
  }

  const { error: errorPerfil } = await admin.from("perfiles").upsert({
    id: invitado.user.id,
    tipo_cuenta: "estudio",
    estado_verificacion: "aprobado",
    nombre_estudio: solicitud.nombre_estudio,
    cuit_matricula: solicitud.cuit_matricula,
    sitio_web_instagram: solicitud.sitio_web_instagram,
  });

  if (errorPerfil) {
    redirect(`/admin/estudios?error=${encodeURIComponent(errorPerfil.message)}`);
  }

  await admin
    .from("solicitudes_estudio")
    .update({ estado: "aprobado", user_id: invitado.user.id, revisado_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/estudios");
}

export async function rechazarSolicitud(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("solicitudes_estudio")
    .update({ estado: "rechazado", revisado_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/estudios");
}

/** El estudio recién invitado llega logueado (sin contraseña) desde el
 * link del mail y elige una acá. */
export async function activarCuenta(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect(
      `/activar-cuenta?error=${encodeURIComponent("La contraseña tiene que tener al menos 6 caracteres.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/activar-cuenta?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/estudios");
}
