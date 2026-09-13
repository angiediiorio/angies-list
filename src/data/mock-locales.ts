import type { Local } from "@/types";

// Locales piloto de ejemplo (brief técnico, sección 7: "conseguir 3-5 locales
// piloto"). Coordenadas orientativas de CABA para poder testear el mapa
// más adelante sin depender todavía de datos reales.
export const mockLocales: Local[] = [
  {
    id: "local-1",
    nombre: "Estudio Nogal",
    categoria: "mueble",
    direccion: "Av. Del Libertador 4550",
    ciudad: "Buenos Aires",
    lat: -34.5755,
    lng: -58.4338,
    contacto: "hola@estudionogal.com",
    sitio_web: "https://estudionogal.example.com",
  },
  {
    id: "local-2",
    nombre: "Luz de Autor",
    categoria: "iluminacion",
    direccion: "Honduras 4890, Palermo",
    ciudad: "Buenos Aires",
    lat: -34.588,
    lng: -58.4306,
    contacto: "ventas@luzdeautor.com",
    sitio_web: "https://luzdeautor.example.com",
  },
  {
    id: "local-3",
    nombre: "Terracota Deco",
    categoria: "decoracion",
    direccion: "Av. Scalabrini Ortiz 1200",
    ciudad: "Buenos Aires",
    lat: -34.5847,
    lng: -58.4234,
    contacto: "info@terracotadeco.com",
    sitio_web: "https://terracotadeco.example.com",
  },
  {
    id: "local-4",
    nombre: "Piedra & Piso",
    categoria: "revestimiento",
    direccion: "Ruta Panamericana Km 32, Pilar",
    ciudad: "Pilar",
    lat: -34.4581,
    lng: -58.9145,
    contacto: "contacto@piedraypiso.com",
    sitio_web: "https://piedraypiso.example.com",
  },
  {
    id: "local-5",
    nombre: "Grival Baños",
    categoria: "griferia",
    direccion: "Av. Cabildo 2340",
    ciudad: "Buenos Aires",
    lat: -34.5622,
    lng: -58.4562,
    contacto: "showroom@grivalbanos.com",
    sitio_web: "https://grivalbanos.example.com",
  },
];

export function getLocalById(id: string): Local | undefined {
  return mockLocales.find((local) => local.id === id);
}
