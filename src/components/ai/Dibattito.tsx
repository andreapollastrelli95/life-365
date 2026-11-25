"use client";

import { Play, Square } from "lucide-react";
import { useState } from "react";
import { AGENTI, MODERATORE, istruzioniAgente, istruzioniModeratore } from "@/lib/ai/agenti";
import { ErroreAI, genera, REGOLE_BASE } from "@/lib/ai/gemini";
import { TestoAI, useAi, useAnnullabile } from "./comune";

interface Intervento {
  nome: string;
  colore: string;
  testo: string;
  giro: number;
}

const TEMI = [
  "Conviene estinguere prima un debito o investire i risparmi?",
  "Come organizzare le spese dell'anno prossimo?",
  "Quali abbonamenti tenere e quali disdire?",
];

/** Dibattito a turni tra agenti AI con punti di vista diversi, chiuso da una sintesi. */
export function Dibattito() {
  const { chiave, contesto } = useAi();
  const [tema, setTema] = useState("");
  const [scelti, setScelti] = useState<string[]>(["prudente", "ottimista", "diavolo"]);
  const [giri, setGiri] = useState(2);
  const [usaDati, setUsaDati] = useState(true);
  const [interventi, setInterventi] = useState<Intervento[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const job = useAnnullabile();

  const alterna = (id: string) =>
    setScelti((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));

  const avvia = async () => {
    const t = tema.trim();
    if (!t || scelti.length < 2) return;
    setErrore(null);
    setInterventi([]);
    const ctrl = job.avvia();
    const agenti = AGENTI.filter((a) => scelti.includes(a.id));
    const dati = usaDati ? `\n\n# DATI DELL'UTENTE\n${contesto()}` : "\n\nNon hai i dati dell'utente: ragiona in generale.";
    const fatti: Intervento[] = [];
    const trascrizione = () => fatti.map((x) => `${x.nome}: ${x.testo}`).join("\n\n") || "(nessun intervento finora)";
    try {
      for (let giro = 1; giro <= giri; giro++) {
        for (const a of agenti) {
          const { testo } = await genera(chiave, {
            sistema: `${REGOLE_BASE}\n${istruzioniAgente(a, t, agenti.filter((x) => x !== a).map((x) => x.nome))}${dati}`,
            messaggi: [{ ruolo: "user", testo: `Dibattito finora:\n${trascrizione()}\n\nOra tocca a te (giro ${giro} di ${giri}).` }],
            temperatura: 0.8, maxToken: 400, segnale: ctrl.signal,
          });
          fatti.push({ nome: a.nome, colore: a.colore, testo, giro });
          setInterventi([...fatti]);
        }
      }
      const { testo } = await genera(chiave, {
        sistema: `${REGOLE_BASE}\n${istruzioniModeratore(t)}`,
        messaggi: [{ ruolo: "user", testo: `Dibattito completo:\n${trascrizione()}` }],
        temperatura: 0.4, maxToken: 600, segnale: ctrl.signal,
      });
      fatti.push({ nome: MODERATORE.nome, colore: MODERATORE.colore, testo, giro: 0 });
      setInterventi([...fatti]);
    } catch (err) {
      setErrore(err instanceof ErroreAI ? err.message : "Il dibattito si è interrotto. Riprova.");
    } finally {
      job.fine();
    }
  };

  if (!chiave) return <p className="text-sm text-muted">Per i dibattiti inserisci prima la tua chiave API nella scheda «Chiave e privacy».</p>;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <label htmlFor="tema" className="label">Tema del dibattito</label>
        <textarea id="tema" rows={2} className="input" placeholder="Es. Conviene comprare un'auto nuova quest'anno?" value={tema} onChange={(e) => setTema(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMI.map((x) => <button key={x} type="button" className="btn text-xs" onClick={() => setTema(x)}>{x}</button>)}
        </div>
      </div>

      <fieldset>
        <legend className="label">Partecipanti (da 2 a 4)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AGENTI.map((a) => (
            <label key={a.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 ${scelti.includes(a.id) ? "border-accent bg-accent/5" : "border-line"}`}>
              <input type="checkbox" className="mt-1" checked={scelti.includes(a.id)} onChange={() => alterna(a.id)}
                disabled={!scelti.includes(a.id) && scelti.length >= 4} />
              <span><span className="font-medium" style={{ color: a.colore }}>{a.nome}</span><span className="block text-xs text-muted">{a.ruolo}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">Giri
          <select className="input w-auto" value={giri} onChange={(e) => setGiri(Number(e.target.value))}>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={usaDati} onChange={(e) => setUsaDati(e.target.checked)} /> Usa i miei dati</label>
        {job.inCorso
          ? <button type="button" className="btn" onClick={job.ferma}><Square className="size-4" aria-hidden /> Ferma</button>
          : <button type="button" className="btn btn-primary" disabled={!tema.trim() || scelti.length < 2} onClick={avvia}><Play className="size-4" aria-hidden /> Avvia il dibattito</button>}
      </div>

      {errore && <p role="alert" className="rounded-lg bg-bad-bg px-3 py-2 text-bad">{errore}</p>}

      <div className="space-y-3" aria-live="polite">
        {interventi.map((x, i) => (
          <article key={i} className="card border-l-4 p-3" style={{ borderLeftColor: x.colore }}>
            <p className="mb-1 text-xs font-semibold" style={{ color: x.colore }}>{x.nome}{x.giro ? ` · giro ${x.giro}` : " · sintesi"}</p>
            <TestoAI testo={x.testo} />
          </article>
        ))}
        {job.inCorso && <p role="status" className="text-accent">Il dibattito è in corso…</p>}
      </div>
    </div>
  );
}
