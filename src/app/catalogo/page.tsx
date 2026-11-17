import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogoRepository } from "@/lib/catalogo";
import { BRAND_NAME } from "@/lib/brand";
import { getFavoritoIds } from "@/lib/favoritos";
import { getCurrentUser } from "@/lib/supabase/current-user";
import type { CategoriaProducto, FiltrosCatalogo } from "@/types";

export const metadata: Metadata = {
  title: `Catálogo | ${BRAND_NAME}`,
  description:
    "Buscá y compará muebles, iluminación, decoración, revestimientos y grifería de locales curados.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function paramString(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() !== "" ? v : undefined;
}

function paramNumber(value: string | string[] | undefined): number | undefined {
  const str = paramString(value);
  if (!str) return undefined;
  const n = Number(str);
  return Number.isFinite(n) ? n : undefined;
}

function parseFiltros(searchParams: SearchParams, soloDestacados: boolean): FiltrosCatalogo {
  return {
    categoria: paramString(searchParams.categoria) as CategoriaProducto | undefined,
    ciudad: paramString(searchParams.ciudad),
    material: paramString(searchParams.material),
    color: paramString(searchParams.color),
    estilo: paramString(searchParams.estilo),
    precioMin: paramNumber(searchParams.precioMin),
    precioMax: paramNumber(searchParams.precioMax),
    q: paramString(searchParams.q),
    soloDestacados,
  };
}

// Toggle "ver catálogo completo" sin perder el resto de los filtros
// aplicados — arma la misma URL con el único parámetro ?todos cambiado.
function hrefConToggleTodos(searchParams: SearchParams, mostrarTodos: boolean): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "todos" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  if (mostrarTodos) params.set("todos", "1");
  const qs = params.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const mostrarTodos = paramString(resolvedSearchParams.todos) === "1";
  const filtros = parseFiltros(resolvedSearchParams, !mostrarTodos);
  const repositorio = getCatalogoRepository();

  const [productos, opciones, usuario] = await Promise.all([
    repositorio.listarProductos(filtros),
    repositorio.obtenerOpcionesFiltro(!mostrarTodos),
    getCurrentUser(),
  ]);
  const favoritoIds = usuario ? await getFavoritoIds(usuario.id) : new Set<string>();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Catálogo
        </h1>
        <p className="text-muted-foreground">
          {productos.length}{" "}
          {productos.length === 1 ? "producto encontrado" : "productos encontrados"}
        </p>
        <p className="text-sm text-muted-foreground">
          {mostrarTodos ? (
            <>
              Mostrando el catálogo completo, sin curar.{" "}
              <Link
                href={hrefConToggleTodos(resolvedSearchParams, false)}
                className="font-medium underline underline-offset-2 hover:text-foreground"
              >
                Ver solo destacados
              </Link>
            </>
          ) : (
            <>
              Mostrando la selección curada para la demo.{" "}
              <Link
                href={hrefConToggleTodos(resolvedSearchParams, true)}
                className="font-medium underline underline-offset-2 hover:text-foreground"
              >
                Ver catálogo completo
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
        <aside>
          <CatalogFilters filtros={filtros} opciones={opciones} />
        </aside>

        <section>
          {productos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No encontramos productos con esos filtros. Probá ajustarlos.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  favorito={favoritoIds.has(producto.id)}
                  logueado={Boolean(usuario)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
