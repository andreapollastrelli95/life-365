"use client";

import { Fragment, useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { costruisciContesto, OPZIONI_PREDEFINITE, type OpzioniContesto } from "@/lib/ai/contesto";
import { cancellaChiave, leggiChiave, salvaChiave } from "@/lib/ai/gemini";
import { useData } from "../DataProvider";

const OPZ_STORE = "life365-ai-opzioni";
const ascoltatori = new Set<() => void>();
const avvisa = () => ascoltatori.forEach((f) => f());
const iscrivi = (f: () => void) => { ascoltatori.add(f); return () => ascoltatori.delete(f); };

function leggiOpzioni(): string {
  try { return localStorage.getItem(OPZ_STORE) ?? ""; } catch { return ""; }
}

/** Chiave e preferenze dell'assistente, salvate solo in questo browser. */
export function useAi() {
  const { db, today } = useData();
  const chiave = useSyncExternalStore(iscrivi, leggiChiave, () => "");
  const opzRaw = useSyncExternalStore(iscrivi, leggiOpzioni, () => "");
  let opzioni: OpzioniContesto = OPZIONI_PREDEFINITE;
  try { if (opzRaw) opzioni = { ...OPZIONI_PREDEFINITE, ...JSON.parse(opzRaw) }; } catch { /* valori predefiniti */ }

  const impostaChiave = useCallback((k: string) => { if (k) salvaChiave(k); else cancellaChiave(); avvisa(); }, []);
  const impostaOpzioni = useCallback((o: OpzioniContesto) => {
    try { localStorage.setItem(OPZ_STORE, JSON.stringify(o)); } catch { /* niente */ }
    avvisa();
  }, []);
  const contesto = useCallback(() => costruisciContesto(db, today, opzioni), [db, today, opzioni]);
  return { chiave, impostaChiave, opzioni, impostaOpzioni, contesto };
}

/** Testo del modello con grassetti (**) ed elenchi puntati, senza HTML grezzo. */
export function TestoAI({ testo }: { testo: string }) {
  const inline = (riga: string): ReactNode[] =>
    riga.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>);
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {testo.split("\n").map((riga, i) => {
        const t = riga.trim();
        if (!t) return null;
        const elenco = /^[-*•]\s+/.test(t);
        const titolo = /^#{1,4}\s+/.test(t);
        if (titolo) return <p key={i} className="font-semibold text-night-900">{inline(t.replace(/^#{1,4}\s+/, ""))}</p>;
        return elenco
          ? <p key={i} className="flex gap-2 pl-1"><span aria-hidden>•</span><span>{inline(t.replace(/^[-*•]\s+/, ""))}</span></p>
          : <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}

export function useAnnullabile() {
  const [ctrl, setCtrl] = useState<AbortController | null>(null);
  const avvia = () => { const c = new AbortController(); setCtrl(c); return c; };
  const ferma = () => ctrl?.abort();
  const fine = () => setCtrl(null);
  return { inCorso: ctrl !== null, avvia, ferma, fine };
}
