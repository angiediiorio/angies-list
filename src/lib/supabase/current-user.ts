import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { createClient } from "@/lib/supabase/server";

/** Usuario logueado en el request actual, o null si no hay sesión (o si
 * Supabase todavía no está configurado). Para usar en Server Components. */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
