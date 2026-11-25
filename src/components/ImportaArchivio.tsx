"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { importaAction } from "@/app/actions";
import { getBrowserClient } from "@/lib/supabase/client";
import { BUCKET_ALLEGATI } from "@/lib/supabase/config";
import { useData } from "./DataProvider";
import { useToast } from "./Toast";
import { Modal } from "./ui";

// I file di LIFE OS si chiamano "<id>-<nome>": solo questi vengono trasferiti.
const FILE_LIFE_OS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-.+/;

/** Importa nell'archivio un file esportato da LIFE OS o LIFE 365, con i file allegati (nel cloud). */
export function ImportaArchivio() {
  const { sessione, db } = useData();
  const notify = useToast();
  const router = useRouter();
  const cloud = sessione.modo === "cloud";
  const [json, setJson] = useState<File | null>(null);
  const [allegati, setAllegati] = useState<File[]>([]);
  const [conferma, setConferma] = useState(false);
  const [stato, setStato] = useState<string | null>(null);

  const scegliAllegati = (list: FileList | null) => {
    const tutti = [...(list ?? [])];
    const validi = tutti.filter((f) => FILE_LIFE_OS.test(f.name));
    if (validi.length < tutti.length) notify("error", `${tutti.length - validi.length} file ignorati: non vengono dalla cartella degli allegati di LIFE OS.`);
    setAllegati(validi);
  };

  const importa = async () => {
    if (!json) return;
    setConferma(false);
    try {
      if (cloud && allegati.length) {
        const sb = getBrowserClient();
        const { data } = await sb.auth.getUser();
        if (!data.user) return notify("error", "Sessione scaduta: accedi di nuovo.");
        for (const [i, f] of allegati.entries()) {
          setStato(`Trasferimento file ${i + 1} di ${allegati.length}…`);
          const { error } = await sb.storage.from(BUCKET_ALLEGATI)
            .upload(`${data.user.id}/${f.name}`, f, { contentType: f.type || "application/octet-stream", upsert: true });
          if (error) return notify("error", `«${f.name}» non è stato trasferito. Riprova: i file già trasferiti non vengono duplicati.`);
        }
      }
      setStato("Importazione dei dati…");
      const r = await importaAction(await json.text());
      if (!r.ok) return notify("error", r.error);
      const file = cloud && (r.fileCollegati || r.fileMancanti)
        ? ` File collegati: ${r.fileCollegati}${r.fileMancanti ? `, mancanti: ${r.fileMancanti}` : ""}.` : "";
      notify("success", `Importati ${r.record} record.${file}`);
      setJson(null);
      setAllegati([]);
      router.refresh();
    } catch {
      notify("error", "Importazione non riuscita. Riprova.");
    } finally {
      setStato(null);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">
        Porta qui i dati esportati da LIFE OS o da un altro account LIFE 365. L&apos;archivio attuale viene sostituito,
        dopo una copia di sicurezza.
      </p>
      <div>
        <label className="label" htmlFor="imp-json">1. File dei dati (.json)</label>
        <input id="imp-json" type="file" accept=".json,application/json" className="input"
          onChange={(e) => setJson(e.target.files?.[0] ?? null)} />
      </div>
      {cloud && (
        <div>
          <label className="label" htmlFor="imp-file">2. File allegati <span className="font-normal text-muted">(facoltativo: seleziona tutti i file della cartella)</span></label>
          <input id="imp-file" type="file" multiple className="input" onChange={(e) => scegliAllegati(e.target.files)} />
          {allegati.length > 0 && <p className="mt-1 text-xs text-muted">{allegati.length} file pronti da trasferire.</p>}
        </div>
      )}
      {stato && <p role="status" className="text-accent">{stato}</p>}
      <button type="button" className="btn btn-primary" disabled={!json || stato !== null} onClick={() => setConferma(true)}>
        <Upload className="size-4" aria-hidden /> Importa
      </button>

      {conferma && (
        <Modal title="Importare l'archivio?" onClose={() => setConferma(false)}>
          <p className="text-sm">
            I dati di «{json?.name}» sostituiranno l&apos;archivio attuale
            ({db.movimenti.length} movimenti, {db.documenti.length} documenti). Prima viene salvata una copia di sicurezza.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setConferma(false)}>Annulla</button>
            <button type="button" className="btn btn-primary" onClick={importa}>Importa</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
