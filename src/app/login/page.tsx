import type { Metadata } from "next";
import Link from "next/link";

import { AuthField } from "@/components/AuthField";
import { login } from "@/lib/auth-actions";
import { BRAND_NAME } from "@/lib/brand";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const metadata: Metadata = {
  title: `Iniciar sesión | ${BRAND_NAME}`,
};

type SearchParams = { error?: string; next?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        Necesario solo para guardar favoritos. Navegar y comprar no requiere cuenta.
      </p>

      {!isSupabaseConfigured() ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          El login todavía no está configurado en este entorno (faltan las
          credenciales de Supabase).
        </p>
      ) : (
        <form action={login} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? "/perfil"} />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <AuthField label="Email" name="email" type="email" autoComplete="email" required />
          <AuthField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className="mt-2 rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Ingresar
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-zinc-950 underline dark:text-white">
          Registrate
        </Link>
      </p>
    </div>
  );
}
