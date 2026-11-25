import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { todayISO } from "@/lib/domain/dates";
import { COLLECTION_KEYS, type Db } from "@/lib/types";
import { createEmpty, createSeed } from "./seed";
import { AccessoRichiestoError, getSessione, type Sessione } from "./sessione";

/**
 * Archivio di LIFE 365. Due persistenze dietro la stessa interfaccia:
 * - locale: file `data/lifeos.json` sul PC (nessun Supabase configurato);
 * - cloud: una riga per utente nella tabella `life365_archivio` di Supabase, protetta da RLS.
 * Le pagine e le azioni usano solo readDb / withDb / resetDb.
 */

function validate(db: Db): Db {
  for (const key of COLLECTION_KEYS) {
    if (!Array.isArray(db[key])) throw new Error(`Archivio non valido: manca "${key}"`);
  }
  if (!Array.isArray(db.allegati)) db.allegati = []; // archivi creati prima degli allegati
  return db;
}

// ---------------------------------------------------------------- locale (file)

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "lifeos.json");

async function writeFileAtomic(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  // Su Windows il rename può fallire se un altro processo tiene aperto il file.
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(tmp, DATA_FILE);
      return;
    } catch (err) {
      if (attempt >= 4) {
        await fs.rm(tmp, { force: true });
        throw err;
      }
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
}

async function readFileDb(): Promise<Db> {
  let raw: string;
  try {
    raw = await fs.readFile(DATA_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const seed = createSeed(todayISO());
    await writeFileAtomic(seed);
    return seed;
  }
  return validate(JSON.parse(raw) as Db); // un file corrotto arriva alla pagina di errore
}

async function backupFile(): Promise<void> {
  try {
    const dir = path.join(DATA_DIR, "backup");
    await fs.mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.copyFile(DATA_FILE, path.join(dir, `lifeos-${stamp}.json`));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

// Le scritture su file passano in coda: due salvataggi ravvicinati non si sovrascrivono.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

// ---------------------------------------------------------------- cloud (Supabase)

type Cloud = Extract<Sessione, { modo: "cloud" }>;
const MAX_TENTATIVI = 3;
const BACKUP_DA_TENERE = 5;

async function readCloudRow(s: Cloud): Promise<{ db: Db; versione: number }> {
  const { data, error } = await s.supabase
    .from("life365_archivio").select("dati, versione").eq("user_id", s.userId).maybeSingle();
  if (error) throw new Error(`Lettura archivio: ${error.message}`);
  if (data) return { db: validate(data.dati as Db), versione: data.versione as number };

  // Primo accesso: archivio vuoto. `ignoreDuplicates` evita errori se due richieste arrivano insieme.
  const empty = createEmpty(todayISO());
  const ins = await s.supabase.from("life365_archivio")
    .upsert({ user_id: s.userId, dati: empty, versione: 1 }, { onConflict: "user_id", ignoreDuplicates: true });
  if (ins.error) throw new Error(`Creazione archivio: ${ins.error.message}`);
  return { db: empty, versione: 1 };
}

/** Scrive solo se nessun altro ha salvato nel frattempo (controllo sulla versione). */
async function writeCloudRow(s: Cloud, db: Db, versione: number): Promise<boolean> {
  const { data, error } = await s.supabase.from("life365_archivio")
    .update({ dati: db, versione: versione + 1, aggiornato: new Date().toISOString() })
    .eq("user_id", s.userId).eq("versione", versione).select("versione");
  if (error) throw new Error(`Salvataggio archivio: ${error.message}`);
  return (data?.length ?? 0) === 1;
}

async function backupCloud(s: Cloud, db: Db): Promise<void> {
  const { error } = await s.supabase.from("life365_backup").insert({ user_id: s.userId, dati: db });
  if (error) throw new Error(`Copia di sicurezza: ${error.message}`);
  const { data } = await s.supabase.from("life365_backup")
    .select("id").eq("user_id", s.userId).order("creato", { ascending: false });
  const vecchi = (data ?? []).slice(BACKUP_DA_TENERE).map((r) => r.id as number);
  if (vecchi.length) await s.supabase.from("life365_backup").delete().in("id", vecchi);
}

// ---------------------------------------------------------------- interfaccia comune

export async function readDb(): Promise<Db> {
  const s = await getSessione();
  switch (s.modo) {
    case "locale": return readFileDb();
    case "cloud": return (await readCloudRow(s)).db;
    case "anonimo": throw new AccessoRichiestoError();
  }
}

export async function withDb<T>(fn: (db: Db) => { db?: Db; result: T }): Promise<T> {
  const s = await getSessione();
  switch (s.modo) {
    case "locale":
      return enqueue(async () => {
        const { db, result } = fn(await readFileDb());
        if (db) await writeFileAtomic(db);
        return result;
      });
    case "cloud":
      for (let tentativo = 1; ; tentativo++) {
        const { db: current, versione } = await readCloudRow(s);
        const { db, result } = fn(current);
        if (!db || (await writeCloudRow(s, db, versione))) return result;
        // Un'altra scheda o dispositivo ha salvato nel frattempo: si riapplica sui dati nuovi.
        if (tentativo >= MAX_TENTATIVI) throw new Error("Salvataggio in conflitto con un altro dispositivo. Riprova.");
      }
    case "anonimo": throw new AccessoRichiestoError();
  }
}

/** Sostituisce l'intero archivio con `nuovo`, dopo una copia di sicurezza di quello attuale. */
export async function replaceDb(nuovo: Db): Promise<void> {
  const s = await getSessione();
  switch (s.modo) {
    case "locale":
      return enqueue(async () => {
        await backupFile();
        await writeFileAtomic(validate(nuovo));
      });
    case "cloud": {
      const { db, versione } = await readCloudRow(s);
      await backupCloud(s, db);
      if (!(await writeCloudRow(s, validate(nuovo), versione))) throw new Error("Archivio modificato nel frattempo. Riprova.");
      return;
    }
    case "anonimo": throw new AccessoRichiestoError();
  }
}

/** Sostituisce l'archivio con i dati demo (solo locale) o con un archivio vuoto. */
export async function resetDb(tipo: "demo" | "vuoto" = "demo"): Promise<void> {
  const s = await getSessione();
  // Negli account niente dati inventati: si può solo ripartire da un archivio vuoto.
  if (s.modo === "cloud" && tipo === "demo") throw new Error("Dati di esempio non disponibili negli account.");
  return replaceDb(tipo === "demo" ? createSeed(todayISO()) : createEmpty(todayISO()));
}
