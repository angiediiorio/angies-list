/**
 * Busca ubicación real (ciudad/dirección) para los locales reales detrás
 * de los productos marcados destacado_demo = true, y si encuentra algo
 * la geocodifica con Nominatim (OpenStreetMap) para que aparezcan como
 * pines en /mapa. Nunca inventa: un local sin ninguna mención de ciudad
 * o dirección en su sitio queda sin coordenadas, como hasta ahora.
 *
 * CORRE EN TU MÁQUINA, NO en Claude Code (no hay salida de red hacia
 * sitios externos ni hacia Nominatim desde ese entorno). Necesita:
 *
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npx tsx scripts/geolocalizar-destacados.ts --dry-run
 *   npx tsx scripts/geolocalizar-destacados.ts
 *
 * Respeta la política de uso de Nominatim (1 request/segundo, User-Agent
 * descriptivo) — pensado para decenas de locales, no para miles.
 */

import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../src/lib/supabase/admin";

const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 1200; // Nominatim pide máximo 1 request/segundo.
const USER_AGENT = "habitando-geolocalizar/1.0 (+https://habitando.com.ar; hola@habitando.com.ar)";

interface LocalRow {
  id: string;
  nombre: string;
  sitio_web: string;
  direccion: string | null;
  ciudad: string | null;
  lat: number | null;
  lng: number | null;
}

function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Scraping (mismo enfoque que importar-locales.ts: solo texto de la home)
// ---------------------------------------------------------------------------

async function bajarTexto(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; habitandoBot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, header, nav").remove();
    return $("body").text().replace(/\s+/g, " ").trim().slice(0, 15000);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Extracción de ubicación con IA
// ---------------------------------------------------------------------------

interface UbicacionExtraida {
  direccion: string | null;
  ciudad: string | null;
}

function crearHerramientaUbicacion() {
  return {
    name: "extraer_ubicacion",
    description:
      "Extrae la ubicación física del local a partir del contenido de su página, SOLO si está mencionada explícitamente (ej. en el pie de página, una sección de contacto, o un texto tipo 'retirás tu pedido en...'). Nunca inventar ni inferir a partir del nombre del local o del dominio.",
    input_schema: {
      type: "object" as const,
      properties: {
        direccion: {
          type: ["string", "null"],
          description: "Calle y altura si se menciona exactamente, o null.",
        },
        ciudad: {
          type: ["string", "null"],
          description:
            "Ciudad/barrio/localidad mencionada (ej. 'Palermo, CABA', 'Córdoba'), o null si no hay ninguna mención concreta de ubicación en el texto.",
        },
      },
      required: ["direccion", "ciudad"],
    },
  };
}

async function extraerUbicacion(
  anthropic: Anthropic,
  nombreLocal: string,
  texto: string,
): Promise<UbicacionExtraida | null> {
  if (!texto) return null;

  const mensaje = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    tools: [crearHerramientaUbicacion()],
    tool_choice: { type: "tool", name: "extraer_ubicacion" },
    messages: [
      {
        role: "user",
        content: `Local: ${nombreLocal}\n\nContenido de su página (recortado):\n${texto}`,
      },
    ],
  });

  const bloque = mensaje.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!bloque) return null;

  const input = bloque.input as { direccion?: unknown; ciudad?: unknown };
  const direccion = typeof input.direccion === "string" && input.direccion.trim() ? input.direccion.trim() : null;
  const ciudad = typeof input.ciudad === "string" && input.ciudad.trim() ? input.ciudad.trim() : null;

  if (!direccion && !ciudad) return null;
  return { direccion, ciudad };
}

// ---------------------------------------------------------------------------
// Geocoding (Nominatim / OpenStreetMap)
// ---------------------------------------------------------------------------

async function geocodificar(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("productos")
    .select("local:locales(id,nombre,sitio_web,direccion,ciudad,lat,lng)")
    .eq("destacado_demo", true);

  if (error) {
    console.error("No se pudieron leer los locales destacados:", error.message);
    process.exit(1);
  }

  const filas = (data ?? []) as unknown as { local: LocalRow | LocalRow[] | null }[];
  const localesPorId = new Map<string, LocalRow>();
  for (const fila of filas) {
    const local = Array.isArray(fila.local) ? fila.local[0] : fila.local;
    if (local) localesPorId.set(local.id, local);
  }
  const locales = Array.from(localesPorId.values());

  const pendientes = locales.filter((l) => l.lat === null || l.lng === null);
  console.log(
    `${locales.length} locales detrás de productos destacados, ${pendientes.length} sin coordenadas todavía.\n`,
  );

  let encontrados = 0;
  for (const [i, local] of pendientes.entries()) {
    console.log(`[${i + 1}/${pendientes.length}] ${local.nombre} — ${local.sitio_web}`);

    const texto = await bajarTexto(local.sitio_web);
    if (!texto) {
      console.log("  ✗ No se pudo descargar el sitio");
      await esperar(DELAY_MS);
      continue;
    }

    const ubicacion = await extraerUbicacion(anthropic, local.nombre, texto);
    if (!ubicacion) {
      console.log("  — No se mencionó ninguna ubicación en el sitio");
      await esperar(DELAY_MS);
      continue;
    }

    const query = [ubicacion.direccion, ubicacion.ciudad, "Argentina"].filter(Boolean).join(", ");
    await esperar(DELAY_MS); // separar la llamada a Nominatim de la del sitio
    const coords = await geocodificar(query);

    if (!coords) {
      console.log(`  — Mencionó "${query}" pero no se pudo geocodificar`);
      await esperar(DELAY_MS);
      continue;
    }

    console.log(`  ✓ ${query} → ${coords.lat}, ${coords.lng}`);
    encontrados++;

    if (!DRY_RUN) {
      const { error: errorUpdate } = await admin
        .from("locales")
        .update({
          direccion: ubicacion.direccion,
          ciudad: ubicacion.ciudad,
          lat: coords.lat,
          lng: coords.lng,
        })
        .eq("id", local.id);
      if (errorUpdate) {
        console.error(`  ✗ No se pudo guardar: ${errorUpdate.message}`);
      }
    }

    await esperar(DELAY_MS);
  }

  console.log(
    `\nListo. ${encontrados} local(es) con ubicación ${DRY_RUN ? "encontrada (dry-run, no se guardó)" : "guardada"}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
