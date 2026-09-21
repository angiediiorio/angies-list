"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { esClienteInvitadoActivo, getPerfil } from "@/lib/perfiles";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/perfil");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  // Un cliente_invitado cuyo acceso venció o fue revocado no entra, aunque
  // la contraseña sea correcta — lo desloguemos antes de dejarlo pasar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const perfil = await getPerfil(user.id);
    if (perfil?.tipo_cuenta === "cliente_invitado" && !esClienteInvitadoActivo(perfil)) {
      await supabase.auth.signOut();
      redirect(
        `/login?error=${encodeURIComponent("Tu acceso expiró. Consultá con tu estudio.")}`,
      );
    }
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/registro?error=${encodeURIComponent(error.message)}`);
  }

  // Si el proyecto de Supabase no exige confirmar el email (o ya estaba
  // confirmado), signUp devuelve una sesión válida de una: entramos
  // directo en vez de mandar a "revisá tu email" sin necesidad.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/perfil");
  }

  redirect("/registro?exito=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
