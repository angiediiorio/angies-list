import type { Metadata } from "next";

import { CopyLinkButton } from "@/components/CopyLinkButton";
import { BRAND_NAME } from "@/lib/brand";
import { crearInvitacionCliente, revocarInvitacion } from "@/lib/invitaciones-actions";
import { estadoDeInvitacion, getInvitacionesDelEstudio } from "@/lib/invitaciones";
import { requireEstudioAprobado } from "@/lib/perfiles";
import { getSiteUrl } from "@/lib/site-url";
import type { EstadoInvitacion, InvitacionCliente } from "@/types";

export const metadata: Metadata = {
  title: `Clientes invitados | ${BRAND_NAME}`,
};

type SearchParams = { error?: string };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireEstudioAprobado();
  const { error } = await searchParams;

  const [invitaciones, siteUrl] = await Promise.all([
    getInvitacionesDelEstudio(user.id),
    getSiteUrl(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Clientes invitados
      </h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        Generá un link para que un cliente tuyo pueda ver el catálogo y
        guardar favoritos por tiempo limitado. No puede invitar a otros.
      </p>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        action={crearInvitacionCliente}
        className="mb-10 flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="proyecto" className="text-sm font-medium">
            Proyecto (opcional)
          </label>
          <input
            id="proyecto"
            name="proyecto"
            type="text"
            placeholder="Ej: Casa Funes"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="diasValidez" className="text-sm font-medium">
            Duración (días)
          </label>
          <input
            id="diasValidez"
            name="diasValidez"
            type="number"
            min={1}
            defaultValue={30}
            className="w-28 rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Generar link
        </button>
      </form>

      {invitaciones.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Todavía no generaste ninguna invitación.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {invitaciones.map((invitacion) => (
            <InvitacionCard key={invitacion.id} invitacion={invitacion} siteUrl={siteUrl} />
          ))}
        </div>
      )}
    </div>
  );
}

const ETIQUETA_ESTADO: Record<EstadoInvitacion, { texto: string; clase: string }> = {
  pendiente: {
    texto: "Pendiente de uso",
    clase: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
  activo: {
    texto: "Activo",
    clase: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  expirado: {
    texto: "Expirado",
    clase: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  revocado: {
    texto: "Revocado",
    clase: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

function InvitacionCard({
  invitacion,
  siteUrl,
}: {
  invitacion: InvitacionCliente;
  siteUrl: string;
}) {
  const estado = estadoDeInvitacion(invitacion);
  const etiqueta = ETIQUETA_ESTADO[estado];
  const link = `${siteUrl}/invitacion/${invitacion.id}`;
  const puedeRevocar = estado === "pendiente" || estado === "activo";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{invitacion.proyecto || "Sin proyecto asignado"}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${etiqueta.clase}`}>
            {etiqueta.texto}
          </span>
        </div>

        {invitacion.cliente ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{invitacion.cliente.email}</p>
        ) : (
          <div className="flex items-center gap-2">
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-500">{link}</p>
            {estado === "pendiente" && <CopyLinkButton link={link} />}
          </div>
        )}

        <p className="mt-1 text-xs text-zinc-400">
          {invitacion.cliente?.expira_en
            ? `Vence el ${new Date(invitacion.cliente.expira_en).toLocaleDateString("es-AR")}`
            : `Válido por ${invitacion.dias_validez} días desde que se use`}
        </p>
      </div>

      {puedeRevocar && (
        <form action={revocarInvitacion} className="shrink-0">
          <input type="hidden" name="id" value={invitacion.id} />
          <button
            type="submit"
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Revocar
          </button>
        </form>
      )}
    </div>
  );
}
