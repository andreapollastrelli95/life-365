import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIFE 365",
    short_name: "LIFE 365",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fa",
    theme_color: "#0b1a33",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
