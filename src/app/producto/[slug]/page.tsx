import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FavoritoButton } from "@/components/FavoritoButton";
import { ProductCard } from "@/components/ProductCard";
import { getCatalogoRepository } from "@/lib/catalogo";
import { BRAND_NAME } from "@/lib/brand";
import { getFavoritoIds } from "@/lib/favoritos";
import { formatPrecio } from "@/lib/format";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CATEGORIAS_PRODUCTO } from "@/types";

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getCatalogoRepository().obtenerProductoPorSlug(slug);

  if (!producto) return { title: `Producto no encontrado | ${BRAND_NAME}` };

  return {
    title: `${producto.nombre} | ${BRAND_NAME}`,
    description: producto.descripcion,
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const repositorio = getCatalogoRepository();
  const producto = await repositorio.obtenerProductoPorSlug(slug);

  if (!producto) notFound();

  const [relacionados, usuario] = await Promise.all([
    repositorio.listarRelacionados(producto.producto_relacionado_ids),
    getCurrentUser(),
  ]);
  const favoritoIds = usuario ? await getFavoritoIds(usuario.id) : new Set<string>();
  const categoriaLabel =
    CATEGORIAS_PRODUCTO.find((c) => c.value === producto.categoria)?.label ??
    producto.categoria;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/catalogo" className="hover:text-zinc-950 dark:hover:text-white">
          Catálogo
        </Link>{" "}
        / <span className="text-zinc-700 dark:text-zinc-300">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <Image
              src={producto.imagenes[0]}
              alt={producto.nombre}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
          {producto.imagenes.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {producto.imagenes.slice(1).map((imagen, i) => (
                <div
                  key={imagen}
                  className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"
                >
                  <Image
                    src={imagen}
                    alt={`${producto.nombre} - foto ${i + 2}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {categoriaLabel}
              </span>
              <FavoritoButton
                productoId={producto.id}
                favoritoInicial={favoritoIds.has(producto.id)}
                logueado={Boolean(usuario)}
                className="border border-black/10 dark:border-white/10"
              />
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {producto.nombre}
            </h1>
            <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
              {formatPrecio(producto.precio, producto.moneda)}
            </p>
            {!producto.stock && (
              <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                Sin stock disponible por el momento
              </p>
            )}
          </div>

          <p className="text-zinc-600 dark:text-zinc-400">{producto.descripcion}</p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-black/10 p-4 text-sm dark:border-white/10">
            <Detalle label="Material" valor={producto.material} />
            <Detalle label="Color" valor={producto.color} />
            <Detalle label="Estilo" valor={producto.estilo} />
            <Detalle label="Medidas" valor={producto.medidas} />
          </dl>

          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Vendido por
            </p>
            <p className="mt-1 font-medium">{producto.local.nombre}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {producto.local.direccion}, {producto.local.ciudad}
            </p>
          </div>

          <a
            href={producto.local.sitio_web}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Ir a comprar en {producto.local.nombre} ↗
          </a>
          <p className="-mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            Te redirigimos al sitio del local para completar la compra.{" "}
            {BRAND_NAME} no procesa pagos.
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Productos complementarios
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionados.map((r) => (
              <ProductCard
                key={r.id}
                producto={r}
                favorito={favoritoIds.has(r.id)}
                logueado={Boolean(usuario)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Detalle({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}
