import Link from "next/link";

import { CATEGORIAS_PRODUCTO, type FiltrosCatalogo } from "@/types";
import type { OpcionesFiltro } from "@/lib/repository";

interface CatalogFiltersProps {
  filtros: FiltrosCatalogo;
  opciones: OpcionesFiltro;
}

// Formulario GET clásico: funciona sin JavaScript y deja la URL como
// única fuente de verdad de los filtros aplicados (fácil de compartir /
// enlazar directamente a un catálogo ya filtrado).
export function CatalogFilters({ filtros, opciones }: CatalogFiltersProps) {
  return (
    <form
      method="get"
      className="flex flex-col gap-5 rounded-2xl border border-black/10 p-5 dark:border-white/10"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="q" className="text-sm font-medium">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="text"
          defaultValue={filtros.q ?? ""}
          placeholder="Nombre, local, descripción..."
          className="rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
        />
      </div>

      <FiltroSelect
        label="Tipo de producto"
        name="categoria"
        value={filtros.categoria ?? ""}
        opciones={CATEGORIAS_PRODUCTO.map((c) => ({ value: c.value, label: c.label }))}
      />

      <FiltroSelect
        label="Ubicación del local"
        name="ciudad"
        value={filtros.ciudad ?? ""}
        opciones={opciones.ciudades.map((c) => ({ value: c, label: c }))}
      />

      <FiltroSelect
        label="Material"
        name="material"
        value={filtros.material ?? ""}
        opciones={opciones.materiales.map((m) => ({ value: m, label: m }))}
      />

      <FiltroSelect
        label="Color"
        name="color"
        value={filtros.color ?? ""}
        opciones={opciones.colores.map((c) => ({ value: c, label: c }))}
      />

      <FiltroSelect
        label="Estilo"
        name="estilo"
        value={filtros.estilo ?? ""}
        opciones={opciones.estilos.map((e) => ({ value: e, label: e }))}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Precio</span>
        <div className="flex items-center gap-2">
          <input
            name="precioMin"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={filtros.precioMin ?? ""}
            placeholder="Mín"
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
          <span className="text-zinc-400">–</span>
          <input
            name="precioMax"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={filtros.precioMax ?? ""}
            placeholder={`Máx (hasta ${opciones.precioMax.toLocaleString("es-AR")})`}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Aplicar filtros
        </button>
        <Link
          href="/catalogo"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
        >
          Limpiar
        </Link>
      </div>
    </form>
  );
}

function FiltroSelect({
  label,
  name,
  value,
  opciones,
}: {
  label: string;
  name: string;
  value: string;
  opciones: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
      >
        <option value="">Todos</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
