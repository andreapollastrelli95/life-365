import { describe, expect, it } from "vitest";
import { createSeed } from "./seed";
import { preparaImport } from "./importa";

const UID = "11111111-2222-3333-4444-555555555555";
const F1 = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-bolletta.pdf";
const F2 = "ffffffff-bbbb-cccc-dddd-eeeeeeeeeeee-ricevuta.jpg";

function archivio() {
  const db = createSeed("2026-11-25");
  const stamp = { createdAt: "x", updatedAt: "x", mime: "application/pdf", dimensione: 10, destinazione: "casa", titolo: "t" };
  db.allegati = [
    { id: "a1", nome: "bolletta.pdf", file: F1, ...stamp },
    { id: "a2", nome: "ricevuta.jpg", file: F2, ...stamp },
  ];
  return JSON.parse(JSON.stringify(db));
}

describe("importazione di un archivio", () => {
  it("accetta un archivio completo e lo segna come dati reali", () => {
    const r = preparaImport(archivio());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.db.meta.demo).toBe(false);
    expect(r.record).toBeGreaterThan(50);
  });

  it("nel cloud ricollega i file trasferiti e conta quelli mancanti", () => {
    const r = preparaImport(archivio(), { userId: UID, fileNelCloud: new Set([F1]) });
    expect(r.ok && [r.fileCollegati, r.fileMancanti]).toEqual([1, 1]);
    if (!r.ok) return;
    expect(r.db.allegati[0].file).toBe(`${UID}/${F1}`);
    expect(r.db.allegati[1].file).toBe(F2);
  });

  it("riconosce i file anche se l'archivio viene da un altro account", () => {
    const raw = archivio();
    raw.allegati[0].file = `99999999-0000-0000-0000-000000000000/${F1}`;
    const r = preparaImport(raw, { userId: UID, fileNelCloud: new Set([F1]) });
    expect(r.ok && r.db.allegati[0].file).toBe(`${UID}/${F1}`);
  });

  it("rifiuta archivi incompleti o danneggiati", () => {
    expect(preparaImport("testo").ok).toBe(false);
    const senzaConti = archivio();
    delete senzaConti.conti;
    expect(preparaImport(senzaConti)).toMatchObject({ ok: false, error: expect.stringContaining("conti") });
    const senzaId = archivio();
    senzaId.movimenti[0].id = "";
    expect(preparaImport(senzaId).ok).toBe(false);
  });
});
