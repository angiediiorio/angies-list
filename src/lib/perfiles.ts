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
