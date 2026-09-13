import type { FiltrosCatalogo, Local, ProductoConLocal } from "@/types";

export interface OpcionesFiltro {
  ciudades: string[];
  materiales: string[];
  colores: string[];
  estilos: string[];
  precioMax: number;
}

/**
 * Contrato de acceso a datos del catálogo. Tanto el repositorio mock como
 * el de Supabase implementan esta misma interfaz, así las páginas no saben
 * (ni les importa) de dónde vienen los datos.
 */
export interface CatalogoRepository {
  listarProductos(filtros: FiltrosCatalogo): Promise<ProductoConLocal[]>;
  obtenerProductoPorSlug(slug: string): Promise<ProductoConLocal | null>;
  listarRelacionados(ids: string[]): Promise<ProductoConLocal[]>;
  listarLocales(): Promise<Local[]>;
  obtenerOpcionesFiltro(): Promise<OpcionesFiltro>;
}
