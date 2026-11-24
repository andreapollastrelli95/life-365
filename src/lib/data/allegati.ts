import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CATEGORIE_DOCUMENTO, DESTINAZIONI, MAX_FILE_BYTES, MAX_FILES, safeName, storagePath,
} from "@/lib/destinazioni";
import { BUCKET_ALLEGATI } from "@/lib/supabase/config";
import type { Allegato, Documento } from "@/lib/types";
import { readDb, withDb } from "./store";
import type { Result } from "./index";
import { getSessione } from "./sessione";

// In locale i file stanno in `data/allegati` (fuori da Git); nel cloud nel bucket privato,
// dentro la cartella dell'utente. `Allegato.file` è il nome su disco o il percorso nel bucket.
const FILES_DIR = path.join(process.cwd(), "data", "allegati");

const titleFromName = (name: string) =>
  name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || name;

export interface UploadOptions {
  destinazione: string;
  titolo?: string;
  categoria?: string;
  note?: string;
}

/** File già caricato nel bucket dal browser (solo cloud). */
export interface FileCaricato {
  id: string;
  nome: string;
  mime: string;
  dimensione: number;
}

export type UploadResult = { ok: true; count: number } | { ok: false; error: string };

function checkFiles(files: { name: string; size: number }[]): string | null {
  if (files.length === 0) return "Nessun file selezionato.";
  if (files.length > MAX_FILES) return `Puoi caricare al massimo ${MAX_FILES} file alla volta.`;
  for (const f of files) {
    if (f.size === 0) return `«${f.name}» è vuoto.`;
    if (f.size > MAX_FILE_BYTES) return `«${f.name}» supera il limite di 25 MB.`;
  }
  return null;
}

/** Registra i file nell'archivio; in Documenti crea anche la scheda a cui restano collegati. */
async function registra(saved: Allegato[], opt: UploadOptions): Promise<void> {
  const dest = DESTINAZIONI.find((d) => d.slug === opt.destinazione)!;
  const titolo = opt.titolo?.trim().slice(0, 300);
  const note = opt.note?.trim().slice(0, 2000) || undefined;
  const categoria = (CATEGORIE_DOCUMENTO as readonly string[]).includes(opt.categoria ?? "") ? opt.categoria! : "Altri";
  for (const a of saved) {
    a.titolo = saved.length === 1 && titolo ? titolo : titleFromName(a.nome);
    a.note = note;
  }
  await withDb((db) => {
    if (dest.crea === "documenti") {
      const now = new Date().toISOString();
      const doc: Documento = {
        id: crypto.randomUUID(), createdAt: now, updatedAt: now,
        titolo: titolo || saved[0].titolo, categoria, note,
      };
      db.documenti.push(doc);
      for (const a of saved) Object.assign(a, { collezione: "documenti", recordId: doc.id });
    }
    db.allegati.push(...saved);
    return { db, result: undefined };
  });
}

const nuovoAllegato = (id: string, nome: string, file: string, mime: string, dimensione: number, destinazione: string): Allegato => {
  const now = new Date().toISOString();
  return { id, createdAt: now, updatedAt: now, nome, file, mime: mime || "application/octet-stream", dimensione, destinazione, titolo: nome };
};

/** Locale: i file arrivano al server e vengono scritti su disco. */
export async function addAllegati(files: File[], opt: UploadOptions): Promise<UploadResult> {
  const s = await getSessione();
  if (s.modo !== "locale") return { ok: false, error: "Caricamento non disponibile in questa modalità." };
  if (!DESTINAZIONI.some((d) => d.slug === opt.destinazione)) return { ok: false, error: "Scegli dove deve andare il file." };
  const invalid = checkFiles(files);
  if (invalid) return { ok: false, error: invalid };

  await fs.mkdir(FILES_DIR, { recursive: true });
  const saved: Allegato[] = [];
  for (const f of files) {
    const id = crypto.randomUUID();
    const file = `${id}-${safeName(f.name)}`;
    await fs.writeFile(path.join(FILES_DIR, file), Buffer.from(await f.arrayBuffer()));
    saved.push(nuovoAllegato(id, f.name, file, f.type, f.size, opt.destinazione));
  }
  await registra(saved, opt);
  return { ok: true, count: saved.length };
}

/**
 * Cloud: il browser ha già caricato i file nella cartella dell'utente (la RLS impedisce
 * di scrivere altrove). Qui si controlla che ogni file esista davvero, poi si registra.
 */
export async function registraCaricati(files: FileCaricato[], opt: UploadOptions): Promise<UploadResult> {
  const s = await getSessione();
  if (s.modo !== "cloud") return { ok: false, error: "Caricamento non disponibile in questa modalità." };
  if (!DESTINAZIONI.some((d) => d.slug === opt.destinazione)) return { ok: false, error: "Scegli dove deve andare il file." };
  const invalid = checkFiles(files.map((f) => ({ name: f.nome, size: f.dimensione })));
  if (invalid) return { ok: false, error: invalid };

  const { data: presenti, error } = await s.supabase.storage.from(BUCKET_ALLEGATI).list(s.userId, { limit: 1000 });
  if (error) return { ok: false, error: "Non riesco a verificare i file caricati. Riprova." };
  const saved: Allegato[] = [];
  for (const f of files) {
    if (!/^[0-9a-f-]{36}$/.test(f.id)) return { ok: false, error: "Caricamento non valido." };
    const file = storagePath(s.userId, f.id, f.nome);
    const oggetto = presenti?.find((o) => `${s.userId}/${o.name}` === file);
    if (!oggetto) return { ok: false, error: `«${f.nome}» non risulta caricato. Riprova.` };
    const size = Number((oggetto.metadata as { size?: number } | null)?.size ?? f.dimensione);
    saved.push(nuovoAllegato(f.id, f.nome.slice(0, 300), file, String(f.mime).slice(0, 120), size, opt.destinazione));
  }
  await registra(saved, opt);
  return { ok: true, count: saved.length };
}

export type FileAperto =
  | { tipo: "dati"; meta: Allegato; data: Buffer }
  | { tipo: "link"; meta: Allegato; url: string };

/** Locale: contenuto del file. Cloud: link temporaneo (60 s) firmato da Supabase. */
export async function getAllegato(id: string, download: boolean): Promise<FileAperto | null> {
  const meta = (await readDb()).allegati.find((a) => a.id === id);
  if (!meta) return null;
  const s = await getSessione();
  if (s.modo === "cloud") {
    const { data, error } = await s.supabase.storage.from(BUCKET_ALLEGATI)
      .createSignedUrl(meta.file, 60, download ? { download: meta.nome } : undefined);
    return error || !data ? null : { tipo: "link", meta, url: data.signedUrl };
  }
  if (s.modo !== "locale") return null;
  try {
    // `file` arriva dall'archivio: si usa solo il nome, mai un percorso.
    return { tipo: "dati", meta, data: await fs.readFile(path.join(FILES_DIR, path.basename(meta.file))) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function deleteAllegato(id: string): Promise<Result> {
  const removed = await withDb<Allegato | null>((db) => {
    const i = db.allegati.findIndex((a) => a.id === id);
    if (i < 0) return { result: null };
    const [a] = db.allegati.splice(i, 1);
    return { db, result: a };
  });
  if (!removed) return { ok: false, error: "Il file non esiste più." };
  const s = await getSessione();
  if (s.modo === "cloud") await s.supabase.storage.from(BUCKET_ALLEGATI).remove([removed.file]);
  else await fs.rm(path.join(FILES_DIR, path.basename(removed.file)), { force: true });
  return { ok: true };
}
