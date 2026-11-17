import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
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
    <form method="get" className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          name="q"
          type="text"
          defaultValue={filtros.q ?? ""}
          placeholder="Nombre, local, descripción..."
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
        <Label>Precio</Label>
        <div className="flex items-center gap-2">
          <Input
            name="precioMin"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={filtros.precioMin ?? ""}
            placeholder="Mín"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            name="precioMax"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={filtros.precioMax ?? ""}
            placeholder={`Máx (hasta ${opciones.precioMax.toLocaleString("es-AR")})`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" className="flex-1">
          Aplicar filtros
        </Button>
        <Link
          href="/catalogo"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
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
      <Label htmlFor={name}>{label}</Label>
      <SelectNative id={name} name={name} defaultValue={value}>
        <option value="">Todos</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectNative>
    </div>
  );
}
