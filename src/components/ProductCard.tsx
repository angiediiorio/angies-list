import Image from "next/image";
import Link from "next/link";

import { formatPrecio } from "@/lib/format";
import type { ProductoConLocal } from "@/types";

export function ProductCard({ producto }: { producto: ProductoConLocal }) {
  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={producto.imagenes[0]}
          alt={producto.nombre}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!producto.stock && (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-white">
            Sin stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {producto.local.nombre}
        </span>
        <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-50">
          {producto.nombre}
        </h3>
        <p className="mt-auto pt-2 font-semibold text-zinc-950 dark:text-white">
          {formatPrecio(producto.precio, producto.moneda)}
        </p>
      </div>
    </Link>
  );
}
