# PROGETTO: LIFE OS

Sistema gestionale completo della vita privata di un cittadino.

Agisci come un team composto da Software Architect, Full-Stack Developer, UI/UX Designer, Database Engineer, Security Engineer e QA Engineer.

Sviluppa un'applicazione web professionale chiamata **LIFE OS**: un vero gestionale personale da usare ogni giorno, non una demo grafica. L'obiettivo finale è realizzare tutti i moduli descritti qui, integrati in un'unica applicazione.

Lavora direttamente sui file. Non fermarti a un piano o a una struttura di cartelle e non chiedermi conferma a ogni passaggio: prendi decisioni tecniche ragionevoli e registrale in `PROGRESS.md`. Fermati e chiedi solo nei casi indicati nella sezione 3.

---

## 1. Regole di priorità

Queste regole prevalgono su ogni altra indicazione in caso di conflitto.

1. **Prima di tutto:** se esiste `PROGRESS.md`, leggilo e riprendi dal prossimo passo indicato. Non rifare il lavoro già completato.
2. **File di avanzamento:** mantieni `PROGRESS.md` con moduli completati, moduli da fare, decisioni tecniche, problemi aperti e prossimo passo. Aggiornalo e crea un commit al termine di ogni modulo.
3. **Ordine di sviluppo:**
   1. Base del progetto, layout, autenticazione e schema dati comune
   2. Finanze
   3. Documenti e allegati
   4. Agenda e scadenziario centralizzato
   5. Dashboard
   6. Abbonamenti e contratti
   7. Casa e immobili
   8. Automobile e mobilità
   9. Beni personali
   10. Rubrica
   11. Salute
   12. Viaggi
   13. Patrimonio e futuro
   14. Il mio anno
   15. Assistente AI
   16. Rifiniture trasversali, verifica di sicurezza e documentazione finale
4. **Definizione di modulo completato:** un modulo è completato solo se funziona con dati persistenti, rispetta i requisiti della sezione 8, ha i test previsti, compila e supera i controlli. Non iniziare il modulo successivo prima di questo punto.
5. **Limiti di tempo o di utilizzo:** preferisci meno moduli completi a molti moduli parziali. Nascondi dalla navigazione i moduli non ancora realizzati e indicali in `PROGRESS.md`.
6. **Onestà:** non dichiarare completato o sicuro nulla che non sia stato verificato. Una funzione simulata deve essere indicata come tale nell'interfaccia e nel report finale.

---

## 2. Cartella di lavoro e Git

- Lavora esclusivamente in `C:\LIFE-OS`. Se non esiste, creala; se esiste, analizzane il contenuto prima di modificarlo.
- Non modificare file personali o progetti esterni e non cancellare arbitrariamente file o configurazioni.
- Prima di un'operazione potenzialmente distruttiva, crea una copia di sicurezza.
- Usa un repository Git locale: se esiste già, controllane lo stato e non riscrivere la cronologia; se non esiste, inizializzalo.
- Prevedi un `.gitignore` corretto, un commit iniziale e commit descrittivi dopo ogni modifica importante.
- Non includere nei commit file `.env`, segreti, allegati o dati personali reali.
- Non eseguire push verso repository remoti senza la mia autorizzazione.

---

## 3. Stack e dati

- Next.js con App Router, React e TypeScript
- Tailwind CSS e Lucide React
- PostgreSQL tramite Supabase, con Supabase Auth e Supabase Storage
- Recharts
- React Hook Form e Zod
- Ambiente di sviluppo: Windows

**Ambiente dati:** verifica che Node.js, Git e Docker siano disponibili. Se Docker è disponibile, usa Supabase in locale anche per la modalità demo, così autenticazione, RLS e storage vengono provati davvero. **Se Docker non è disponibile o Supabase locale non si avvia, fermati e chiedimi come procedere** prima di creare un sistema dati alternativo.

**Fermati e chiedimi conferma anche prima di:** pubblicare online, eseguire un push remoto, usare dati reali, inviare dati a servizi esterni o compiere operazioni distruttive fuori dal progetto.

Predisponi `.env.example`, README completo, script di installazione e avvio per Windows, migrazioni SQL documentate, seed demo, gestione degli errori e una struttura modulare. Non inserire credenziali reali nel codice.

