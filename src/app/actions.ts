"use server";

import { revalidatePath } from "next/cache";
import { deleteRecord, patchRecord, resetDemoData, saveRecord } from "@/lib/data";
import { deleteAllegato, registraCaricati, type FileCaricato, type UploadOptions } from "@/lib/data/allegati";
import { COLLECTION_KEYS, type CollectionKey } from "@/lib/types";
import { COLLECTIONS } from "@/modules/collections";
import { parseRecord, type FormValues } from "@/modules/engine";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const GENERIC_ERROR = "Operazione non riuscita. Riprova.";

const isCollection = (key: string): key is CollectionKey =>
  (COLLECTION_KEYS as string[]).includes(key);

function refresh() {
  revalidatePath("/", "layout");
}

async function guarded(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Crea (id null) o aggiorna un record. La validazione è ripetuta qui, lato server. */
export async function saveAction(key: string, id: string | null, raw: FormValues): Promise<ActionResult> {
  return guarded(async () => {
    if (!isCollection(key)) return { ok: false, error: GENERIC_ERROR };
    const parsed = parseRecord(COLLECTIONS[key], raw);
    if (!parsed.ok) return { ok: false, error: "Controlla i campi evidenziati.", fieldErrors: parsed.errors };
    const result = await saveRecord(key, id, parsed.data);
    if (result.ok) refresh();
    return result;
  });
}

export async function deleteAction(key: string, id: string): Promise<ActionResult> {
  return guarded(async () => {
    if (!isCollection(key)) return { ok: false, error: GENERIC_ERROR };
    const result = await deleteRecord(key, id);
    if (result.ok) refresh();
    return result;
  });
}

/** Esegue un'azione di riga dichiarata nella configurazione: il client non sceglie i campi. */
export async function rowAction(key: string, id: string, actionId: string): Promise<ActionResult> {
  return guarded(async () => {
    if (!isCollection(key)) return { ok: false, error: GENERIC_ERROR };
    const action = COLLECTIONS[key].rowActions?.find((a) => a.id === actionId);
    if (!action) return { ok: false, error: GENERIC_ERROR };
    const result = await patchRecord(key, id, action.patch);
    if (result.ok) refresh();
    return result;
  });
}

/** Sostituisce l'archivio con i dati di esempio o con un archivio vuoto (dopo una copia di sicurezza). */
export async function resetAction(tipo: "demo" | "vuoto" = "demo"): Promise<ActionResult> {
  return guarded(async () => {
    await resetDemoData(tipo === "vuoto" ? "vuoto" : "demo");
    refresh();
    return { ok: true };
  });
}

export async function deleteAllegatoAction(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const result = await deleteAllegato(id);
    if (result.ok) refresh();
    return result;
  });
}

/** Cloud: registra i file che il browser ha appena caricato nella cartella dell'utente. */
export async function registraAllegatiAction(files: FileCaricato[], opt: UploadOptions): Promise<ActionResult & { count?: number }> {
  return guarded(async () => {
    const result = await registraCaricati(files, opt);
    if (!result.ok) return result;
    refresh();
    return { ok: true, count: result.count };
  });
}
