import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { getCatalogoRepository } from "@/lib/catalogo";
import { BRAND_EMAIL, BRAND_NAME } from "@/lib/brand";
import { getFavoritoIds } from "@/lib/favoritos";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CATEGORIAS_PRODUCTO } from "@/types";

export default async function Home() {
  const repositorio = getCatalogoRepository();
  const [productosDestacados, usuario] = await Promise.all([
    repositorio.listarProductos({ soloDestacados: true }),
    getCurrentUser(),
  ]);
  const destacados = productosDestacados.slice(0, 3);
  const favoritoIds = usuario ? await getFavoritoIds(usuario.id) : new Set<string>();

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            Herramienta para estudios de arquitectura y diseño
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Un catálogo curado para cada proyecto, no veinte pestañas abiertas
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            {BRAND_NAME} reúne muebles, decoración, iluminación,
            revestimientos y grifería de locales curados en un solo catálogo,
            para que armes propuestas más rápido, compartas selecciones con
            tus clientes y compres directo en el sitio de cada local.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/para-estudios"
              className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Solicitar acceso
            </Link>
            <Link
              href="/catalogo"
              className="rounded-full border border-black/15 px-6 py-3 text-center text-sm font-semibold text-zinc-800 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-100 dark:hover:bg-white/10"
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Categorías
          </h2>
          <Link
            href="/mapa"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            Ver mapa de locales →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIAS_PRODUCTO.map((categoria) => (
            <Link
              key={categoria.value}
              href={`/catalogo?categoria=${categoria.value}`}
              className="rounded-xl border border-black/10 px-4 py-6 text-center text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              {categoria.label}
            </Link>
          ))}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Destacados
            </h2>
            <Link
              href="/catalogo"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Ver todo el catálogo →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {destacados.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                favorito={favoritoIds.has(producto.id)}
                logueado={Boolean(usuario)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-black/10 bg-zinc-50 py-10 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:px-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ¿Tenés un local de muebles, decoración o iluminación?
          </p>
          <a
            href={`mailto:${BRAND_EMAIL}`}
            className="text-sm font-semibold text-zinc-950 underline underline-offset-2 dark:text-white"
          >
            Sumar mi local →
          </a>
        </div>
      </section>
    </div>
  );
}
