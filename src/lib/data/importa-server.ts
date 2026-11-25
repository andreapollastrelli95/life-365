import "server-only";
import { BUCKET_ALLEGATI } from "@/lib/supabase/config";
import { preparaImport } from "./importa";
import { getSessione } from "./sessione";
import { replaceDb } from "./store";

export type RisultatoImport =
  | { ok: true; record: number; fileCollegati: number; fileMancanti: number }
  | { ok: false; error: string };

const MAX_JSON = 4 * 1024 * 1024;

/** Importa un archivio esportato: sostituisce quello dell'utente (con copia di sicurezza). */
export async function importaArchivio(testo: string): Promise<RisultatoImport> {
  if (testo.length > MAX_JSON) return { ok: false, error: "Il file è troppo grande (massimo 4 MB)." };
  let raw: unknown;
  try {
    raw = JSON.parse(testo.replace(/^﻿/, ""));
  } catch {
    return { ok: false, error: "Il file scelto non è un JSON valido." };
  }

  const s = await getSessione();
  if (s.modo === "anonimo") return { ok: false, error: "Accedi prima di importare." };

  let opts: Parameters<typeof preparaImport>[1] = {};
  if (s.modo === "cloud") {
    // I file trasferiti dal PC stanno nella cartella dell'utente con il nome che avevano su disco.
    const { data, error } = await s.supabase.storage.from(BUCKET_ALLEGATI).list(s.userId, { limit: 1000 });
    if (error) return { ok: false, error: "Non riesco a leggere i file caricati. Riprova." };
    opts = { userId: s.userId, fileNelCloud: new Set((data ?? []).map((o) => o.name)) };
  }

  const esito = preparaImport(raw, opts);
  if (!esito.ok) return esito;
  await replaceDb(esito.db);
  return { ok: true, record: esito.record, fileCollegati: esito.fileCollegati, fileMancanti: esito.fileMancanti };
}
