"use client";

import { Send, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { ErroreAI, genera, REGOLE_BASE, type Messaggio } from "@/lib/ai/gemini";
import { TestoAI, useAi, useAnnullabile } from "./comune";

const ESEMPI = [
  "Dove posso risparmiare almeno 100 € al mese?",
  "Riassumi la mia situazione finanziaria in 5 punti.",
  "Quali scadenze devo preparare nei prossimi 30 giorni?",
  "Quanto ho speso in ristoranti e bar quest'anno, mese per mese?",
];

/** Domande libere all'AI, con i dati dell'utente come contesto. */
export function ChatLibera() {
  const { chiave, contesto } = useAi();
  const [messaggi, setMessaggi] = useState<(Messaggio & { modello?: string })[]>([]);
  const [domanda, setDomanda] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const job = useAnnullabile();

  const chiedi = async (testo: string) => {
    const q = testo.trim();
    if (!q || job.inCorso) return;
    setErrore(null);
    setDomanda("");
    const storia = [...messaggi, { ruolo: "user" as const, testo: q }];
    setMessaggi(storia);
    const ctrl = job.avvia();
    try {
      const { testo: risposta, modello } = await genera(chiave, {
        sistema: `${REGOLE_BASE}\nSei l'assistente personale di LIFE 365.\n\n# DATI DELL'UTENTE\n${contesto()}`,
        messaggi: storia.map(({ ruolo, testo: t }) => ({ ruolo, testo: t })),
        segnale: ctrl.signal,
      });
      setMessaggi([...storia, { ruolo: "model", testo: risposta, modello }]);
    } catch (err) {
      setErrore(err instanceof ErroreAI ? err.message : "Risposta non riuscita. Riprova.");
      setMessaggi(messaggi);
      setDomanda(q);
    } finally {
      job.fine();
    }
  };

  if (!chiave) return <p className="text-sm text-muted">Per le domande libere inserisci prima la tua chiave API nella scheda «Chiave e privacy».</p>;

  return (
    <div className="space-y-3">
      {messaggi.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {ESEMPI.map((e) => <button key={e} type="button" className="btn text-left" onClick={() => chiedi(e)}>{e}</button>)}
        </div>
      )}

      <div className="space-y-3" aria-live="polite">
        {messaggi.map((m, i) => (
          <article key={i} className={`card p-3 ${m.ruolo === "user" ? "ml-auto max-w-[85%] bg-night-800/5" : ""}`}>
            {m.ruolo === "user" ? <p className="text-sm font-medium whitespace-pre-wrap">{m.testo}</p> : <TestoAI testo={m.testo} />}
            {m.modello && <p className="mt-2 text-xs text-muted">Risposta di {m.modello}: verifica le cifre importanti.</p>}
          </article>
        ))}
        {job.inCorso && <p role="status" className="text-sm text-accent">L&apos;AI sta pensando…</p>}
      </div>

      {errore && <p role="alert" className="rounded-lg bg-bad-bg px-3 py-2 text-sm text-bad">{errore}</p>}

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); chiedi(domanda); }}>
        <label htmlFor="domanda-ai" className="sr-only">Domanda</label>
        <textarea id="domanda-ai" rows={2} className="input min-w-0 flex-1 resize-y" placeholder="Scrivi una domanda sui tuoi dati…"
          value={domanda} onChange={(e) => setDomanda(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chiedi(domanda); } }} />
        <div className="flex flex-col gap-1">
          {job.inCorso
            ? <button type="button" className="btn" onClick={job.ferma} aria-label="Ferma"><Square className="size-4" aria-hidden /></button>
            : <button type="submit" className="btn btn-primary" disabled={!domanda.trim()} aria-label="Invia"><Send className="size-4" aria-hidden /></button>}
          {messaggi.length > 0 && !job.inCorso && (
            <button type="button" className="btn" onClick={() => setMessaggi([])} aria-label="Nuova conversazione" title="Nuova conversazione"><Trash2 className="size-4" aria-hidden /></button>
          )}
        </div>
      </form>
    </div>
  );
}
