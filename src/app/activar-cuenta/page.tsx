import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthField } from "@/components/AuthField";
import { BRAND_NAME } from "@/lib/brand";
import { activarCuenta } from "@/lib/estudio-actions";
import { getCurrentUser } from "@/lib/supabase/current-user";

export const metadata: Metadata = {
  title: `Activar cuenta | ${BRAND_NAME}`,
};

type SearchParams = { error?: string };

export default async function ActivarCuentaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Activá tu cuenta</h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        Tu solicitud de estudio fue aprobada. Elegí una contraseña para{" "}
        <strong>{user.email}</strong> y listo.
      </p>

      <form action={activarCuenta} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <AuthField
          label="Nueva contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />

        <button
          type="submit"
          className="mt-2 rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Activar cuenta
        </button>
      </form>
    </div>
  );
}
