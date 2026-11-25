# LIFE 365

Gestionale personale in italiano per tenere in ordine, tutto l'anno, finanze, documenti, casa, auto, salute, abbonamenti, agenda e scadenze.

**Sito:** https://life-365-app.vercel.app · si entra solo con un account (e-mail e password). Lo stesso account funziona su qualsiasi dispositivo e i dati restano sincronizzati.

## Cosa fa

- **Dashboard:** patrimonio netto, liquidità, entrate, uscite e risparmio dell'anno, grafici mensili e per categoria.
- **Finanze:** conti, movimenti con saldi calcolati, budget per categoria, prestiti e mutui. I giroconti non falsano entrate e uscite.
- **Scadenziario e notifiche:** tutte le scadenze in un'unica lista (documenti, bollette, bollo, revisione, rinnovi, garanzie, compleanni).
- **Documenti e file:** schede con scadenza; carica PDF e foto e collegali alla sezione giusta.
- **Casa, auto, salute, abbonamenti, beni, agenda, viaggi, rubrica:** ogni sezione con tabella, ricerca, filtri, ordinamento e modulo di inserimento validato.
- **Patrimonio e futuro:** attività meno passività senza doppi conteggi, investimenti, obiettivi.
- **Il mio anno:** riepilogo annuale con confronto sull'anno precedente.
- **Assistente AI:** domande libere e dibattiti tra agenti AI sui propri dati, con la propria chiave Gemini (anche gratuita), più domande pronte calcolate senza AI.
- Ricerca globale, esportazione dei dati in JSON, vista ottimizzata per telefono e installabile nella schermata Home.

## Come funziona

Next.js 16 (App Router), TypeScript, Tailwind, Recharts, React Hook Form e Zod. Lo stesso codice gira in due modalità:

| | Modalità cloud | Modalità locale |
|---|---|---|
| Quando | `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` impostate | variabili assenti |
| Accesso | login obbligatorio con account Supabase (e-mail e password) | nessun login, solo sul PC |
| Archivio | tabella `life365_archivio`, una riga per utente, protetta da RLS | file `data/lifeos.json` |
| File | bucket privato `life365-allegati`, cartella per utente | cartella `data/allegati` |

Le pagine usano solo il livello dati in `src/lib/data`; la logica di calcolo (saldi, patrimonio, scadenze, report) è in `src/lib/domain` ed è coperta da test.

## Installazione

```
npm install
npm run dev          # http://localhost:3000, modalità locale
npm run typecheck
npm run lint
npm test
```

Per la modalità cloud: eseguire `supabase/life365_progetto_condiviso.sql` nel SQL Editor del progetto Supabase (crea solo oggetti con prefisso `life365_`, quindi il progetto può essere condiviso con altre app), aggiungere l'indirizzo del sito in *Authentication › URL Configuration*, poi impostare le due variabili `NEXT_PUBLIC_SUPABASE_*` in `.env.local` o su Vercel. Mai usare la chiave `service_role` nell'app.

Prova nel browser (Edge): `BASE=http://127.0.0.1:3310 node tests/e2e/prova.mjs` in locale; per il cloud anche `UTENTE_A=email:password UTENTE_B=email:password`.

## Volantino

`py -3 tools/genera_volantino.py --url https://life-365-app.vercel.app --out stampa/volantino.pdf` genera il volantino A4 fronte/retro con il QR del sito (richiede `qrcode` e `reportlab`).
