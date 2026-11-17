"use client";

import dynamic from "next/dynamic";

import type { Local } from "@/types";

// Leaflet toca `window` al importarse, así que el mapa solo puede vivir en
// el cliente. `ssr:false` solo está permitido en un Client Component, por
// eso este wrapper existe separado de la página (Server Component).
const LocalesMap = dynamic(
  () => import("@/components/LocalesMap").then((mod) => mod.LocalesMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] w-full animate-pulse rounded-2xl border border-border bg-muted" />
    ),
  },
);

export function LocalesMapLoader({ locales }: { locales: Local[] }) {
  return <LocalesMap locales={locales} />;
}
