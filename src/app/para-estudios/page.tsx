import type { Metadata } from "next";
import Link from "next/link";

import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Para estudios | ${BRAND_NAME}`,
  description:
    "Precios mayoristas, specs técnicas ampliadas y herramientas para armar propuestas a tus clientes.",
};

const BENEFICIOS = [
  {
    titulo: "Specs técnicas ampliadas",
    descripcion:
      "Fichas de datos completas por producto: planos, medidas de instalación, terminaciones y variantes que no se muestran en el catálogo público.",
  },
  {
    titulo: "Precios mayoristas",
    descripcion:
      "Acceso a la lista de precios para estudios, distinta a la que ve el cliente final.",
  },
  {
    titulo: "Armá propuestas para tus clientes",
    descripcion:
      "Agrupá productos de distintos locales en una propuesta única para presentarle a tu cliente.",
  },
  {
    titulo: "Exportar en PDF",
    descripcion: "Descargá el listado armado en PDF, con precios y specs, listo para enviar.",
  },
];

export default function ParaEstudiosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            Para estudios de arquitectura y diseño
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Armá las propuestas de tus proyectos más rápido
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Acceso a precios mayoristas, specs técnicas completas y una
            herramienta para armar y exportar propuestas para tus clientes,
            todo en un solo lugar.
          </p>
          <Link
            href="/para-estudios/solicitar"
            className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Solicitar acceso
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {BENEFICIOS.map((beneficio) => (
            <div
              key={beneficio.titulo}
              className="rounded-2xl border border-black/10 p-6 dark:border-white/10"
            >
              <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                {beneficio.titulo}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {beneficio.descripcion}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-black/15 p-6 text-center dark:border-white/15">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Revisamos cada solicitud a mano. Por ahora no hay pasarela de
            pago integrada — la facturación se coordina directamente una vez
            aprobada la cuenta.
          </p>
          <Link
            href="/para-estudios/solicitar"
            className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Solicitar acceso
          </Link>
        </div>
      </section>
    </div>
  );
}
