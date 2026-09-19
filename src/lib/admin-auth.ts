import type { User } from "@supabase/supabase-js";

/**
 * Admin "por lista blanca": alcanza con configurar ADMIN_EMAILS (separados
 * por coma) en el entorno. No es un sistema de roles — para un panel de
 * uso personal de la dueña del proyecto, es lo mínimo que hace falta.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export function esAdmin(user: User | null): boolean {
  return isAdminEmail(user?.email);
}
