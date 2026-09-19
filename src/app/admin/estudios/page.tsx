import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin-auth";
import { BRAND_NAME } from "@/lib/brand";
import { aprobarSolicitud, rechazarSolicitud } from "@/lib/estudio-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured } from "@/lib/supabase/is-configured";
import { getCurrentUser } from "@/lib/supabase/current-user";
import type { SolicitudEstudio } from "@/types";

export const metadata: Metadata = {
  title: `Admin · Solicitudes de estudios | ${BRAND_NAME}`,
};

type SearchParams = { error?: string };

export default async function AdminEstudiosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) redirect("/");

  const { error } = await searchParams;

  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Falta configurar <code>SUPABASE_SERVICE_ROLE_KEY</code> en el
          entorno para poder ver y aprobar solicitudes.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data, error: errorLectura } = await admin
    .from("solicitudes_estudio")
    .select("*")
    .order("created_at", { ascending: false });

  if (errorLectura) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          No pudimos leer las solicitudes: {errorLectura.message}. Si el
          error dice que la tabla no existe, falta correr
          supabase/schema-b2b.sql.
        </p>
      </div>
    );
  }

  const solicitudes = (data ?? []) as SolicitudEstudio[];
  const pendientes = solicitudes.filter((s) => s.estado === "pendiente");
  const resueltas = solicitudes.filter((s) => s.estado !== "pendiente");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
        Solicitudes de estudios
      </h1>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium">
          Pendientes ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map((solicitud) => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud} accionable />
            ))}
          </div>
        )}
      </section>

      {resueltas.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-medium">Resueltas</h2>
          <div className="flex flex-col gap-3">
            {resueltas.map((solicitud) => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud} accionable={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SolicitudCard({
  solicitud,
  accionable,
}: {
  solicitud: SolicitudEstudio;
  accionable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
      <div>
        <p className="font-medium">{solicitud.nombre_estudio}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {solicitud.email} · {solicitud.cuit_matricula}
        </p>
        {solicitud.sitio_web_instagram && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {solicitud.sitio_web_instagram}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-400">
          Solicitado el {new Date(solicitud.created_at).toLocaleDateString("es-AR")}
        </p>
      </div>

      {accionable ? (
        <div className="flex shrink-0 gap-2">
          <form action={aprobarSolicitud}>
            <input type="hidden" name="id" value={solicitud.id} />
            <button
              type="submit"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Aprobar
            </button>
          </form>
          <form action={rechazarSolicitud}>
            <input type="hidden" name="id" value={solicitud.id} />
            <button
              type="submit"
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Rechazar
            </button>
          </form>
        </div>
      ) : (
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            solicitud.estado === "aprobado"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {solicitud.estado === "aprobado" ? "Aprobada" : "Rechazada"}
        </span>
      )}
    </div>
  );
}
