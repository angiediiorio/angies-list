import type { Metadata } from "next";

import { LocalesMapLoader } from "@/components/LocalesMapLoader";
import { getCatalogoRepository } from "@/lib/catalogo";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Mapa de locales | ${BRAND_NAME}`,
  description: `Encontrá los locales curados por ${BRAND_NAME} cerca tuyo, filtrados por categoría.`,
};

export default async function MapaPage() {
  const locales = await getCatalogoRepository().listarLocales();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Mapa de locales
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {locales.length} {locales.length === 1 ? "local" : "locales"} curados.
          Filtrá por categoría y tocá un pin para ver el detalle.
        </p>
      </div>

      <LocalesMapLoader locales={locales} />
    </div>
  );
}
