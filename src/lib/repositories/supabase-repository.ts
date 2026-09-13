import { createClient } from "@/lib/supabase/server";
import type { FiltrosCatalogo, Local, Producto, ProductoConLocal } from "@/types";
import type { CatalogoRepository, OpcionesFiltro } from "@/lib/repository";

// Nombres de tabla esperados en Supabase (ver supabase/schema.sql).
const TABLA_PRODUCTOS = "productos";
const TABLA_LOCALES = "locales";

type ProductoRow = Producto;
type LocalRow = Local;

/**
 * Repositorio que lee de Supabase/Postgres siguiendo el modelo de datos
 * del brief (sección 4). Implementa el mismo contrato que el mock, así que
 * activarlo es cuestión de cambiar DATA_SOURCE=supabase en el entorno una
 * vez cargadas las tablas `locales` y `productos` (ver supabase/schema.sql).
 */
export class SupabaseCatalogoRepository implements CatalogoRepository {
  async listarProductos(filtros: FiltrosCatalogo): Promise<ProductoConLocal[]> {
    const supabase = await createClient();
    let query = supabase
      .from(TABLA_PRODUCTOS)
      .select("*, local:locales(*)");

    if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
    if (filtros.material) query = query.ilike("material", filtros.material);
    if (filtros.color) query = query.ilike("color", filtros.color);
    if (filtros.estilo) query = query.ilike("estilo", filtros.estilo);
    if (typeof filtros.precioMin === "number") query = query.gte("precio", filtros.precioMin);
    if (typeof filtros.precioMax === "number") query = query.lte("precio", filtros.precioMax);
    if (filtros.q) query = query.ilike("nombre", `%${filtros.q}%`);
    // filtros.ciudad se filtra sobre la tabla relacionada `local`,
    // se aplica en memoria más abajo porque PostgREST no permite
    // filtrar por columnas de una tabla embebida en el mismo `.eq`.

    const { data, error } = await query;
    if (error) throw error;

    let resultado = (data ?? []) as unknown as ProductoConLocal[];
    if (filtros.ciudad) {
      resultado = resultado.filter((p) => p.local?.ciudad === filtros.ciudad);
    }
    return resultado;
  }

  async obtenerProductoPorSlug(slug: string): Promise<ProductoConLocal | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLA_PRODUCTOS)
      .select("*, local:locales(*)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as ProductoConLocal | null) ?? null;
  }

  async listarRelacionados(ids: string[]): Promise<ProductoConLocal[]> {
    if (ids.length === 0) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLA_PRODUCTOS)
      .select("*, local:locales(*)")
      .in("id", ids);

    if (error) throw error;
    return (data ?? []) as unknown as ProductoConLocal[];
  }

  async listarLocales(): Promise<Local[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLA_LOCALES).select("*");
    if (error) throw error;
    return (data ?? []) as LocalRow[];
  }

  async obtenerOpcionesFiltro(): Promise<OpcionesFiltro> {
    const supabase = await createClient();
    const [{ data: productos, error: errProductos }, { data: locales, error: errLocales }] =
      await Promise.all([
        supabase.from(TABLA_PRODUCTOS).select("material,color,estilo,precio"),
        supabase.from(TABLA_LOCALES).select("ciudad"),
      ]);

    if (errProductos) throw errProductos;
    if (errLocales) throw errLocales;

    const filas = (productos ?? []) as Pick<
      ProductoRow,
      "material" | "color" | "estilo" | "precio"
    >[];
    const ciudadesFilas = (locales ?? []) as Pick<LocalRow, "ciudad">[];

    return {
      materiales: Array.from(new Set(filas.map((p) => p.material))).sort(),
      colores: Array.from(new Set(filas.map((p) => p.color))).sort(),
      estilos: Array.from(new Set(filas.map((p) => p.estilo))).sort(),
      ciudades: Array.from(new Set(ciudadesFilas.map((l) => l.ciudad))).sort(),
      precioMax: filas.length ? Math.max(...filas.map((p) => p.precio)) : 0,
    };
  }
}
