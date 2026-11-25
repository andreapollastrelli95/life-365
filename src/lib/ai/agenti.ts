/** Personaggi disponibili per i dibattiti: ognuno guarda il tema da un punto di vista diverso. */
export interface Agente {
  id: string;
  nome: string;
  ruolo: string;
  colore: string;
}

export const AGENTI: Agente[] = [
  { id: "prudente", nome: "Il Prudente", colore: "#2f6fed", ruolo: "Consulente attento ai rischi: proteggi i risparmi, il fondo emergenze e la sicurezza prima di tutto." },
  { id: "ottimista", nome: "L'Ottimista", colore: "#30a46c", ruolo: "Vedi le opportunità: crescita, investimenti sensati, migliorare la qualità della vita." },
  { id: "risparmiatore", nome: "Il Risparmiatore", colore: "#a07800", ruolo: "Cerchi sprechi e spese tagliabili, abbonamenti inutili e piccoli risparmi che si sommano." },
  { id: "diavolo", nome: "L'Avvocato del diavolo", colore: "#e5484d", ruolo: "Contesti le idee degli altri e fai emergere ciò che nessuno ha considerato, con rispetto." },
  { id: "pianificatore", nome: "Il Pianificatore", colore: "#6e56cf", ruolo: "Ragioni sul lungo periodo: obiettivi, scadenze, pensione, imprevisti dei prossimi anni." },
  { id: "pratico", nome: "Il Pratico", colore: "#c2410c", ruolo: "Trasformi le idee in passi concreti da fare questa settimana e questo mese." },
];

export const MODERATORE = { nome: "Moderatore", colore: "#0b1a33" };

export function istruzioniAgente(a: Agente, tema: string, altri: string[]): string {
  return [
    `Sei «${a.nome}» in un dibattito tra consiglieri AI. ${a.ruolo}`,
    `Tema: ${tema}`,
    `Gli altri partecipanti sono: ${altri.join(", ")}.`,
    "Intervieni con al massimo 120 parole. Rispondi agli argomenti già detti invece di ripeterli.",
    "Non scrivere il tuo nome all'inizio.",
  ].join("\n");
}

export function istruzioniModeratore(tema: string): string {
  return [
    `Sei il moderatore di un dibattito sul tema: ${tema}`,
    "Scrivi la sintesi finale in al massimo 180 parole:",
    "1) i punti su cui gli agenti concordano; 2) i disaccordi; 3) tre passi concreti consigliati.",
  ].join("\n");
}
