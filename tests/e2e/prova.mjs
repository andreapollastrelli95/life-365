// Prova nel browser (Edge) di LIFE 365.
//   Locale: BASE=http://127.0.0.1:3310 node tests/e2e/prova.mjs
//   Cloud:  BASE=https://... UTENTE_A=email:password UTENTE_B=email:password node tests/e2e/prova.mjs
// Nel cloud verifica accesso obbligatorio, salvataggio, file, sincronizzazione e SEPARAZIONE tra due utenti.
import { chromium } from "playwright-core";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://127.0.0.1:3310";
const CLOUD = Boolean(process.env.UTENTE_A);
const [A, B] = [process.env.UTENTE_A, process.env.UTENTE_B].map((u) => u && { email: u.split(":")[0], pwd: u.split(":").slice(1).join(":") });
let ok = 0, ko = 0;
const check = (name, cond, extra = "") => { if (cond) ok++; else ko++; console.log(cond ? "OK  " : "FAIL", name, extra); };

const browser = await chromium.launch({ channel: "msedge", headless: true });
const problemi = [];

async function nuovaPagina(width = 1360) {
  const ctx = await browser.newContext({ viewport: { width, height: 850 }, locale: "it-IT", acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problemi.push(`[pageerror] ${page.url()} ${e.message.slice(0, 200)}`));
  page.on("console", (m) => { if (m.type() === "error" && !/404|401|400/.test(m.text())) problemi.push(`[console] ${page.url()} ${m.text().slice(0, 200)}`); });
  return { ctx, page };
}
const go = (page, p) => page.goto(BASE + p, { waitUntil: "networkidle" });
const toast = (page, t) => page.getByRole("status").filter({ hasText: t }).first().waitFor({ timeout: 15000 });
const modal = (page) => page.locator("dialog[open]");

async function accedi(page, u) {
  await go(page, "/login");
  await page.getByLabel("E-mail").fill(u.email);
  await page.getByLabel("Password").fill(u.pwd);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 });
  await page.locator("h1").first().waitFor();
}

async function creaDocumento(page, titolo) {
  await go(page, "/documenti");
  await page.getByRole("button", { name: "Aggiungi" }).first().click();
  await modal(page).getByLabel("Titolo").fill(titolo);
  await modal(page).getByLabel("Categoria").selectOption("Altri");
  await modal(page).getByLabel("Data di scadenza").fill("15/12/2026");
  await modal(page).getByRole("button", { name: "Salva" }).click();
  await toast(page, "Aggiunto");
}

async function caricaFile(page, nome) {
  const dir = mkdtempSync(join(tmpdir(), "l365-"));
  const file = join(dir, nome);
  writeFileSync(file, `%PDF-1.4\n% prova ${nome}\n`);
  await go(page, "/archivio");
  await page.locator('input[type="file"]').first().setInputFiles(file);
  const dest = page.getByLabel("Dove deve andare");
  if (await dest.count()) await dest.selectOption("finanze");
  await page.getByRole("button", { name: /^Carica$/ }).click();
  await toast(page, "salvat");
}

// ------------------------------------------------------------ locale
if (!CLOUD) {
  const { page } = await nuovaPagina();
  for (const r of ["/", "/finanze", "/documenti", "/scadenziario", "/il-mio-anno", "/assistente", "/impostazioni", "/archivio"]) {
    const res = await page.goto(BASE + r, { waitUntil: "networkidle" });
    check(`pagina ${r}`, res.status() === 200 && (await page.getByText("LIFE").first().isVisible()));
  }
  await go(page, "/login");
  check("login in modalità locale spiega che non serve", await page.getByText("modalità locale").isVisible());
  await creaDocumento(page, "Prova locale");
  check("documento salvato in locale", await page.locator("tr", { hasText: "Prova locale" }).isVisible());
  await page.getByRole("button", { name: "Elimina Prova locale" }).click();
  await modal(page).getByRole("button", { name: "Elimina" }).click();
  await toast(page, "eliminato");
  await caricaFile(page, "estratto-prova.pdf");
  await go(page, "/archivio");
  check("file caricato in locale", await page.getByText("estratto prova").first().isVisible());
}

// ------------------------------------------------------------ cloud
if (CLOUD) {
  const anon = await nuovaPagina();
  await anon.page.goto(BASE + "/", { waitUntil: "networkidle" });
  check("senza accesso si va al login", anon.page.url().includes("/login"));
  const r = await anon.page.request.get(BASE + "/api/export", { maxRedirects: 0 });
  check("export protetto senza accesso", r.status() === 307 || r.status() === 302, String(r.status()));
  check("nessuna demo nella pagina di accesso", (await anon.page.getByText(/demo/i).count()) === 0);
  await anon.ctx.close();

  // Utente A: archivio vuoto, salva, carica un file
  const a = await nuovaPagina();
  await accedi(a.page, A);
  check("A: accesso e dashboard", await a.page.getByText(A.email).first().isVisible());
  const segreto = `Segreto di A ${Date.now()}`;
  await creaDocumento(a.page, segreto);
  await go(a.page, "/documenti");
  check("A: documento salvato nel cloud", await a.page.locator("tr", { hasText: segreto }).isVisible());
  await caricaFile(a.page, "ricevuta-a.pdf");
  await go(a.page, "/archivio");
  const link = a.page.getByRole("link", { name: /ricevuta a/i }).first();
  const href = await link.getAttribute("href");
  check("A: file caricato nello Storage", Boolean(href), href ?? "");
  const aperto = await a.page.request.get(BASE + href);
  check("A: il file si apre", aperto.status() === 200 && (await aperto.text()).includes("ricevuta-a.pdf"), String(aperto.status()));

  // Utente B: non vede nulla di A, nemmeno conoscendo l'indirizzo del file
  const b = await nuovaPagina();
  await accedi(b.page, B);
  await go(b.page, "/documenti");
  check("B: non vede il documento di A", (await b.page.getByText(segreto).count()) === 0);
  const rubato = await b.page.request.get(BASE + href, { maxRedirects: 0 });
  check("B: non può aprire il file di A", rubato.status() === 404, String(rubato.status()));
  const exp = await b.page.request.get(BASE + "/api/export");
  check("B: l'export non contiene dati di A", !(await exp.text()).includes(segreto));

  // A ritrova i dati dopo un nuovo accesso (persistenza) ed esce
  const a2 = await nuovaPagina(390);
  await accedi(a2.page, A);
  await go(a2.page, "/documenti");
  check("A: dati ritrovati da un altro dispositivo (390 px)", await a2.page.getByText(segreto).first().isVisible());
  const over = await a2.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check("390 px senza scorrimento orizzontale", over <= 0, String(over));
  await a2.page.getByRole("button", { name: "Apri menu" }).waitFor();
}

console.log(`\n${ok} OK, ${ko} FAIL`);
for (const p of [...new Set(problemi)].slice(0, 10)) console.log(p);
await browser.close();
process.exit(ko ? 1 : 0);
