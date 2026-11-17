import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { isAdminEmail } from "@/lib/admin-auth";
import { BRAND_NAME } from "@/lib/brand";
import { actualizarFotoDestacado, cambiarProductoDestacado } from "@/lib/destacados-actions";
import { formatPrecio } from "@/lib/format";
import { capitalizarOracion } from "@/lib/texto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured } from "@/lib/supabase/is-configured";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { CATEGORIAS_PRODUCTO, type CategoriaProducto } from "@/types";

export const metadata: Metadata = {
  title: `Admin · Destacados de la demo | ${BRAND_NAME}`,
};

type SearchParams = { error?: string };

interface ProductoFila {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  precio: number;
  moneda: string;
  imagenes: string[];
  imagen_posicion: string | null;
  destacado_demo: boolean;
  local_id: string;
  local: { nombre: string; sitio_web: string } | { nombre: string; sitio_web: string }[] | null;
}

const OPCIONES_POSICION = [
  { value: "", label: "Centro (default)" },
  { value: "50% 0%", label: "Arriba" },
  { value: "50% 100%", label: "Abajo" },
  { value: "0% 50%", label: "Izquierda" },
  { value: "100% 50%", label: "Derecha" },
];

function nombreLocal(local: ProductoFila["local"]): string {
  if (!local) return "?";
  return Array.isArray(local) ? (local[0]?.nombre ?? "?") : local.nombre;
}

function categoriaLabel(categoria: CategoriaProducto): string {
  return CATEGORIAS_PRODUCTO.find((c) => c.value === categoria)?.label ?? categoria;
}

export default async function AdminDestacadosPage({
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
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Falta configurar <code>SUPABASE_SERVICE_ROLE_KEY</code> en el entorno.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data, error: errorLectura } = await admin
    .from("productos")
    .select(
      "id,nombre,categoria,precio,moneda,imagenes,imagen_posicion,destacado_demo,local_id,local:locales(nombre,sitio_web)",
    )
    .order("nombre");

  if (errorLectura) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          No pudimos leer los productos: {errorLectura.message}
        </p>
      </div>
    );
  }

  const productos = (data ?? []) as unknown as ProductoFila[];

  const porLocal = new Map<string, ProductoFila[]>();
  for (const p of productos) {
    const lista = porLocal.get(p.local_id) ?? [];
    lista.push(p);
    porLocal.set(p.local_id, lista);
  }

  // Solo locales que ya tienen un destacado elegido — es lo que se puede
  // curar acá (foto y/o cuál producto representa a ese local).
  const grupos = Array.from(porLocal.values())
    .map((lista) => ({
      destacado: lista.find((p) => p.destacado_demo),
      alternativas: lista.filter((p) => !p.destacado_demo),
    }))
    .filter((g): g is { destacado: ProductoFila; alternativas: ProductoFila[] } => Boolean(g.destacado))
    .sort((a, b) => nombreLocal(a.destacado.local).localeCompare(nombreLocal(b.destacado.local)));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Destacados de la demo
        </h1>
        <p className="text-muted-foreground">
          {grupos.length} {grupos.length === 1 ? "local" : "locales"} con un producto destacado.
          Cambiá la foto, el encuadre, o qué producto de ese local se muestra.
        </p>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {grupos.map(({ destacado, alternativas }) => (
          <Card key={destacado.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {nombreLocal(destacado.local)}
                </p>
                <p className="font-display text-lg font-medium">
                  {capitalizarOracion(destacado.nombre)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {categoriaLabel(destacado.categoria)} ·{" "}
                  {formatPrecio(destacado.precio, destacado.moneda)}
                </p>
              </div>
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                {destacado.imagenes[0] && (
                  <Image
                    src={destacado.imagenes[0]}
                    alt={destacado.nombre}
                    fill
                    sizes="112px"
                    className="object-cover"
                    style={
                      destacado.imagen_posicion
                        ? { objectPosition: destacado.imagen_posicion }
                        : undefined
                    }
                  />
                )}
              </div>
            </div>

            <form action={actualizarFotoDestacado} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <input type="hidden" name="productoId" value={destacado.id} />
              <div className="flex-1">
                <Label htmlFor={`url-${destacado.id}`}>URL de la foto</Label>
                <Input
                  id={`url-${destacado.id}`}
                  name="imagenUrl"
                  type="url"
                  required
                  defaultValue={destacado.imagenes[0] ?? ""}
                  placeholder="https://..."
                />
              </div>
              <div className="w-full sm:w-44">
                <Label htmlFor={`pos-${destacado.id}`}>Encuadre</Label>
                <SelectNative
                  id={`pos-${destacado.id}`}
                  name="posicion"
                  defaultValue={destacado.imagen_posicion ?? ""}
                >
                  {OPCIONES_POSICION.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectNative>
              </div>
              <Button type="submit" size="sm">
                Guardar foto
              </Button>
            </form>

            {alternativas.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Usar otro producto de {nombreLocal(destacado.local)} en vez
                </p>
                <div className="flex flex-col gap-2">
                  {alternativas.map((alt) => (
                    <form
                      key={alt.id}
                      action={cambiarProductoDestacado}
                      className="flex items-center gap-3 rounded-lg border border-border p-2"
                    >
                      <input type="hidden" name="actualId" value={destacado.id} />
                      <input type="hidden" name="nuevoId" value={alt.id} />
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                        {alt.imagenes[0] && (
                          <Image
                            src={alt.imagenes[0]}
                            alt={alt.nombre}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{capitalizarOracion(alt.nombre)}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoriaLabel(alt.categoria)} · {formatPrecio(alt.precio, alt.moneda)}
                        </p>
                      </div>
                      <Button type="submit" size="sm" variant="outline">
                        Usar este
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
