/**
 * Marca destacado_demo = true en los productos reales que están listos
 * para mostrarse en una demo a estudios: tienen foto confirmada Y todos
 * los campos completos (no quedó ningún "Sin especificar"/"Consultar" de
 * scripts/importar-locales.ts), eligiendo la mayor diversidad de
 * categorías posible hasta llegar a --cantidad.
 *
 * CORRE EN TU MÁQUINA, NO en Claude Code (no hay salida de red hacia
 * Supabase desde ese entorno). Necesita en el entorno (.env.local alcanza):
 *
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npx tsx scripts/curar-destacados-demo.ts --dry-run
 *   npx tsx scripts/curar-destacados-demo.ts
 *   npx tsx scripts/curar-destacados-demo.ts --cantidad=20
 *
 * Correr de nuevo reemplaza la selección anterior por completo (primero
 * pone destacado_demo=false en todo, después marca la nueva selección) —
 * es idempotente, no se van acumulando destacados de corridas viejas.
 *
 * Hace falta haber corrido supabase/schema-destacado-demo.sql antes (crea
 * la columna `destacado_demo` en `productos`).
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../src/lib/supabase/admin";
import { CATEGORIAS_PRODUCTO, type CategoriaProducto } from "../src/types";

function leerFlag(nombre: string, porDefecto: string): string {
  const prefijo = `--${nombre}=`;
  const arg = process.argv.find((a) => a.startsWith(prefijo));
  return arg ? arg.slice(prefijo.length) : porDefecto;
}

const CANTIDAD_OBJETIVO = Number(leerFlag("cantidad", "18"));
const DRY_RUN = process.argv.includes("--dry-run");

const PLACEHOLDERS: Record<string, string> = {
  material: "Sin especificar",
  color: "Sin especificar",
  estilo: "Sin especificar",
  medidas: "Consultar",
};

interface CandidatoFila {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  material: string;
  color: string;
  estilo: string;
  medidas: string | null;
  descripcion: string | null;
  imagenes: string[];
  local: { nombre: string } | { nombre: string }[] | null;
}

function nombreLocal(local: CandidatoFila["local"]): string {
  if (!local) return "?";
  return Array.isArray(local) ? (local[0]?.nombre ?? "?") : local.nombre;
}

// Motivos BLOQUEANTES: si el producto tiene alguno, no entra a la demo.
// Foto real y una descripción usable son los únicos campos donde la
// mayoría de los sitios sí tiene dato — pedir también material/color/
// estilo/medidas completos dejaba candidatos en 5 sobre 403, porque casi
// ningún sitio chico lista esos datos de forma explícita en su home.
function motivosBloqueantes(p: CandidatoFila): string[] {
  const motivos: string[] = [];
  if (!p.imagenes || p.imagenes.length === 0) motivos.push("sin foto");
  if (!p.descripcion || p.descripcion.trim().length < 15) motivos.push("sin descripción");
  return motivos;
}

// Campos informativos (no bloquean, pero cuentan para el diagnóstico y
// para ordenar candidatos dentro de una misma categoría): la UI ya
// muestra "Sin especificar"/"Consultar" cuando faltan, así que un
// producto sin estilo igual es presentable, solo menos específico.
function camposFaltantes(p: CandidatoFila): string[] {
  const motivos: string[] = [];
  if (p.material === PLACEHOLDERS.material) motivos.push("sin material");
  if (p.color === PLACEHOLDERS.color) motivos.push("sin color");
  if (p.estilo === PLACEHOLDERS.estilo) motivos.push("sin estilo");
  if (!p.medidas || p.medidas === PLACEHOLDERS.medidas) motivos.push("sin medidas");
  return motivos;
}

// Round-robin por categoría: una vuelta toma como máximo un producto de
// cada categoría (en el orden de CATEGORIAS_PRODUCTO) hasta agotar
// candidatos o llegar al objetivo — así se prioriza cubrir categorías
// distintas antes que acumular varios de la misma.
function elegirDiversos(
  porCategoria: Map<CategoriaProducto, CandidatoFila[]>,
  objetivo: number,
): CandidatoFila[] {
  const elegidos: CandidatoFila[] = [];
  const indices = new Map<CategoriaProducto, number>();

  let siguioAlguna = true;
  while (elegidos.length < objetivo && siguioAlguna) {
    siguioAlguna = false;
    for (const { value: categoria } of CATEGORIAS_PRODUCTO) {
      if (elegidos.length >= objetivo) break;
      const candidatos = porCategoria.get(categoria) ?? [];
      const i = indices.get(categoria) ?? 0;
      if (i < candidatos.length) {
        elegidos.push(candidatos[i]);
        indices.set(categoria, i + 1);
        siguioAlguna = true;
      }
    }
  }
  return elegidos;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("productos")
    .select("id,nombre,categoria,material,color,estilo,medidas,descripcion,imagenes,local:locales(nombre)");

  if (error) {
    console.error("No se pudieron leer los productos:", error.message);
    process.exit(1);
  }

  const todos = (data ?? []) as unknown as CandidatoFila[];
  console.log(`${todos.length} productos en la base.\n`);

  const porCategoria = new Map<CategoriaProducto, CandidatoFila[]>();
  for (const { value: categoria } of CATEGORIAS_PRODUCTO) porCategoria.set(categoria, []);

  const conteoBloqueantes = new Map<string, number>();
  const conteoInformativos = new Map<string, number>();
  for (const p of todos) {
    const bloqueantes = motivosBloqueantes(p);
    for (const m of camposFaltantes(p)) {
      conteoInformativos.set(m, (conteoInformativos.get(m) ?? 0) + 1);
    }
    if (bloqueantes.length > 0) {
      for (const m of bloqueantes) conteoBloqueantes.set(m, (conteoBloqueantes.get(m) ?? 0) + 1);
      continue;
    }
    porCategoria.get(p.categoria)?.push(p);
  }

  console.log("Diagnóstico — por qué se descartan productos (un producto puede sumar en varios):");
  for (const [motivo, cantidad] of Array.from(conteoBloqueantes.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${motivo} (bloqueante): ${cantidad}`);
  }
  for (const [motivo, cantidad] of Array.from(conteoInformativos.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${motivo} (no bloquea, se muestra "Sin especificar"/"Consultar"): ${cantidad}`);
  }
  console.log();

  // Dentro de cada categoría, los candidatos con más campos informativos
  // completos van primero — si hay que elegir entre varios, mejor el más
  // específico.
  for (const candidatos of porCategoria.values()) {
    candidatos.sort((a, b) => camposFaltantes(a).length - camposFaltantes(b).length);
  }

  console.log("Candidatos (foto + descripción) por categoría:");
  for (const { value: categoria, label } of CATEGORIAS_PRODUCTO) {
    console.log(`  ${label}: ${porCategoria.get(categoria)?.length ?? 0}`);
  }
  console.log();

  const elegidos = elegirDiversos(porCategoria, CANTIDAD_OBJETIVO);
  const categoriasCubiertas = new Set(elegidos.map((p) => p.categoria));

  console.log(`Seleccionados: ${elegidos.length} producto(s), ${categoriasCubiertas.size} categoría(s) cubiertas.\n`);
  for (const p of elegidos) {
    const faltan = camposFaltantes(p);
    const sufijo = faltan.length > 0 ? ` (faltan: ${faltan.join(", ")})` : "";
    console.log(`  [${p.categoria}] ${p.nombre} — ${nombreLocal(p.local)}${sufijo}`);
  }

  if (elegidos.length < 15) {
    console.warn(
      `\n⚠️  Solo se encontraron ${elegidos.length} productos con foto + descripción —` +
        " menos que el mínimo de 15 que pediste para la demo. Puede hacer falta importar más" +
        " locales (--offset en importar-locales.ts) para sumar más con foto.",
    );
  }

  if (DRY_RUN) {
    console.log("\n(dry-run: no se escribió nada en Supabase)");
    return;
  }

  const { error: errorReset } = await admin
    .from("productos")
    .update({ destacado_demo: false })
    .not("id", "is", null);
  if (errorReset) {
    console.error("No se pudo resetear destacado_demo:", errorReset.message);
    process.exit(1);
  }

  const { error: errorMarcar } = await admin
    .from("productos")
    .update({ destacado_demo: true })
    .in(
      "id",
      elegidos.map((p) => p.id),
    );
  if (errorMarcar) {
    console.error("No se pudo marcar la selección:", errorMarcar.message);
    process.exit(1);
  }

  console.log("\nListo — destacado_demo actualizado en Supabase.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
