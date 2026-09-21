import { NextResponse } from "next/server";

import { cerrarSesionSiAccesoExpirado, getPerfil } from "@/lib/perfiles";
import { createClient } from "@/lib/supabase/server";

// Toggle: si el producto ya estaba en favoritos lo saca, si no lo agrega.
// RLS en la tabla `favoritos` (ver supabase/schema.sql) garantiza que cada
// usuario solo puede leer/escribir sus propias filas.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const perfil = await getPerfil(user.id);
  if (await cerrarSesionSiAccesoExpirado(perfil)) {
    return NextResponse.json({ error: "Tu acceso expiró. Consultá con tu estudio." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productoId = body?.productoId as string | undefined;
  if (!productoId) {
    return NextResponse.json({ error: "Falta productoId" }, { status: 400 });
  }

  const { data: existente, error: errorLectura } = await supabase
    .from("favoritos")
    .select("producto_id")
    .eq("user_id", user.id)
    .eq("producto_id", productoId)
    .maybeSingle();

  if (errorLectura) {
    return NextResponse.json({ error: errorLectura.message }, { status: 500 });
  }

  if (existente) {
    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("user_id", user.id)
      .eq("producto_id", productoId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favorito: false });
  }

  const { error } = await supabase
    .from("favoritos")
    .insert({ user_id: user.id, producto_id: productoId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorito: true });
}
