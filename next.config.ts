import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // El catálogo agrega fotos de producto de decenas de sitios de terceros
    // (un local distinto por tienda) scrapeados por scripts/importar-locales.ts,
    // así que no hay una lista fija de dominios para autorizar de antemano.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