---

## 4. Design

Interfaccia premium in stile SaaS: elegante, minimalista, ordinata e ricca di informazioni senza essere caotica.

- **Palette:** blu notte, bianco, grigio chiarissimo, antracite; verde per valori positivi, rosso per situazioni critiche, arancione per avvisi.
- **Layout:** sidebar sinistra comprimibile e organizzata per aree, header con ricerca globale, centro notifiche, profilo utente, card statistiche, tabelle professionali, grafici interattivi, modali, menu contestuali e filtri avanzati.
- **Responsive:** curato per desktop Windows e smartphone.
- **Localizzazione:** interfaccia in italiano, formato numerico italiano, EUR, date GG/MM/AAAA.

---

## 5. Moduli

### 5.1 Dashboard
- **Dati:** patrimonio netto, liquidità, entrate e uscite dell'anno, risparmio annuale, spese del mese, prossime scadenze, appuntamenti imminenti, attività da completare, documenti in scadenza, abbonamenti attivi, ultime operazioni.
- **Grafici:** entrate e uscite mensili, andamento del patrimonio, spese per categoria, evoluzione del risparmio, spese ricorrenti, confronto tra anni.
- Tutti i valori derivano dai dati registrati nei moduli. Prevedi la personalizzazione dei widget.
- I moduli non ancora realizzati non mostrano widget finti.

### 5.2 Finanze personali
- **Strumenti:** conti correnti, conti deposito, carte di credito, carte prepagate, contanti, portafogli, altri strumenti.
- **Campi del conto:** nome, istituto, tipologia, saldo iniziale, saldo attuale calcolato, data di apertura, note.
- **Movimenti:** entrate, uscite, trasferimenti tra conti, rimborsi, storni, movimenti ricorrenti.
- **Campi del movimento:** importo, data, descrizione, categoria, sottocategoria, conto, metodo di pagamento, note, documento allegato.
- **Budget:** mensili, annuali, limiti per categoria, spesa effettiva, differenza, avvisi di superamento.
- **Altro:** prestiti, rate, debiti e crediti personali, scadenze finanziarie, investimenti registrati manualmente, patrimonio finanziario, analisi delle spese, esportazione CSV.
- I trasferimenti tra conti non vanno mai conteggiati come entrate, uscite o risparmio.

### 5.3 Documenti e burocrazia
- **Categorie:** carta d'identità, passaporto, patente, tessera sanitaria, documenti fiscali, CU, dichiarazioni dei redditi, F24, contratti, certificazioni, documenti bancari, immobiliari, assicurativi, altri.
- **Campi:** titolo, categoria, numero identificativo facoltativo, data emissione, data scadenza, ente emittente, note, allegato PDF o immagine, tag.
- **Funzioni:** caricamento, download, anteprima, modifica, eliminazione, ricerca, filtri, collegamento con altri moduli, avvisi di scadenza.

### 5.4 Casa e immobili
- Gestione di più immobili.
- **Campi:** nome, indirizzo, tipologia, proprietà o locazione, percentuale di proprietà, valore stimato, data e prezzo di acquisto, mutuo associato, note, documenti.
- **Gestione:** mutui, rate, tassi, scadenze, utenze (luce, gas, acqua, internet), TARI, IMU, spese condominiali, manutenzioni, lavori, preventivi, fornitori, garanzie, elettrodomestici.
- Ogni spesa può collegarsi alle finanze. Ogni immobile ha il proprio storico spese.

### 5.5 Automobile e mobilità
- Automobili, motocicli e altri veicoli.
- **Campi del veicolo:** marca, modello, targa, alimentazione, data immatricolazione, chilometraggio, valore stimato, proprietà, note.
- **Gestione:** assicurazione, bollo, revisione, tagliandi, manutenzione, cambio gomme, carburante, ricariche elettriche, multe, pedaggi, parcheggi, finanziamenti, documenti.
- **Campi dell'intervento:** data, chilometraggio, descrizione, costo, officina, documento allegato.
- **Funzioni:** scadenze automatiche, storico manutenzioni, costo annuale, costo medio per chilometro quando i dati lo consentono, collegamento con le finanze.

