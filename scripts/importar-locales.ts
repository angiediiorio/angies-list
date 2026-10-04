/**
 * Importa locales reales + sus productos a Supabase a partir de un CSV
 * (nombre_local;url_sitio;categorias_generales), scrapeando cada sitio y
 * usando la API de Anthropic para extraer productos y clasificarlos en
 * una de las 11 categorías del catálogo.
 *
 * CORRE EN TU MÁQUINA, NO en este entorno de Claude Code (acá no hay
 * salida de red hacia sitios externos). Necesita Node 18+ y:
 *
 *   ANTHROPIC_API_KEY             tu clave de la API de Anthropic
 *   NEXT_PUBLIC_SUPABASE_URL      la misma que usa la app
 *   SUPABASE_SERVICE_ROLE_KEY     la misma que usa /admin/estudios
 *
 * Uso:
 *   npx tsx scripts/importar-locales.ts --limit=5 --dry-run
 *   npx tsx scripts/importar-locales.ts --limit=20
 *   npx tsx scripts/importar-locales.ts                      # los 167 locales del CSV
 *
 * Flags:
 *   --csv=ruta            default: scripts/data/locales-habitando.csv
 *   --limit=N             cuántos locales procesar (default: todos)
 *   --max-productos=N     productos a extraer por local (default: 4)
 *   --delay=ms            pausa entre locales (default: 1500)
 *   --dry-run             no escribe nada en Supabase, solo loguea
 *   --model=id            modelo de Anthropic (default: claude-sonnet-5)
 *
 * Ver supabase/schema-locales-opcionales.sql — hace falta correrlo antes
 * (dirección/lat/lng pasan a ser opcionales, la mayoría de estos locales
 * son tiendas online sin local físico).
 */

import { parse } from "csv-parse/sync";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createAdminClient } from "../src/lib/supabase/admin";
import { CATEGORIAS_PRODUCTO, type CategoriaProducto } from "../src/types";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function leerFlag(nombre: string, porDefecto: string): string {
  const prefijo = `--${nombre}=`;
  const arg = process.argv.find((a) => a.startsWith(prefijo));
  return arg ? arg.slice(prefijo.length) : porDefecto;
}

const CSV_PATH = resolve(process.cwd(), leerFlag("csv", "scripts/data/locales-habitando.csv"));
const LIMITE = Number(leerFlag("limit", "Infinity"));
const MAX_PRODUCTOS_POR_LOCAL = Number(leerFlag("max-productos", "4"));
const DELAY_MS = Number(leerFlag("delay", "1500"));
const DRY_RUN = process.argv.includes("--dry-run");
const MODELO = leerFlag("model", "claude-sonnet-5");

// ---------------------------------------------------------------------------
// Mapeo de categorías del CSV (texto libre, en español, con variantes) a
// las 11 categorías válidas del catálogo. "empapelados" y "espejos" no
// tienen categoría propia en el modelo — se aproximan a la más cercana.
// ---------------------------------------------------------------------------

const CATEGORIAS_VALIDAS = new Set(CATEGORIAS_PRODUCTO.map((c) => c.value));

const SINONIMOS_CATEGORIA: Record<string, CategoriaProducto> = {
  muebles: "muebles",
  mueble: "muebles",
  deco: "decoracion",
  decoracion: "decoracion",
  iluminacion: "iluminacion",
  "pisos y revestimientos": "pisos_y_revestimientos",
  pisos_y_revestimientos: "pisos_y_revestimientos",
  revestimientos: "pisos_y_revestimientos",
  empapelados: "pisos_y_revestimientos", // sin categoría propia, aproximación
  sanitarios: "sanitarios",
  sanitario: "sanitarios",
  textil: "textiles",
  textiles: "textiles",
  alfombras: "alfombras",
  alfombra: "alfombras",
  climatizacion: "climatizacion",
  bazar: "bazar",
  jardineria: "jardineria",
  arte: "arte",
  espejos: "decoracion", // sin categoría propia, aproximación
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes
    .trim()
    .toLowerCase();
}

