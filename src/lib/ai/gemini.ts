// Chiamate a Google Gemini fatte DIRETTAMENTE dal browser con la chiave dell'utente:
// la chiave non passa dal server di LIFE 365 e non viene salvata nel database.

/** Dal più veloce al più capace: se uno non risponde si passa al successivo. */
export const MODELLI = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 60_000;
const CHIAVE_STORE = "life365-gemini-chiave";

export interface Messaggio {
  ruolo: "user" | "model";
  testo: string;
}

export class ErroreAI extends Error {}

export function leggiChiave(): string {
  try { return localStorage.getItem(CHIAVE_STORE) ?? ""; } catch { return ""; }
}
export function salvaChiave(chiave: string): void {
  try { localStorage.setItem(CHIAVE_STORE, chiave.trim()); } catch { /* navigazione privata */ }
}
export function cancellaChiave(): void {
  try { localStorage.removeItem(CHIAVE_STORE); } catch { /* niente */ }
}

function messaggioErrore(status: number, corpo: string): string | null {
  if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(corpo)) return "La chiave API non è valida. Controllala in Impostazioni dell'assistente.";
  if (status === 403) return "La chiave non ha accesso a Gemini (403). Verifica che sia una chiave di Google AI Studio.";
  if (status === 429) return "Quota gratuita della chiave esaurita per ora. Riprova più tardi o domani.";
  return null; // 404, 500, 503: si prova il modello successivo
}

/** Una risposta del modello. Prova i modelli in ordine finché uno risponde. */
export async function genera(
  chiave: string,
  opz: { sistema: string; messaggi: Messaggio[]; temperatura?: number; maxToken?: number; segnale?: AbortSignal },
): Promise<{ testo: string; modello: string }> {
  if (!chiave) throw new ErroreAI("Inserisci prima la tua chiave API Gemini.");
  let ultimo = "Nessun modello ha risposto. Riprova tra poco.";
  for (const modello of MODELLI) {
    if (opz.segnale?.aborted) throw new ErroreAI("Interrotto.");
    const ctrl = new AbortController();
    const stop = () => ctrl.abort();
    opz.segnale?.addEventListener("abort", stop);
    const timer = setTimeout(stop, TIMEOUT_MS);
    try {
      const r = await fetch(`${API}/${modello}:generateContent`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": chiave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opz.sistema }] },
          contents: opz.messaggi.map((m) => ({ role: m.ruolo, parts: [{ text: m.testo }] })),
          generationConfig: { temperature: opz.temperatura ?? 0.5, maxOutputTokens: opz.maxToken ?? 1500 },
        }),
      });
      const corpo = await r.text();
      if (!r.ok) {
        const fatale = messaggioErrore(r.status, corpo);
        if (fatale) throw new ErroreAI(fatale);
        ultimo = `Il modello ${modello} non è disponibile (${r.status}).`;
        continue;
      }
      const dati = JSON.parse(corpo) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
      const testo = dati.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
      if (testo) return { testo, modello };
      ultimo = dati.candidates?.[0]?.finishReason === "SAFETY" ? "Il modello ha rifiutato di rispondere a questa domanda." : "Risposta vuota dal modello.";
    } catch (err) {
      if (err instanceof ErroreAI) throw err;
      if (opz.segnale?.aborted) throw new ErroreAI("Interrotto.");
      ultimo = ctrl.signal.aborted ? `Il modello ${modello} non ha risposto in tempo.` : "Connessione a Google non riuscita. Controlla la rete.";
    } finally {
      clearTimeout(timer);
      opz.segnale?.removeEventListener("abort", stop);
    }
  }
  throw new ErroreAI(ultimo);
}

/** Verifica la chiave con una richiesta minima, senza inviare dati personali. */
export async function verificaChiave(chiave: string): Promise<string> {
  const { modello } = await genera(chiave, {
    sistema: "Rispondi con una sola parola.",
    messaggi: [{ ruolo: "user", testo: "Scrivi OK" }],
    maxToken: 5,
  });
  return modello;
}

export const REGOLE_BASE = [
  "Rispondi sempre in italiano, in modo chiaro e concreto. Usa euro e date GG/MM/AAAA.",
  "Basati SOLO sui dati forniti: se un dato non c'è, dillo e non inventare numeri.",
  "Non dare consulenze legali, fiscali o mediche definitive: suggerisci di rivolgersi a un professionista quando serve.",
  "Non hai accesso a internet né al conto: non puoi eseguire operazioni.",
].join("\n");
