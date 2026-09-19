import type { Metadata } from "next";
import Link from "next/link";

import { AuthField } from "@/components/AuthField";
import { BRAND_NAME } from "@/lib/brand";
import { solicitarAcceso } from "@/lib/estudio-actions";

export const metadata: Metadata = {
  title: `Solicitar acceso para estudios | ${BRAND_NAME}`,
};

type SearchParams = { error?: string; enviado?: string };

export default async function SolicitarAccesoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, enviado } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      {enviado ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950">
          <h1 className="mb-2 text-xl font-semibold text-emerald-900 dark:text-emerald-100">
            Tu solicitud está en revisión
          </h1>
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            La revisamos a mano y te vamos a escribir por email con los
            próximos pasos para activar tu cuenta. Mientras tanto podés
            seguir explorando el{" "}
            <Link href="/catalogo" className="underline">
              catálogo
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">
            Solicitar acceso para estudios
          </h1>
          <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
            Revisamos cada solicitud a mano antes de habilitar la cuenta.
          </p>

          <form action={solicitarAcceso} className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <AuthField
              label="Nombre del estudio"
              name="nombreEstudio"
              type="text"
              autoComplete="organization"
              required
            />
            <AuthField
              label="CUIT o matrícula profesional"
              name="cuitMatricula"
              type="text"
              autoComplete="off"
              required
            />
            <AuthField label="Email" name="email" type="email" autoComplete="email" required />
            <AuthField
              label="Sitio web o Instagram del estudio"
              name="sitioWebInstagram"
              type="text"
              autoComplete="url"
            />

            <button
              type="submit"
              className="mt-2 rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Enviar solicitud
            </button>
          </form>
        </>
      )}
    </div>
  );
}
