import type { NextConfig } from "next";

// `cacheComponents` e `partialPrefetching` (default di create-next-app) sono
// disattivati: tutte le pagine leggono i dati a ogni richiesta dal livello dati.
const nextConfig: NextConfig = {
  devIndicators: false, // il pulsante di Next coprirebbe la voce Impostazioni
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
