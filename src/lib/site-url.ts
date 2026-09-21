import { headers } from "next/headers";

// Deriva la URL pública del sitio a partir del request (funciona en local,
// en previews de Vercel y en producción sin tener que hardcodear nada).
// Se puede forzar con NEXT_PUBLIC_SITE_URL si hiciera falta.
export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
