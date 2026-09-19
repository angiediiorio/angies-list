// Tipos del dominio de habit·AN·do.
// Reflejan el modelo de datos del brief técnico (sección 4) y sirven tanto
// para los datos mock como, más adelante, para las filas de Supabase.

export type CategoriaProducto =
  | "mueble"
  | "decoracion"
  | "iluminacion"
  | "revestimiento"
  | "griferia";

export const CATEGORIAS_PRODUCTO: { value: CategoriaProducto; label: string }[] = [
  { value: "mueble", label: "Muebles" },
  { value: "decoracion", label: "Decoración" },
  { value: "iluminacion", label: "Iluminación" },
  { value: "revestimiento", label: "Revestimientos" },
  { value: "griferia", label: "Grifería" },
];

export interface Local {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
  contacto: string;
  sitio_web: string;
}

export interface Producto {
  id: string;
  slug: string;
  local_id: string;
  nombre: string;
  categoria: CategoriaProducto;
  precio: number;
  moneda: string;
  material: string;
  color: string;
  estilo: string;
  medidas: string;
  stock: boolean;
  descripcion: string;
  imagenes: string[];
  producto_relacionado_ids: string[];
}

// Producto "enriquecido" con el local ya resuelto — lo que consumen las
// páginas y componentes de UI.
export interface ProductoConLocal extends Producto {
  local: Local;
}

export interface FiltrosCatalogo {
  categoria?: CategoriaProducto;
  ciudad?: string;
  material?: string;
  color?: string;
  estilo?: string;
  precioMin?: number;
  precioMax?: number;
  q?: string;
}
