import { describe, expect, it } from "vitest";
import { createSeed } from "@/lib/data/seed";
import { costruisciContesto } from "./contesto";

const TODAY = "2026-11-25";

function dbConDatiSensibili() {
  const db = createSeed(TODAY);
  db.meta.profilo = { nome: "Mario Prova", codiceFiscale: "PRVMRA80A01H501Z", residenza: "Via Segreta 1", telefono: "3330000000" };
  db.documenti[0].numero = "CA99999ZZ";
  db.veicoli[0].targa = "ZZ999ZZ";
  db.contatti[0].telefono = "3471234567";
  db.movimenti[0].note = "nota privatissima";
  return db;
}

describe("contesto inviato all'assistente AI", () => {
  it("contiene i dati utili: patrimonio, conti, abbonamenti, movimenti", () => {
    const t = costruisciContesto(createSeed(TODAY), TODAY);
    expect(t).toContain("Patrimonio netto");
    expect(t).toContain("Conto principale");
    expect(t).toContain("StreamBox Premium");
    expect(t).toContain("Spesa alimentare del mese");
  });

  it("non contiene mai profilo, numeri di documenti, targhe, recapiti e note", () => {
    const t = costruisciContesto(dbConDatiSensibili(), TODAY, { movimenti: true, salute: true });
    for (const segreto of ["PRVMRA80A01H501Z", "Via Segreta", "3330000000", "CA99999ZZ", "ZZ999ZZ", "3471234567", "nota privatissima", "Mario Prova"]) {
      expect(t).not.toContain(segreto);
    }
  });

  it("esclude la salute finché non viene attivata", () => {
    const db = createSeed(TODAY);
    const senza = costruisciContesto(db, TODAY);
    expect(senza).not.toContain("Visita oculistica");
    expect(senza).not.toContain("## Salute");
    expect(costruisciContesto(db, TODAY, { movimenti: false, salute: true })).toContain("Visita oculistica");
  });

  it("può escludere l'elenco dei movimenti", () => {
    expect(costruisciContesto(createSeed(TODAY), TODAY, { movimenti: false, salute: false })).not.toContain("Spesa alimentare del mese");
  });
});
