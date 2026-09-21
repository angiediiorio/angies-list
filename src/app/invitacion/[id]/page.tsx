import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthField } from "@/components/AuthField";
import { BRAND_NAME } from "@/lib/brand";
import { reclamarInvitacion } from "@/lib/invitaciones-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured } from "@/lib/supabase/is-configured";

export const metadata: Metadata = {
  title: `Acceso de cliente | ${BRAND_NAME}`,
};

type SearchParams = { error?: string };

export default async function InvitacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  if (!isAdminConfigured()) {
    return (
      <Contenedor>
        <Aviso>
          Este link todavía no está disponible (falta configuración del
          lado del servidor).
        </Aviso>
      </Contenedor>
    );
  }

  const admin = createAdminClient();
  const { data: invitacion } = await admin
    .from("invitaciones_cliente")
    .select("id, proyecto, dias_validez, usado_en, revocado_en, estudio:perfiles!estudio_id(nombre_estudio)")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      proyecto: string | null;
      dias_validez: number;
      usado_en: string | null;
      revocado_en: string | null;
      estudio: { nombre_estudio: string | null } | null;
    }>();

  if (!invitacion || invitacion.revocado_en || invitacion.usado_en) {
    return (
      <Contenedor>
        <Aviso>Este link ya no es válido — pedile uno nuevo a tu estudio.</Aviso>
      </Contenedor>
    );
  }

  return (
    <Contenedor>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Acceso de {invitacion.estudio?.nombre_estudio ?? "tu estudio"}
      </h1>
      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
        {invitacion.proyecto && <>Proyecto: {invitacion.proyecto}. </>}
        Creá tu acceso para ver el catálogo completo y guardar tus favoritos
        — dura {invitacion.dias_validez} días desde hoy.
      </p>
      <p className="mb-8 text-xs text-zinc-500 dark:text-zinc-500">
        No podés invitar a otras personas con esta cuenta.
      </p>

      <form action={reclamarInvitacion} className="flex flex-col gap-4">
        <input type="hidden" name="invitacionId" value={invitacion.id} />

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
          autoComplete="new-password"
          minLength={6}
          required
        />

        <button
          type="submit"
          className="mt-2 rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Crear mi acceso
        </button>
      </form>
    </Contenedor>
  );
}

function Contenedor({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      {children}
    </div>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      {children}
    </p>
  );
}
