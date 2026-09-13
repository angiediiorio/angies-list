import { MockCatalogoRepository } from "@/lib/repositories/mock-repository";
import { SupabaseCatalogoRepository } from "@/lib/repositories/supabase-repository";
import type { CatalogoRepository } from "@/lib/repository";

/**
 * Punto único de conmutación entre datos mock y Supabase.
 *
 * Por defecto usa el mock para poder validar las pantallas de Catálogo y
 * Ficha de producto sin depender de infraestructura. Cuando la base real
 * esté cargada (ver supabase/schema.sql), alcanza con setear en el entorno:
 *
 *   DATA_SOURCE=supabase
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */
function crearRepositorio(): CatalogoRepository {
  const dataSource = process.env.DATA_SOURCE ?? "mock";
  return dataSource === "supabase"
    ? new SupabaseCatalogoRepository()
    : new MockCatalogoRepository();
}

let repositorio: CatalogoRepository | null = null;

export function getCatalogoRepository(): CatalogoRepository {
  if (!repositorio) {
    repositorio = crearRepositorio();
  }
  return repositorio;
}
