import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIFE 365",
  description: "Finanze, documenti, casa, salute e scadenze in un unico posto.",
  applicationName: "LIFE 365",
  appleWebApp: { capable: true, title: "LIFE 365", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0b1a33" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
