import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIFE 365",
    short_name: "LIFE 365",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b1a33",
    // Icone generate da tools/genera_icone.py con lo stesso stemma del volantino.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
