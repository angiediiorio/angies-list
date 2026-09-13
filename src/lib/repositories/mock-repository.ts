import { mockLocales } from "@/data/mock-locales";
import { mockProductos } from "@/data/mock-productos";
import type { FiltrosCatalogo, Local, ProductoConLocal } from "@/types";
import type { CatalogoRepository, OpcionesFiltro } from "@/lib/repository";

function conLocal(producto: (typeof mockProductos)[number]): ProductoConLocal {
  const local = mockLocales.find((l) => l.id === producto.local_id);
  if (!local) {
    throw new Error(`Local no encontrado para producto ${producto.id}`);
  }
  return { ...producto, local };
}

// Simula latencia de red para que el catálogo se sienta como una app
// conectada a una base de datos real, aun usando datos en memoria.
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

export class MockCatalogoRepository implements CatalogoRepository {
  async listarProductos(filtros: FiltrosCatalogo): Promise<ProductoConLocal[]> {
    let resultado = mockProductos.map(conLocal);

    if (filtros.categoria) {
      resultado = resultado.filter((p) => p.categoria === filtros.categoria);
    }
    if (filtros.ciudad) {
      resultado = resultado.filter((p) => p.local.ciudad === filtros.ciudad);
    }
    if (filtros.material) {
      resultado = resultado.filter(
        (p) => p.material.toLowerCase() === filtros.material!.toLowerCase(),
      );
    }
    if (filtros.color) {
      resultado = resultado.filter(
        (p) => p.color.toLowerCase() === filtros.color!.toLowerCase(),
      );
    }
    if (filtros.estilo) {
      resultado = resultado.filter(
        (p) => p.estilo.toLowerCase() === filtros.estilo!.toLowerCase(),
      );
    }
    if (typeof filtros.precioMin === "number") {
      resultado = resultado.filter((p) => p.precio >= filtros.precioMin!);
    }
    if (typeof filtros.precioMax === "number") {
      resultado = resultado.filter((p) => p.precio <= filtros.precioMax!);
    }
    if (filtros.q) {
      const q = filtros.q.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          p.local.nombre.toLowerCase().includes(q),
      );
    }

    return delay(resultado);
  }

  async obtenerProductoPorSlug(slug: string): Promise<ProductoConLocal | null> {
    const producto = mockProductos.find((p) => p.slug === slug);
    return delay(producto ? conLocal(producto) : null);
  }

  async listarRelacionados(ids: string[]): Promise<ProductoConLocal[]> {
    const relacionados = ids
      .map((id) => mockProductos.find((p) => p.id === id))
      .filter((p): p is (typeof mockProductos)[number] => Boolean(p))
      .map(conLocal);
    return delay(relacionados);
  }

  async listarLocales(): Promise<Local[]> {
    return delay(mockLocales);
  }

  async obtenerOpcionesFiltro(): Promise<OpcionesFiltro> {
    const ciudades = Array.from(new Set(mockLocales.map((l) => l.ciudad))).sort();
    const materiales = Array.from(new Set(mockProductos.map((p) => p.material))).sort();
    const colores = Array.from(new Set(mockProductos.map((p) => p.color))).sort();
    const estilos = Array.from(new Set(mockProductos.map((p) => p.estilo))).sort();
    const precioMax = Math.max(...mockProductos.map((p) => p.precio));

    return delay({ ciudades, materiales, colores, estilos, precioMax });
  }
}
