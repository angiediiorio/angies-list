import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
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
  const heroProducto = destacados[0];
  const favoritoIds = usuario ? await getFavoritoIds(usuario.id) : new Set<string>();

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wide text-secondary-foreground">
              Herramienta para estudios de arquitectura y diseño
            </span>
            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Un catálogo curado para cada proyecto
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              {BRAND_NAME} reúne muebles, decoración, iluminación,
              revestimientos y grifería de locales curados en un solo
              catálogo, para que armes propuestas más rápido, compartas
              selecciones con tus clientes y compres directo en el sitio de
              cada local.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/para-estudios">Solicitar acceso</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/catalogo">Explorar catálogo</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-muted">
              {heroProducto?.imagenes[0] ? (
                <Image
                  src={heroProducto.imagenes[0]}
                  alt={heroProducto.nombre}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  {BRAND_NAME}
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 left-4 flex flex-col gap-3 sm:-left-6">
              <Link
                href="/catalogo"
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg transition-colors hover:bg-secondary"
              >
                Ver catálogo →
              </Link>
              <Link
                href="/para-estudios"
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg transition-colors hover:bg-secondary"
              >
                Para estudios →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Categorías
          </h2>
          <Link href="/mapa" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Ver mapa de locales →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIAS_PRODUCTO.map((categoria) => (
            <Link
              key={categoria.value}
              href={`/catalogo?categoria=${categoria.value}`}
              className="rounded-xl border border-border bg-card px-4 py-6 text-center text-sm font-medium transition-colors hover:bg-secondary"
            >
              {categoria.label}
            </Link>
          ))}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Destacados
            </h2>
            <Link href="/catalogo" className="text-sm font-medium text-muted-foreground hover:text-foreground">
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

      <section className="border-t border-border bg-secondary py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:px-6">
          <p className="text-sm text-secondary-foreground/80">
            ¿Tenés un local de muebles, decoración o iluminación?
          </p>
          <a
            href={`mailto:${BRAND_EMAIL}`}
            className="text-sm font-semibold text-secondary-foreground underline underline-offset-2"
          >
            Sumar mi local →
          </a>
        </div>
      </section>
    </div>
  );
}
