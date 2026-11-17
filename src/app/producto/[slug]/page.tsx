import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FavoritoButton } from "@/components/FavoritoButton";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/catalogo" className="hover:text-foreground">
          Catálogo
        </Link>{" "}
        / <span className="text-foreground/80">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
            {producto.imagenes[0] ? (
              <Image
                src={producto.imagenes[0]}
                alt={producto.nombre}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Sin foto
              </div>
            )}
          </div>
          {producto.imagenes.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {producto.imagenes.slice(1).map((imagen, i) => (
                <div
                  key={imagen}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
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
              <Badge variant="accent">{categoriaLabel}</Badge>
              <FavoritoButton
                productoId={producto.id}
                favoritoInicial={favoritoIds.has(producto.id)}
                logueado={Boolean(usuario)}
              />
            </div>
            <h1 className="mt-3 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              {producto.nombre}
            </h1>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatPrecio(producto.precio, producto.moneda)}
            </p>
            {!producto.stock && (
              <p className="mt-1 text-sm font-medium text-destructive">
                Sin stock disponible por el momento
              </p>
            )}
          </div>

          <p className="text-muted-foreground">{producto.descripcion}</p>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Detalles
            </p>
            <dl className="mt-2 divide-y divide-border border-t border-border">
              <SpecRow label="Material" valor={producto.material} />
              <SpecRow label="Color" valor={producto.color} />
              <SpecRow label="Estilo" valor={producto.estilo} />
              <SpecRow label="Medidas" valor={producto.medidas} />
            </dl>
          </div>

          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vendido por
            </p>
            <p className="mt-1 font-medium">{producto.local.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {producto.local.direccion
                ? `${producto.local.direccion}${producto.local.ciudad ? `, ${producto.local.ciudad}` : ""}`
                : "Tienda online"}
            </p>
          </Card>

          <Button asChild size="lg">
            <a href={producto.local.sitio_web} target="_blank" rel="noopener noreferrer">
              Ir a comprar en {producto.local.nombre} ↗
            </a>
          </Button>
          <p className="-mt-3 text-xs text-muted-foreground">
            Te redirigimos al sitio del local para completar la compra.{" "}
            {BRAND_NAME} no procesa pagos.
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-xl font-medium tracking-tight">
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

function SpecRow({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 text-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right font-medium">{valor}</dd>
    </div>
  );
}
