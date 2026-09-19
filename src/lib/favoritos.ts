import { createClient } from "@/lib/supabase/server";
import type { ProductoConLocal } from "@/types";

/** IDs de producto que el usuario ya guardó como favorito. */
export async function getFavoritoIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favoritos")
    .select("producto_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set((data ?? []).map((fila) => fila.producto_id as string));
}

/** Favoritos del usuario con el producto (y su local) ya resueltos, para la
 * pantalla de perfil. */
export async function getFavoritosConProducto(userId: string): Promise<ProductoConLocal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favoritos")
    .select("created_at, producto:productos(*, local:locales(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const filas = (data ?? []) as unknown as { producto: ProductoConLocal | null }[];
  return filas
    .map((fila) => fila.producto)
    .filter((producto): producto is ProductoConLocal => Boolean(producto));
}
