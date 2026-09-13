import type { Metadata } from "next";

import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogoRepository } from "@/lib/catalogo";
import type { CategoriaProducto, FiltrosCatalogo } from "@/types";

export const metadata: Metadata = {
  title: "Catálogo | Angie's List",
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

function parseFiltros(searchParams: SearchParams): FiltrosCatalogo {
  return {
    categoria: paramString(searchParams.categoria) as CategoriaProducto | undefined,
    ciudad: paramString(searchParams.ciudad),
    material: paramString(searchParams.material),
    color: paramString(searchParams.color),
    estilo: paramString(searchParams.estilo),
    precioMin: paramNumber(searchParams.precioMin),
    precioMax: paramNumber(searchParams.precioMax),
    q: paramString(searchParams.q),
  };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const filtros = parseFiltros(resolvedSearchParams);
  const repositorio = getCatalogoRepository();

  const [productos, opciones] = await Promise.all([
    repositorio.listarProductos(filtros),
    repositorio.obtenerOpcionesFiltro(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Catálogo</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {productos.length}{" "}
          {productos.length === 1 ? "producto encontrado" : "productos encontrados"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
        <aside>
          <CatalogFilters filtros={filtros} opciones={opciones} />
        </aside>

        <section>
          {productos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-zinc-500 dark:border-white/15">
              No encontramos productos con esos filtros. Probá ajustarlos.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