### 5.6 Salute e benessere
- **Gestione:** medici, specialisti, strutture sanitarie, visite, appuntamenti, esami, referti, prescrizioni, farmaci, vaccinazioni, spese sanitarie, assicurazioni sanitarie.
- Allegati e note su ogni elemento, con storico cronologico.
- Dati altamente sensibili: accesso protetto, nessuna esposizione pubblica, permessi rigorosi, nessuna diagnosi automatica e nessuna raccomandazione clinica.

### 5.7 Abbonamenti e contratti
- **Esempi:** streaming, musica, telefonia, internet, palestra, software, assicurazioni, servizi cloud.
- **Campi:** nome, fornitore, categoria, costo, frequenza di pagamento, data inizio, rinnovo e scadenza, metodo di pagamento, stato, note, documento allegato.
- **Funzioni:** costo mensile equivalente, costo annuale complessivo, prossimi rinnovi, contratti attivi e disdetti, avvisi di rinnovo, collegamento con i movimenti.

### 5.8 Acquisti e beni personali
- **Categorie:** elettronica, informatica, arredamento, abbigliamento, orologi, gioielli, elettrodomestici, attrezzature, altri beni.
- **Campi:** nome, categoria, marca, modello, data acquisto, prezzo, valore attuale stimato, garanzia, numero seriale, negozio, fattura, foto, note.
- **Funzioni:** scadenza garanzie, storico acquisti, valore dell'inventario, collegamento con le spese, ricerca e filtri.

### 5.9 Agenda e attività
- **Elementi:** appuntamenti, commissioni, attività, promemoria, ricorrenze, obiettivi, progetti, scadenze.
- **Viste:** giornaliera, settimanale, mensile, elenco.
- **Campi:** titolo, descrizione, data, ora, priorità, categoria, stato, ricorrenza, note.
- Le attività si possono completare, modificare e riprogrammare.

### 5.10 Viaggi e tempo libero
- **Campi:** destinazione, date, partecipanti, budget, trasporti, voli, treni, hotel, prenotazioni, ristoranti, attività, itinerario, documenti, note.
- **Funzioni:** budget previsto, spese effettive, confronto budget/consuntivo, archivio viaggi passati, collegamento con le finanze.

### 5.11 Rubrica e relazioni
- **Categorie:** familiari, amici, professionisti, commercialista, avvocato, medico, artigiani, fornitori, altri.
- **Campi:** nome, cognome, telefono, email, indirizzo, categoria, azienda, note, compleanno.
- Ogni contatto può collegarsi a immobili, documenti, contratti, interventi e appuntamenti.

### 5.12 Patrimonio e futuro
- **Calcoli:** patrimonio immobiliare e finanziario, investimenti, liquidità, debiti, mutui e prestiti residui, patrimonio netto, senza duplicazioni.
- **Funzioni:** evoluzione storica, obiettivi di risparmio e patrimoniali, proiezioni configurabili, previdenza personale, contributi pensionistici registrati manualmente, storico lavorativo, periodi contributivi, simulazioni indicative.
- Le simulazioni devono mostrare le ipotesi usate e non presentarsi come previsioni ufficiali.

### 5.13 Il mio anno
Report annuale curato, con selezione dell'anno.
- **Contenuti:** entrate, uscite, risparmio e risparmio percentuale; spese per categoria, immobile e veicolo; spese sanitarie, abbonamenti, acquisti importanti, investimenti; evoluzione del patrimonio; obiettivi raggiunti e mancati; confronto con l'anno precedente.
- Grafici e statistiche, con esportazione PDF e CSV.

### 5.14 Assistente AI
Risponde a domande sui dati dell'utente, ad esempio: quanto ho speso questo mese, quanto costa l'auto ogni anno, quali abbonamenti sono attivi, quali documenti scadono entro 60 giorni, quanto ho risparmiato, quanto vale il patrimonio, quali sono state le spese più importanti, come sono cambiate le finanze rispetto all'anno scorso.

