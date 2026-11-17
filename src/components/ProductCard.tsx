import Image from "next/image";
import Link from "next/link";

import { FavoritoButton } from "@/components/FavoritoButton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrecio } from "@/lib/format";
import type { ProductoConLocal } from "@/types";

interface ProductCardProps {
  producto: ProductoConLocal;
  favorito?: boolean;
  logueado?: boolean;
}

export function ProductCard({ producto, favorito = false, logueado = false }: ProductCardProps) {
  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      {/* Link "estirado": cubre toda la card para que sea clickeable, pero
          vive al lado (no adentro) del botón de favorito para no anidar
          elementos interactivos. */}
      <Link
        href={`/producto/${producto.slug}`}
        aria-label={producto.nombre}
        className="absolute inset-0 z-0"
      />

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {producto.imagenes[0] ? (
          <Image
            src={producto.imagenes[0]}
            alt={producto.nombre}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Sin foto
          </div>
        )}
        {!producto.stock && (
          <Badge variant="default" className="absolute left-3 top-3 z-10">
            Sin stock
          </Badge>
        )}
        <FavoritoButton
          productoId={producto.id}
          favoritoInicial={favorito}
          logueado={logueado}
          className="absolute right-3 top-3 z-10"
        />
      </div>
      <div className="pointer-events-none relative z-0 flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {producto.local.nombre}
        </span>
        <h3 className="line-clamp-2 font-display font-medium text-foreground">
          {producto.nombre}
        </h3>
        <p className="mt-auto pt-2 font-semibold text-foreground">
          {formatPrecio(producto.precio, producto.moneda)}
        </p>
      </div>
    </Card>
  );
}
