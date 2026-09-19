"use client";

import L from "leaflet";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { CATEGORIAS_PRODUCTO, type CategoriaProducto, type Local } from "@/types";

// Un color por categoría, reutilizado en los pines del mapa y en los
// botones de filtro para que se puedan asociar de un vistazo.
const COLOR_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  mueble: "#b45309",
  decoracion: "#be185d",
  iluminacion: "#ca8a04",
  revestimiento: "#0f766e",
  griferia: "#1d4ed8",
};

// Pin propio en vez del ícono default de Leaflet: el default depende de
// imágenes (marker-icon.png) cuyo path se rompe con bundlers como Next/Turbopack.
function crearIcono(categoria: CategoriaProducto) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${COLOR_POR_CATEGORIA[categoria]};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

const CENTRO_CABA: [number, number] = [-34.6037, -58.3816];

export function LocalesMap({ locales }: { locales: Local[] }) {
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaProducto | "todas">(
    "todas",
  );

  const localesFiltrados = useMemo(
    () =>
      categoriaActiva === "todas"
        ? locales
        : locales.filter((l) => l.categoria === categoriaActiva),
    [locales, categoriaActiva],
  );

  const centro: [number, number] = locales.length
    ? [
        locales.reduce((suma, l) => suma + l.lat, 0) / locales.length,
        locales.reduce((suma, l) => suma + l.lng, 0) / locales.length,
      ]
    : CENTRO_CABA;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <FiltroBoton activo={categoriaActiva === "todas"} onClick={() => setCategoriaActiva("todas")}>
          Todas
        </FiltroBoton>
        {CATEGORIAS_PRODUCTO.map((categoria) => (
          <FiltroBoton
            key={categoria.value}
            activo={categoriaActiva === categoria.value}
            onClick={() => setCategoriaActiva(categoria.value)}
            color={COLOR_POR_CATEGORIA[categoria.value]}
          >
            {categoria.label}
          </FiltroBoton>
        ))}
      </div>

      <div className="h-[60vh] w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <MapContainer center={centro} zoom={10} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {localesFiltrados.map((local) => (
            <Marker
              key={local.id}
              position={[local.lat, local.lng]}
              icon={crearIcono(local.categoria)}
            >
              <Popup>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{local.nombre}</span>
                  <span className="text-zinc-500">
                    {local.direccion}, {local.ciudad}
                  </span>
                  <Link
                    href={`/catalogo?categoria=${local.categoria}`}
                    className="mt-1 font-medium text-zinc-900 underline underline-offset-2"
                  >
                    Ver productos de esta categoría →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {localesFiltrados.length === 0 && (
        <p className="text-sm text-zinc-500">No hay locales de esa categoría todavía.</p>
      )}
    </div>
  );
}

function FiltroBoton({
  children,
  activo,
  onClick,
  color,
}: {
  children: ReactNode;
  activo: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        activo
          ? "border-transparent bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
          : "border-black/15 text-zinc-700 hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}
