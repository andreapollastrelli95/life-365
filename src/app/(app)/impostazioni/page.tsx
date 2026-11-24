"use client";

import { Download, Eraser, RotateCcw } from "lucide-react";
import { useState } from "react";
import { resetAction } from "@/app/actions";
import { useData } from "@/components/DataProvider";
import { useToast } from "@/components/Toast";
import { ComingSoon, Modal, PageHeader, Section } from "@/components/ui";
import { formatDate } from "@/lib/domain/dates";
import { COLLECTION_KEYS, isDemo } from "@/lib/types";

type Conferma = "demo" | "vuoto" | null;

export default function ImpostazioniPage() {
  const { db, sessione } = useData();
  const notify = useToast();
  const [confirming, setConfirming] = useState<Conferma>(null);
  const [busy, setBusy] = useState(false);
  const records = COLLECTION_KEYS.reduce((n, k) => n + db[k].length, 0);
  const demo = isDemo(db);
  const profilo = db.meta.profilo;
  const cloud = sessione.modo === "cloud";
  const dove = cloud ? "nel tuo spazio cloud (ne restano le ultime 5)" : "in data\\backup";

  const reset = async () => {
    const tipo = confirming;
    if (!tipo) return;
    setBusy(true);
    try {
      const result = await resetAction(tipo);
      if (result.ok) notify("success", tipo === "demo" ? "Dati di esempio caricati" : "Archivio svuotato");
      else notify("error", result.error);
    } catch {
      notify("error", "Operazione non riuscita. Riprova.");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  const riga = (label: string, value?: string) =>
    value ? <div className="flex justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="text-right break-all">{value}</dd></div> : null;

  return (
    <>
      <PageHeader title="Impostazioni" description="Account, preferenze e dati." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={cloud ? "Account" : "Profilo"}>
          <dl className="space-y-1.5 text-sm">
            {cloud ? riga("E-mail", sessione.email) : riga("Nome", profilo?.nome ?? (sessione.modo === "demo" ? "Ospite demo" : "Profilo demo"))}
            {!cloud && riga("Codice fiscale", profilo?.codiceFiscale)}
            {!cloud && riga("Nascita", profilo?.nascita)}
            {!cloud && riga("Residenza", profilo?.residenza)}
            {!cloud && riga("Telefono", profilo?.telefono)}
            {riga("Accesso", cloud ? "Account con e-mail e password: i tuoi dati li vedi solo tu"
              : sessione.modo === "demo" ? "Demo senza account: nulla viene salvato"
              : "Installazione locale, senza login")}
            {riga("Valuta", "EUR")}
            {riga("Formato data", "GG/MM/AAAA")}
          </dl>
        </Section>

        <Section title="Dati">
          <p className="text-sm text-muted">
            {records} record e {db.allegati.length} file in archivio.{" "}
            {demo ? `Dati di esempio generati il ${formatDate(db.meta.seededAt.slice(0, 10))}.` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/export" download className="btn"><Download className="size-4" aria-hidden /> Esporta in JSON</a>
            {sessione.modo !== "demo" && (
              <>
                <button type="button" className="btn" onClick={() => setConfirming("demo")}>
                  <RotateCcw className="size-4" aria-hidden /> Carica dati di esempio
                </button>
                <button type="button" className="btn" onClick={() => setConfirming("vuoto")}>
                  <Eraser className="size-4" aria-hidden /> Svuota archivio
                </button>
              </>
            )}
          </div>
          {sessione.modo === "demo" && <p className="mt-3 text-sm text-muted">Nella demo i dati sono sempre quelli di esempio: crea un account per usare i tuoi.</p>}
        </Section>

        <Section title="Funzioni non ancora disponibili">
          <div className="flex flex-wrap gap-2">
            <ComingSoon label="Report PDF" />
            <ComingSoon label="Importazione da JSON" />
            <ComingSoon label="Categorie personalizzate" />
            <ComingSoon label="Notifiche configurabili" />
            <ComingSoon label="Accesso dell'assistente ai dati sanitari" />
          </div>
        </Section>
      </div>

      {confirming && (
        <Modal title={confirming === "demo" ? "Caricare i dati di esempio?" : "Svuotare l'archivio?"} onClose={() => setConfirming(null)}>
          <p className="text-sm">
            {confirming === "demo"
              ? "L'archivio attuale verrà sostituito dai dati di esempio, tutti inventati."
              : "Tutti i record verranno eliminati e l'archivio ripartirà vuoto."}{" "}
            Prima della sostituzione viene salvata una copia di sicurezza {dove}.
            {db.allegati.length > 0 && " I file già caricati restano nello spazio di archiviazione."}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setConfirming(null)}>Annulla</button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={reset}>
              {confirming === "demo" ? "Carica esempio" : "Svuota"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