function mapearCategoria(categoriaCsv: string): CategoriaProducto | null {
  return SINONIMOS_CATEGORIA[normalizar(categoriaCsv)] ?? null;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

interface FilaLocal {
  nombreLocal: string;
  urlSitio: string;
  categoriaPrincipal: CategoriaProducto;
}

function repararUrl(url: string): string | null {
  const limpia = url.trim();
  if (!limpia) return null;
  if (limpia.startsWith("ttps://") || limpia.startsWith("ttp://")) return `h${limpia}`;
  if (limpia.startsWith("http://") || limpia.startsWith("https://")) return limpia;
  return `https://${limpia}`;
}

function leerCsv(ruta: string): FilaLocal[] {
  const contenido = readFileSync(ruta, "utf-8");
  // El header tiene "url_sitio" repetido (error de origen) — se ignora y
  // se lee por posición: [nombre_local, url_sitio, categorias_generales].
  const filas: string[][] = parse(contenido, { delimiter: ";", from_line: 2 });

  const resultado: FilaLocal[] = [];
  for (const [nombreCrudo, urlCruda, categoriasCrudas] of filas) {
    const urlSitio = repararUrl(urlCruda ?? "");
    if (!urlSitio) continue; // sin URL no hay nada para scrapear

    let nombreLocal = (nombreCrudo ?? "").trim();
    if (!nombreLocal) {
      try {
        nombreLocal = new URL(urlSitio).hostname.replace(/^www\./, "");
      } catch {
        continue; // ni nombre ni URL parseable
      }
    }

    const categorias = (categoriasCrudas ?? "")
      .split(";")
      .map((c) => mapearCategoria(c))
      .filter((c): c is CategoriaProducto => c !== null);

    resultado.push({
      nombreLocal,
      urlSitio,
      categoriaPrincipal: categorias[0] ?? "muebles",
    });
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// Scraping
// ---------------------------------------------------------------------------

async function bajarContenido(
  url: string,
): Promise<{ texto: string; imagenes: string[] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; habitandoBot/1.0; +https://habitando.com.ar) para catálogo de habit·an·do",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, header, footer, nav").remove();

    const texto = $("body").text().replace(/\s+/g, " ").trim().slice(0, 20000);

    const imagenes = $("img")
      .map((_, el) => $(el).attr("src") || $(el).attr("data-src") || "")
      .get()
      .filter(Boolean)
      .map((src) => {
        try {
          return new URL(src, url).toString();
        } catch {
          return null;
        }
      })
      .filter((src): src is string => Boolean(src))
      .slice(0, 25);

    return { texto, imagenes };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Clasificación con IA
// ---------------------------------------------------------------------------

interface ProductoExtraido {
  nombre: string;
  categoria: CategoriaProducto;
  precio: number;
  material: string;
  color: string;
  estilo: string;
  medidas: string;
  descripcion: string;
  imagen_url: string | null;
}

function crearHerramientaExtraccion() {
  return {
    name: "extraer_productos",
    description:
      "Extrae productos reales de interiorismo/arquitectura visibles en el contenido de una tienda, clasificando cada uno en una categoría válida.",
    input_schema: {
      type: "object" as const,
      properties: {
        productos: {
          type: "array" as const,
          description: `Hasta ${MAX_PRODUCTOS_POR_LOCAL} productos reales con nombre y precio claramente visibles. Si no hay ninguno así de claro, devolver un array vacío — no inventar productos.`,
          items: {
            type: "object" as const,
            properties: {
              nombre: { type: "string" as const },
              categoria: {
                type: "string" as const,
                enum: CATEGORIAS_PRODUCTO.map((c) => c.value),
                description: "Tiene que ser EXACTAMENTE uno de los valores del enum, ninguno fuera de esa lista.",
              },
              precio: {
                type: "number" as const,
                description: "Solo el número, sin símbolo de moneda ni separadores de miles.",
              },
              material: { type: "string" as const },
              color: { type: "string" as const },
              estilo: { type: "string" as const },
              medidas: { type: "string" as const },
              descripcion: { type: "string" as const, description: "1-2 oraciones." },
              imagen_url: {
                type: "string" as const,
                description: "Una de las URLs de imagen provistas que corresponda a este producto, si se puede inferir. Si no, cadena vacía.",
              },
            },
            required: ["nombre", "categoria", "precio"],
          },
        },
      },
      required: ["productos"],
    },
  };
}

async function extraerProductos(
  anthropic: Anthropic,
  nombreLocal: string,
  texto: string,
  imagenes: string[],
): Promise<ProductoExtraido[]> {
  if (!texto) return [];

  const herramienta = crearHerramientaExtraccion();

  const mensaje = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 2048,
    tools: [herramienta],
    tool_choice: { type: "tool", name: "extraer_productos" },
    messages: [
      {
        role: "user",
        content:
          `Local: ${nombreLocal}\n\n` +
          `Contenido de texto de la página (recortado):\n${texto}\n\n` +
          `URLs de imagen encontradas en la página (puede que no haya ninguna relevante):\n${imagenes.join("\n")}`,
      },
    ],
  });

  const bloqueHerramienta = mensaje.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!bloqueHerramienta) return [];

  const input = bloqueHerramienta.input as { productos?: unknown[] };
  const productosCrudos = Array.isArray(input.productos) ? input.productos : [];

  // Segunda validación de la categoría además del enum del schema — nunca
  // confiar en que el modelo lo haya respetado al 100%.
  const productos: ProductoExtraido[] = [];
  for (const p of productosCrudos) {
    const candidato = p as Record<string, unknown>;
    const categoria = candidato.categoria as string;
    if (!CATEGORIAS_VALIDAS.has(categoria as CategoriaProducto)) {
      console.warn(`  ⚠️  Categoría inválida descartada: "${categoria}" (${candidato.nombre})`);
      continue;
    }
    if (!candidato.nombre || typeof candidato.precio !== "number") continue;

    productos.push({
      nombre: String(candidato.nombre),
      categoria: categoria as CategoriaProducto,
      precio: candidato.precio,
      material: String(candidato.material ?? ""),
      color: String(candidato.color ?? ""),
      estilo: String(candidato.estilo ?? ""),
      medidas: String(candidato.medidas ?? ""),
      descripcion: String(candidato.descripcion ?? ""),
      imagen_url: candidato.imagen_url ? String(candidato.imagen_url) : null,
    });
  }
  return productos.slice(0, MAX_PRODUCTOS_POR_LOCAL);
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

function slugify(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function buscarOCrearLocal(
  admin: ReturnType<typeof createAdminClient> | null,
  fila: FilaLocal,
): Promise<string | null> {
  if (!admin) return "dry-run-local-id"; // DRY_RUN: no se toca Supabase ni para leer

  const { data: existente } = await admin
    .from("locales")
    .select("id")
    .eq("sitio_web", fila.urlSitio)
    .maybeSingle();

  if (existente) return existente.id as string;

  const { data: nuevo, error } = await admin
    .from("locales")
    .insert({
      nombre: fila.nombreLocal,
      categoria: fila.categoriaPrincipal,
      sitio_web: fila.urlSitio,
    })
    .select("id")
    .single();

  if (error || !nuevo) {
    console.error(`  ✗ No se pudo crear el local: ${error?.message}`);
    return null;
  }
  return nuevo.id as string;
}

async function insertarProducto(
  admin: ReturnType<typeof createAdminClient> | null,
  localId: string,
  localNombre: string,
  producto: ProductoExtraido,
) {
  const slug = `${slugify(producto.nombre)}-${slugify(localNombre)}`.slice(0, 120);

  if (!admin) {
    console.log(`  [dry-run] insertaría producto: ${producto.nombre} (${producto.categoria})`);
    return;
  }

  const { error } = await admin.from("productos").insert({
    local_id: localId,
    slug,
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    moneda: "ARS",
    material: producto.material || "Sin especificar",
    color: producto.color || "Sin especificar",
    estilo: producto.estilo || "Sin especificar",
    medidas: producto.medidas || "Consultar",
    stock: true,
    descripcion: producto.descripcion,
    imagenes: producto.imagen_url ? [producto.imagen_url] : [],
  });

  if (error) {
    // Slug duplicado u otro conflicto: lo salteamos sin frenar todo el import.
    console.error(`  ✗ No se pudo insertar "${producto.nombre}": ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Falta ANTHROPIC_API_KEY en el entorno.");
    process.exit(1);
  }
  if (!DRY_RUN && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (usá --dry-run para probar sin Supabase).",
    );
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const admin = DRY_RUN ? null : createAdminClient();

  const filas = leerCsv(CSV_PATH).slice(0, Number.isFinite(LIMITE) ? LIMITE : undefined);
  console.log(
    `${filas.length} locales a procesar (modelo: ${MODELO}, hasta ${MAX_PRODUCTOS_POR_LOCAL} productos c/u${DRY_RUN ? ", DRY RUN" : ""}).\n`,
  );

  let totalProductos = 0;
  let totalErrores = 0;

  for (const [i, fila] of filas.entries()) {
    console.log(`[${i + 1}/${filas.length}] ${fila.nombreLocal} — ${fila.urlSitio}`);

    const contenido = await bajarContenido(fila.urlSitio);
    if (!contenido) {
      console.log("  ✗ No se pudo descargar el sitio (caído, timeout, o bloqueó el request)");
      totalErrores++;
      await esperar(DELAY_MS);
      continue;
    }

    const productos = await extraerProductos(
      anthropic,
      fila.nombreLocal,
      contenido.texto,
      contenido.imagenes,
    );

    if (productos.length === 0) {
      console.log("  — No se detectaron productos con nombre y precio claros");
    } else {
      const localId = await buscarOCrearLocal(admin, fila);
      if (!localId) {
        totalErrores++;
      } else {
        for (const producto of productos) {
          await insertarProducto(admin, localId, fila.nombreLocal, producto);
          totalProductos++;
        }
        console.log(`  ✓ ${productos.length} producto(s)`);
      }
    }

    await esperar(DELAY_MS);
  }

  console.log(
    `\nListo. ${totalProductos} productos ${DRY_RUN ? "habrían sido " : ""}insertados, ${totalErrores} locales con error.`,
  );
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
