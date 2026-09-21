import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import type { Perfil } from "@/types";

/** Perfil del usuario, o null si no existe todavía (por ejemplo si
 * supabase/schema-b2b.sql no se corrió aún) — nunca rompe la página que
 * lo llama, solo trata al usuario como "cliente_final" sin datos extra. */
export async function getPerfil(userId: string): Promise<Perfil | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as Perfil | null;
  } catch {
    return null;
  }
}

export function esEstudioAprobado(perfil: Perfil | null): boolean {
  return Boolean(
    perfil && perfil.tipo_cuenta === "estudio" && perfil.estado_verificacion === "aprobado",
  );
}

/** true si es un cliente_invitado con acceso vigente (ni vencido ni
 * revocado a mano por el estudio). */
export function esClienteInvitadoActivo(perfil: Perfil | null): boolean {
  if (!perfil || perfil.tipo_cuenta !== "cliente_invitado") return false;
  if (perfil.revocado_en) return false;
  if (!perfil.expira_en) return false;
  return new Date(perfil.expira_en) > new Date();
}

/** Para usar en páginas/rutas que un cliente_invitado puede usar
 * (Favoritos, API de favoritos): si su acceso venció o fue revocado, lo
 * desloguea antes de dejarlo seguir. No afecta a cliente_final ni estudio. */
export async function cerrarSesionSiAccesoExpirado(perfil: Perfil | null): Promise<boolean> {
  if (perfil?.tipo_cuenta !== "cliente_invitado" || esClienteInvitadoActivo(perfil)) {
    return false;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  return true;
}

/** Para usar al principio de cualquier página/sección premium B2B. Si el
 * usuario no está logueado o no es un estudio aprobado, lo manda a la
 * landing pública en vez de mostrarle la sección. */
export async function requireEstudioAprobado(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  perfil: Perfil;
}> {
  const user = await getCurrentUser();
  if (!user) redirect("/para-estudios");

  const perfil = await getPerfil(user.id);
  if (!esEstudioAprobado(perfil)) redirect("/para-estudios");

  return { user, perfil: perfil! };
}
