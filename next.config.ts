import type { NextConfig } from "next";

// `cacheComponents` e `partialPrefetching` (default di create-next-app) sono
// disattivati: tutte le pagine leggono i dati a ogni richiesta dal livello dati.
const nextConfig: NextConfig = {
  // L'importazione di un archivio passa da una Server Action: 4 MB restano sotto il limite di Vercel.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
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
