import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la Service Role Key: bypassea RLS por completo y puede
 * administrar usuarios (auth.admin.*, como invitar por email).
 *
 * ⚠️ SOLO se importa desde código que corre exclusivamente en el
 * servidor (Server Actions, Route Handlers, Server Components de
 * /admin) — nunca desde un Client Component ni desde nada expuesto al
 * navegador. La key nunca lleva el prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para usar el cliente admin de Supabase.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
