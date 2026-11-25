"use client";

import { Bot } from "lucide-react";
import { useState } from "react";
import { ChatLibera } from "@/components/ai/ChatLibera";
import { ChiaveAI } from "@/components/ai/ChiaveAI";
import { useAi } from "@/components/ai/comune";
import { Dibattito } from "@/components/ai/Dibattito";
import { useData } from "@/components/DataProvider";
import { Badge, PageHeader } from "@/components/ui";
import { QUESTIONS, type Answer } from "@/lib/domain/assistant";

interface Exchange {
  id: number;
  question: string;
  answer: Answer;
}

type Scheda = "libere" | "dibattito" | "pronte" | "chiave";
const SCHEDE: { id: Scheda; label: string }[] = [
  { id: "libere", label: "Domande libere" },
  { id: "dibattito", label: "Dibattito tra agenti" },
  { id: "pronte", label: "Domande pronte" },
  { id: "chiave", label: "Chiave e privacy" },
];

function DomandePronte() {
  const { db, today } = useData();
  const [history, setHistory] = useState<Exchange[]>([]);
  const ask = (questionId: string) => {
    const q = QUESTIONS.find((x) => x.id === questionId)!;
    setHistory((h) => [{ id: h.length + 1, question: q.label, answer: q.answer(db, today) }, ...h]);
  };
  return (
    <>
      <p className="mb-3 text-sm text-muted">Calcolate direttamente sui tuoi dati, senza AI e senza inviare nulla. La sezione Salute non viene letta.</p>
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((q) => <button key={q.id} type="button" className="btn" onClick={() => ask(q.id)}>{q.label}</button>)}
      </div>
      <div className="mt-5 space-y-3" aria-live="polite">
        {history.map((e) => (
          <article key={e.id} className="card p-4">
            <p className="text-sm font-semibold text-night-900">{e.question}</p>
            <div className="mt-2 flex gap-2.5">
              <Bot className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <div className="text-sm">
                <p>{e.answer.text}</p>
                {e.answer.items && <ul className="mt-1.5 list-disc space-y-0.5 pl-4">{e.answer.items.map((item) => <li key={item}>{item}</li>)}</ul>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default function AssistentePage() {
  const { chiave } = useAi();
  const [scheda, setScheda] = useState<Scheda | null>(null);
  const attiva: Scheda = scheda ?? (chiave ? "libere" : "chiave");

  return (
    <>
      <PageHeader title="Assistente AI" description="Domande libere e dibattiti tra agenti sui tuoi dati, con la tua chiave Gemini.">
        {chiave ? <Badge tone="good">Gemini collegato</Badge> : <Badge tone="warn">Chiave da inserire</Badge>}
      </PageHeader>

      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {SCHEDE.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={attiva === s.id} onClick={() => setScheda(s.id)}
            className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap ${attiva === s.id ? "border-accent text-night-900" : "border-transparent text-muted hover:text-ink"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {attiva === "libere" && <ChatLibera />}
      {attiva === "dibattito" && <Dibattito />}
      {attiva === "pronte" && <DomandePronte />}
      {attiva === "chiave" && <ChiaveAI />}
    </>
  );
}
