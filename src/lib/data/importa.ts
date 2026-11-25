import { COLLECTION_KEYS, type Db } from "@/lib/types";

export type EsitoImport =
  | { ok: true; db: Db; record: number; fileCollegati: number; fileMancanti: number }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Nome del file com'era su disco in LIFE OS (`<id>-<nome>`), senza eventuali cartelle. */
export const nomeFileLocale = (file: string) => file.split("/").pop() ?? file;

/**
 * Prepara un archivio esportato da LIFE OS (o da LIFE 365) per diventare l'archivio dell'utente.
 * - controlla la forma: tutte le collezioni presenti e ogni record con un id;
 * - nel cloud (`userId`) ricollega gli allegati ai file già caricati nella cartella dell'utente,
 *   riconoscendoli dal nome che avevano sul PC.
 * Funzione pura: nessun accesso a disco o rete.
 */
export function preparaImport(raw: unknown, opts: { userId?: string; fileNelCloud?: Set<string> } = {}): EsitoImport {
  if (!isObj(raw) || !isObj(raw.meta)) return { ok: false, error: "Il file non è un archivio di LIFE OS o LIFE 365." };
  let record = 0;
  for (const key of COLLECTION_KEYS) {
    const list = raw[key];
    if (!Array.isArray(list)) return { ok: false, error: `Archivio incompleto: manca la sezione «${key}».` };
    if (!list.every((r) => isObj(r) && typeof r.id === "string" && r.id.length > 0)) {
      return { ok: false, error: `Archivio danneggiato nella sezione «${key}».` };
    }
    record += list.length;
  }
  const allegati = Array.isArray(raw.allegati) ? raw.allegati : [];
  if (!allegati.every((a) => isObj(a) && typeof a.id === "string" && typeof a.file === "string" && typeof a.nome === "string")) {
    return { ok: false, error: "Archivio danneggiato nella sezione dei file." };
  }

  const db = structuredClone(raw) as unknown as Db;
  db.allegati = allegati as unknown as Db["allegati"];
  db.meta = { ...db.meta, demo: false };

  let fileCollegati = 0;
  let fileMancanti = 0;
  if (opts.userId) {
    for (const a of db.allegati) {
      const nome = nomeFileLocale(a.file);
      if (opts.fileNelCloud?.has(nome)) {
        a.file = `${opts.userId}/${nome}`;
        fileCollegati++;
      } else {
        fileMancanti++;
      }
    }
  }
  return { ok: true, db, record, fileCollegati, fileMancanti };
}
