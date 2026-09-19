import type { Metadata } from "next";

import { BRAND_NAME } from "@/lib/brand";
import { requireEstudioAprobado } from "@/lib/perfiles";

export const metadata: Metadata = {
  title: `Panel de estudio | ${BRAND_NAME}`,
};

// Placeholder del panel B2B: la parte que importa acá es el control de
// acceso (requireEstudioAprobado redirige a /para-estudios si no
// corresponde). El contenido real de cada sección — precios mayoristas,
// specs ampliadas, export a PDF — queda para una siguiente iteración.
export default async function EstudiosPage() {
  const { perfil } = await requireEstudioAprobado();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          Cuenta de estudio aprobada
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {perfil.nombre_estudio}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Placeholder titulo="Precios mayoristas" />
        <Placeholder titulo="Specs técnicas ampliadas" />
        <Placeholder titulo="Exportar propuesta en PDF" />
      </div>
    </div>
  );
}

function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center dark:border-white/15">
      <h2 className="mb-2 font-medium">{titulo}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Próximamente</p>
    </div>
  );
}