Requisiti:
- Risponde solo in base ai dati disponibili, dichiara quando mancano informazioni e non inventa numeri.
- Non modifica dati senza conferma e non esegue operazioni finanziarie.
- Rispetta i permessi e non espone dati di altri utenti.
- Non accede ai dati sanitari, salvo una mia attivazione esplicita nelle impostazioni.
- Il provider si configura tramite API. Non inviare dati reali a servizi esterni senza la mia autorizzazione.
- Senza chiave API funziona in modalità demo, chiaramente indicata nell'interfaccia.

---

## 6. Funzioni trasversali

I moduli devono essere collegati tra loro, senza logiche duplicate.

- **Esempio polizza auto:** collegata a veicolo, contratto, movimento finanziario, documento, scadenza e fornitore.
- **Esempio acquisto computer:** collegato a bene personale, movimento finanziario, fattura, garanzia e fornitore.

Implementa:
- Ricerca globale in tutti i moduli
- Centro notifiche configurabile per scadenze, rinnovi, pagamenti, appuntamenti, garanzie e attività
- Scadenziario centralizzato
- Allegati collegabili alle varie entità
- Tag e filtri
- Esportazione CSV e report PDF
- Registro delle modifiche importanti
- Impostazioni: profilo, preferenze, valuta, notifiche, categorie, backup ed esportazione dati

---

## 7. Database e sicurezza

**Database**
- Schema PostgreSQL normalizzato, con chiavi primarie ed esterne, indici, vincoli, timestamp e `user_id` su ogni entità personale.
- Importi con precisione decimale, mai in virgola mobile. Gestione coerente di date e fusi orari.
- Gestione coerente di movimenti ricorrenti, collegamenti tra record, archiviazione ed eliminazione, storico delle modifiche.
- Migrazioni SQL complete e documentate.
- Row Level Security su tutte le tabelle accessibili dall'utente e sugli allegati. La protezione non deve dipendere dall'interfaccia.

**Sicurezza**
- Autenticazione, protezione delle route, autorizzazione e validazione lato server, sessioni sicure.
- Controllo di tipo e dimensione degli allegati, nessun segreto nel frontend, errori che non espongono informazioni riservate.
- Non memorizzare password bancarie, credenziali SPID o CIE, né codici di accesso.
- Non integrare accessi bancari automatici.

**Dati demo**
- All'inizio usa solo dati fittizi e realistici, per tutti i moduli, in un ambiente chiaramente identificabile.
- Prevedi eliminazione e rigenerazione dei dati demo, tenendoli separati dai dati reali.

**Prima di usare dati reali** verifica concretamente e documenta in `SECURITY-CHECK.md`: autenticazione, autorizzazioni, RLS su tutte le tabelle con prova tra due utenti, protezione degli allegati, sessioni, esposizione delle API, variabili d'ambiente, backup e ripristino.

Non pubblicare l'applicazione senza una mia autorizzazione esplicita.

---

## 8. Qualità

Sono vietati: pulsanti decorativi, dati fissi spacciati per reali, grafici scollegati dai dati, pagine vuote, link non funzionanti, form senza validazione e funzioni simulate non dichiarate.

Ogni modulo deve prevedere: visualizzazione, inserimento, modifica, eliminazione o archiviazione, ricerca, filtri, ordinamento, validazione, stati vuoti, gestione degli errori e feedback delle operazioni.

Scrivi test almeno per: saldi, trasferimenti tra conti, entrate e uscite, budget, patrimonio netto, scadenze, report annuali e permessi tra utenti.

Al termine di ogni modulo esegui typecheck, lint, test e build, e correggi gli errori prima di proseguire. Verifica anche che l'applicazione si avvii.

---

## 9. Report finale

Al termine di ogni sessione aggiorna `PROGRESS.md` e indicami in sintesi cosa è stato completato e cosa resta da fare.

Quando l'intero progetto è finito, indicami:
- La struttura del progetto
- Come avviarlo su Windows e come accedervi dal browser
- Le variabili da configurare e le integrazioni esterne ancora da collegare
- Le funzionalità operative e quelle eventualmente simulate
- I test eseguiti e i problemi residui
- Lo stato del repository Git e i commit creati
- La conferma che il progetto è rimasto in `C:\LIFE-OS`
- Come effettuare backup e ripristino
