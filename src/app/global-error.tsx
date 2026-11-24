"use client";

import Link from "next/link";
import { useState } from "react";
import { CLOUD_ENABLED } from "@/lib/supabase/config";
import { resetAction } from "./actions";
import "./globals.css";

/** Errori del layout: archivio illeggibile (locale) o servizio non raggiungibile (cloud). */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const [busy, setBusy] = useState(false);

  const restore = async () => {
    setBusy(true);
    await resetAction("demo").catch(() => undefined);
    window.location.reload();
  };

  return (
    <html lang="it">
      <body>
        <div className="card mx-auto mt-16 max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold text-night-900">LIFE 365 non riesce a leggere i dati</h1>
          {CLOUD_ENABLED ? (
            <p className="mt-2 text-sm text-muted">Il servizio dati non ha risposto. I tuoi dati non sono stati modificati: riprova tra poco.</p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Il file data/lifeos.json potrebbe essere danneggiato. Puoi riprovare oppure sostituirlo con i dati demo:
              il contenuto attuale viene prima copiato in data\backup.
            </p>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" className="btn" onClick={reset}>Riprova</button>
            {CLOUD_ENABLED
              ? <Link className="btn" href="/login">Vai all&apos;accesso</Link>
              : <button type="button" className="btn btn-danger" disabled={busy} onClick={restore}>Ripristina dati demo</button>}
          </div>
        </div>
      </body>
    </html>
  );
}
