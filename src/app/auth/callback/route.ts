import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Supabase redirige acá después de que el usuario confirma su email (con un
// `code` en la query) para intercambiarlo por una sesión real.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/perfil";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No pudimos confirmar tu cuenta. Probá iniciar sesión de nuevo.")}`,
  );
}
