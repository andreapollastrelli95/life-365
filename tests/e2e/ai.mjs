// Prova dell'assistente AI con una chiave Gemini reale (solo con dati demo, in modalità locale).
//   GEMINI_API_KEY=... BASE=http://127.0.0.1:3310 node tests/e2e/ai.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://127.0.0.1:3310";
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error("Serve GEMINI_API_KEY");
let ok = 0, ko = 0;
const check = (n, c, x = "") => { if (c) ok++; else ko++; console.log(c ? "OK  " : "FAIL", n, x); };

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await (await browser.newContext({ viewport: { width: 390, height: 850 }, locale: "it-IT" })).newPage();
const versoIlServer = [];
page.on("request", (r) => {
  if (r.url().startsWith(BASE) && (r.url().includes(KEY) || (r.postData() ?? "").includes(KEY))) versoIlServer.push(r.url());
});
const errori = [];
page.on("pageerror", (e) => errori.push(e.message));

await page.goto(BASE + "/assistente", { waitUntil: "networkidle" });
check("senza chiave si apre «Chiave e privacy»", await page.getByLabel("Chiave API Gemini").isVisible());
await page.getByLabel("Chiave API Gemini").fill("chiave-sbagliata-1234567890abcdef");
await page.getByRole("button", { name: "Verifica e salva" }).click();
await page.getByRole("status").filter({ hasText: /non è valida|non ha accesso/ }).first().waitFor({ timeout: 60000 });
check("chiave sbagliata rifiutata con un messaggio chiaro", true);

await page.getByLabel("Chiave API Gemini").fill(KEY);
await page.getByRole("button", { name: "Verifica e salva" }).click();
await page.getByText("Gemini collegato").waitFor({ timeout: 90000 });
check("dopo la verifica si apre «Domande libere»", await page.getByRole("tab", { name: "Domande libere" }).getAttribute("aria-selected") === "true");
await page.getByRole("tab", { name: "Chiave e privacy" }).click();
await page.getByText("Chiave attiva su questo dispositivo").waitFor();
check("chiave vera verificata e salvata", true);

await page.getByRole("button", { name: "Vedi cosa viene inviato" }).click();
const inviato = await page.locator("dialog[open] pre").innerText();
check("anteprima: contiene i dati utili", inviato.includes("Patrimonio netto") && inviato.includes("Conto principale"));
check("anteprima: salute esclusa per impostazione", !inviato.includes("Visita oculistica"));
await page.locator("dialog[open]").getByRole("button", { name: "Chiudi" }).click();

await page.getByRole("tab", { name: "Domande libere" }).click();
const t0 = Date.now();
await page.getByLabel("Domanda").fill("Qual è il saldo del Conto principale? Rispondi con la cifra.");
await page.getByRole("button", { name: "Invia" }).click();
const risposta = page.locator("article").filter({ hasText: "Risposta di" }).first();
await risposta.waitFor({ timeout: 120000 });
const testo = await risposta.innerText();
check("domanda libera: risposta con una cifra in euro", /\d[\d.]*,\d{2}/.test(testo), `${Math.round((Date.now() - t0) / 1000)} s · ${testo.replace(/\s+/g, " ").slice(0, 140)}`);

// La cifra dell'AI deve coincidere con il saldo calcolato dall'app.
const ctx2 = await browser.newContext({ viewport: { width: 1360, height: 850 } });
const p2 = await ctx2.newPage();
await p2.goto(BASE + "/finanze?tab=conti", { waitUntil: "networkidle" });
const saldoApp = await p2.locator("tr", { hasText: "Conto principale" }).locator("td").nth(4).innerText();
await ctx2.close();
check("domanda libera: la cifra coincide con il saldo dell'app", testo.includes(saldoApp.replace(/s/g, " ").replace(" €", "").trim()), `app ${saldoApp}`);

await page.getByRole("tab", { name: "Dibattito tra agenti" }).click();
await page.getByLabel("Tema del dibattito").fill("Conviene estinguere prima il finanziamento dell'auto o tenere la liquidità?");
for (const nome of ["L'Ottimista", "L'Avvocato del diavolo"]) await page.getByRole("checkbox", { name: new RegExp(nome) }).uncheck();
await page.getByRole("checkbox", { name: /Il Risparmiatore/ }).check();
await page.getByLabel("Giri").selectOption("1");
const t1 = Date.now();
await page.getByRole("button", { name: "Avvia il dibattito" }).click();
await page.getByText("Moderatore · sintesi").waitFor({ timeout: 240000 });
const interventi = await page.locator("article").count();
check("dibattito: 1 intervento per agente + sintesi", interventi === 3, `${interventi} riquadri in ${Math.round((Date.now() - t1) / 1000)} s`);
await page.screenshot({ path: "stampa/assistente-dibattito.png", fullPage: true });

const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
check("390 px senza scorrimento orizzontale", over <= 0, String(over));
check("la chiave non arriva mai al server di LIFE 365", versoIlServer.length === 0, versoIlServer.join(" "));
check("nessun errore nella pagina", errori.length === 0, errori.join(" | "));
console.log(`\n${ok} OK, ${ko} FAIL`);
await browser.close();
process.exit(ko ? 1 : 0);
