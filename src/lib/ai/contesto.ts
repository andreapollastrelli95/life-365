import { formatDate } from "@/lib/domain/dates";
import { collectDeadlines } from "@/lib/domain/deadlines";
import { accountBalance, computeTotals, expensesByCategory, movementsInMonth, movementsInYear } from "@/lib/domain/finance";
import { formatEUR } from "@/lib/domain/money";
import { computeNetWorth } from "@/lib/domain/networth";
import { monthlyCost, subscriptionsTotals } from "@/lib/domain/subscriptions";
import type { Db } from "@/lib/types";

export interface OpzioniContesto {
  /** Elenco dei movimenti (anno in corso e precedente). */
  movimenti: boolean;
  /** Visite, esami e farmaci: esclusi se non attivati esplicitamente. */
  salute: boolean;
}

export const OPZIONI_PREDEFINITE: OpzioniContesto = { movimenti: true, salute: false };
const MAX_MOVIMENTI = 1500;

/**
 * Riepilogo dei dati dell'utente da inviare al modello AI scelto con la propria chiave.
 * Non contiene MAI: profilo (codice fiscale, nascita, residenza, recapiti), numeri dei documenti,
 * targhe, numeri di serie, recapiti dei contatti e note libere. La salute solo se attivata.
 */
export function costruisciContesto(db: Db, today: string, opz: OpzioniContesto = OPZIONI_PREDEFINITE): string {
  const anno = Number(today.slice(0, 4));
  const righe: string[] = [];
  const sez = (titolo: string) => righe.push("", `## ${titolo}`);
  const e = formatEUR;

  righe.push(`Dati personali dell'utente in LIFE 365. Oggi è il ${formatDate(today)}. Importi in euro.`);

  const n = computeNetWorth(db, today);
  sez("Patrimonio");
  righe.push(`Patrimonio netto ${e(n.netto)} (attività ${e(n.attivita)}, passività ${e(n.passivita)}).`,
    `Liquidità ${e(n.liquidita)}; investimenti ${e(n.investimenti)}; immobili (quota) ${e(n.immobili)}; veicoli ${e(n.veicoli)}; beni ${e(n.beni)}.`,
    `Mutui ${e(n.mutui)}; altri debiti ${e(n.altriDebiti)}; saldi negativi dei conti ${e(n.debitiConti)}.`);

  if (db.conti.length) {
    sez("Conti (saldo calcolato a oggi)");
    for (const c of db.conti) righe.push(`- ${c.nome}${c.istituto ? ` (${c.istituto})` : ""}, ${c.tipologia}: ${e(accountBalance(c, db.movimenti, today))}`);
  }

  for (const a of [anno, anno - 1]) {
    const movs = movementsInYear(db.movimenti, a, today);
    if (!movs.length) continue;
    const t = computeTotals(movs);
    sez(`Anno ${a}${a === anno ? " (fino a oggi)" : ""}`);
    righe.push(`Entrate ${e(t.entrate)}; uscite ${e(t.uscite)} (al netto dei rimborsi); risparmio ${e(t.risparmio)}; versati in investimenti ${e(t.investimenti)}. I giroconti non sono contati.`);
    righe.push("Spese per categoria: " + expensesByCategory(movs).map((c) => `${c.categoria} ${e(c.totale)}`).join("; "));
  }
  const mese = computeTotals(movementsInMonth(db.movimenti, today.slice(0, 7)).filter((m) => m.data <= today));
  righe.push(`Mese in corso: entrate ${e(mese.entrate)}, uscite ${e(mese.uscite)}.`);

  if (db.budget.length) {
    sez("Budget mensili");
    for (const b of db.budget) righe.push(`- ${b.categoria}: limite ${e(b.limiteMensile)}`);
  }

  const abb = db.abbonamenti.filter((a) => a.stato === "Attivo");
  if (abb.length) {
    const t = subscriptionsTotals(db.abbonamenti);
    sez(`Abbonamenti e contratti attivi (${e(t.mensile)} al mese, ${e(t.annuale)} all'anno)`);
    for (const a of abb) righe.push(`- ${a.nome} (${a.categoria}): ${e(a.costo)} ${a.frequenza.toLowerCase()} = ${e(monthlyCost(a))}/mese${a.dataRinnovo ? `, rinnovo ${formatDate(a.dataRinnovo)}` : ""}`);
  }

  if (db.passivita.length) {
    sez("Prestiti e mutui");
    for (const p of db.passivita) righe.push(`- ${p.nome} (${p.tipo}): residuo ${e(p.residuo)}${p.rata ? `, rata ${e(p.rata)}` : ""}${p.tasso !== undefined ? `, tasso ${p.tasso}%` : ""}${p.dataFine ? `, fine ${formatDate(p.dataFine)}` : ""}`);
  }
  if (db.investimenti.length) {
    sez("Investimenti");
    for (const i of db.investimenti) righe.push(`- ${i.nome} (${i.tipo}): investiti ${e(i.capitaleInvestito)}, valore ${e(i.valoreAttuale)} al ${formatDate(i.dataValutazione)}`);
  }
  if (db.obiettivi.length) {
    sez("Obiettivi di risparmio");
    for (const o of db.obiettivi) righe.push(`- ${o.nome}: ${e(o.importoAttuale)} su ${e(o.importoTarget)}${o.dataTarget ? ` entro ${formatDate(o.dataTarget)}` : ""}`);
  }
  if (db.immobili.length) {
    sez("Immobili");
    for (const i of db.immobili) righe.push(`- ${i.nome}: ${i.tipologia}, ${i.titolo}, quota ${i.percentuale}%, valore ${e(i.valoreStimato)}`);
  }
  const speseDaPagare = db.speseCasa.filter((s) => s.stato === "Da pagare");
  if (speseDaPagare.length) {
    sez("Spese della casa da pagare");
    for (const s of speseDaPagare) righe.push(`- ${s.descrizione} (${s.tipo}): ${e(s.importo)}${s.scadenza ? `, scade ${formatDate(s.scadenza)}` : ""}`);
  }
  if (db.veicoli.length) {
    sez("Veicoli");
    for (const v of db.veicoli) {
      const costo = db.interventi.filter((x) => x.veicoloId === v.id && x.data.startsWith(`${anno}-`)).reduce((s, x) => s + x.costo, 0);
      righe.push(`- ${v.marca} ${v.modello} (${v.alimentazione}, ${v.proprieta}): valore ${e(v.valoreStimato)}, costi ${anno} ${e(costo)}`);
    }
  }
  if (db.documenti.length) {
    sez("Documenti");
    for (const d of db.documenti) righe.push(`- ${d.titolo} (${d.categoria})${d.dataScadenza ? `, scade ${formatDate(d.dataScadenza)}` : ""}`);
  }
  if (db.beni.length) {
    sez("Beni personali");
    for (const b of db.beni) righe.push(`- ${b.nome} (${b.categoria})${b.valoreAttuale !== undefined ? `, valore ${e(b.valoreAttuale)}` : ""}${b.scadenzaGaranzia ? `, garanzia fino al ${formatDate(b.scadenzaGaranzia)}` : ""}`);
  }
  const agenda = db.agenda.filter((a) => a.stato === "Da fare");
  if (agenda.length) {
    sez("Agenda: cose da fare");
    for (const a of agenda) righe.push(`- ${formatDate(a.data)}${a.ora ? ` ${a.ora}` : ""}: ${a.titolo} (${a.tipo}, priorità ${a.priorita})`);
  }
  if (db.viaggi.length) {
    sez("Viaggi");
    for (const v of db.viaggi) righe.push(`- ${v.destinazione}: ${formatDate(v.dataPartenza)}–${formatDate(v.dataRitorno)}, budget ${e(v.budget)}, ${v.stato}`);
  }

  const scadenze = collectDeadlines(db, today)
    .filter((d) => opz.salute || d.modulo !== "Salute")
    .filter((d) => d.giorni >= -30 && d.giorni <= 90);
  if (scadenze.length) {
    sez("Scadenze (ultimi 30 e prossimi 90 giorni)");
    for (const d of scadenze) righe.push(`- ${formatDate(d.data)}: ${d.titolo} — ${d.tipo} (${d.modulo})`);
  }

  if (opz.salute && (db.eventiSalute.length || db.farmaci.length)) {
    sez("Salute");
    for (const s of db.eventiSalute) righe.push(`- ${formatDate(s.data)}: ${s.tipo} «${s.titolo}»${s.costo ? `, costo ${e(s.costo)}` : ""}${s.prossimoControllo ? `, prossimo controllo ${formatDate(s.prossimoControllo)}` : ""}`);
    for (const f of db.farmaci) righe.push(`- Farmaco ${f.nome}${f.dataFine ? ` fino al ${formatDate(f.dataFine)}` : ""}`);
  }

  if (opz.movimenti) {
    const conti = new Map(db.conti.map((c) => [c.id, c.nome]));
    const movs = db.movimenti
      .filter((m) => m.data <= today && Number(m.data.slice(0, 4)) >= anno - 1)
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, MAX_MOVIMENTI);
    if (movs.length) {
      sez(`Movimenti (${movs.length}, dal più recente): data | tipo | importo | categoria | descrizione | conto`);
      for (const m of movs) righe.push(`${m.data} | ${m.tipo} | ${e(m.importo)} | ${m.categoria ?? "-"} | ${m.descrizione} | ${conti.get(m.contoId) ?? "-"}`);
    }
  }
  return righe.join("\n");
}
