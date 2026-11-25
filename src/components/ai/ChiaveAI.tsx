"use client";

import { Eye, KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { ErroreAI, verificaChiave } from "@/lib/ai/gemini";
import { useToast } from "../Toast";
import { Modal } from "../ui";
import { useAi } from "./comune";

/** Chiave API Gemini dell'utente e scelta dei dati da condividere con l'AI. */
export function ChiaveAI() {
  const { chiave, impostaChiave, opzioni, impostaOpzioni, contesto } = useAi();
  const notify = useToast();
  const [nuova, setNuova] = useState("");
  const [busy, setBusy] = useState(false);
  const [anteprima, setAnteprima] = useState<string | null>(null);

  const salva = async () => {
    setBusy(true);
    try {
      const modello = await verificaChiave(nuova.trim());
      impostaChiave(nuova.trim());
      setNuova("");
      notify("success", `Chiave verificata (${modello}) e salvata su questo dispositivo`);
    } catch (err) {
      notify("error", err instanceof ErroreAI ? err.message : "Verifica non riuscita. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {chiave ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-good-bg px-2 py-1 font-medium text-good">
            <KeyRound className="size-4" aria-hidden /> Chiave attiva su questo dispositivo ({chiave.slice(0, 4)}…{chiave.slice(-4)})
          </span>
          <button type="button" className="btn" onClick={() => impostaChiave("")}><Trash2 className="size-4" aria-hidden /> Rimuovi</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p>
            Serve una chiave API di Google Gemini (c&apos;è un piano gratuito). Creala su{" "}
            <a className="text-accent underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a>{" "}
            con «Create API key», poi incollala qui.
          </p>
          <div className="flex flex-wrap gap-2">
            <label htmlFor="chiave-ai" className="sr-only">Chiave API Gemini</label>
            <input id="chiave-ai" type="password" autoComplete="off" className="input min-w-0 flex-1" placeholder="Incolla la chiave"
              value={nuova} onChange={(e) => setNuova(e.target.value)} />
            <button type="button" className="btn btn-primary" disabled={busy || nuova.trim().length < 20} onClick={salva}>
              {busy ? "Verifica…" : "Verifica e salva"}
            </button>
          </div>
        </div>
      )}

      <fieldset className="space-y-1.5">
        <legend className="mb-1 font-medium">Dati da condividere con l&apos;AI</legend>
        <p className="text-muted">Sempre inclusi: riepiloghi di conti, spese, patrimonio, abbonamenti, documenti e scadenze. Mai inclusi: codice fiscale, numeri dei documenti, targhe, recapiti dei contatti, note.</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={opzioni.movimenti} onChange={(e) => impostaOpzioni({ ...opzioni, movimenti: e.target.checked })} />
          Elenco dei singoli movimenti (anno in corso e precedente)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={opzioni.salute} onChange={(e) => impostaOpzioni({ ...opzioni, salute: e.target.checked })} />
          Dati sanitari (visite, esami, farmaci)
        </label>
        <button type="button" className="btn mt-1" onClick={() => setAnteprima(contesto())}><Eye className="size-4" aria-hidden /> Vedi cosa viene inviato</button>
      </fieldset>

      <p className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
        Le domande e i dati scelti vanno direttamente dal tuo browser a Google, non al server di LIFE 365. La chiave resta solo
        su questo dispositivo. Con le chiavi gratuite Google può usare i contenuti per migliorare i suoi servizi: se preferisci
        evitarlo, usa una chiave con fatturazione attiva.
      </p>

      {anteprima !== null && (
        <Modal title="Dati inviati all'AI" onClose={() => setAnteprima(null)}>
          <p className="mb-2 text-xs text-muted">{anteprima.length.toLocaleString("it-IT")} caratteri. Viene inviato insieme a ogni domanda.</p>
          <pre className="max-h-[60vh] overflow-auto rounded-lg bg-canvas p-3 text-xs whitespace-pre-wrap">{anteprima}</pre>
        </Modal>
      )}
    </div>
  );
}
