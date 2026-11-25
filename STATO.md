# Stato di LIFE 365

Aggiornato al 25/11/2026.

Sito: https://life-365-app.vercel.app. Si entra solo con un account (niente demo). Lo stesso account funziona su ogni dispositivo e i dati restano sincronizzati.

## Verificato

- **Supabase** (progetto condiviso, oggetti `life365_*`): schema applicato con 2 tabelle con RLS, 6 policy e bucket `life365-allegati` privato; il ruolo anonimo non ha accesso. `https://life-365-app.vercel.app/**` è aggiunto ai Redirect URLs, quelli delle altre app sono rimasti intatti.
- **Sito online**, con due account di prova poi cancellati: 12 controlli su 12 (`tests/e2e/prova.mjs`).
  - Senza accesso si va al login; l'esportazione è protetta; la pagina di accesso non ha la demo.
  - Salvataggio nel cloud, caricamento e apertura di un file.
  - Dati ritrovati da un secondo dispositivo a 390 px, senza scorrimento orizzontale.
  - L'utente B non vede documenti, file né esportazione dell'utente A.
- **Attacchi diretti alle API di Supabase**, senza passare dall'app: 9 su 9 respinti. B non legge, modifica né crea righe di A; senza accesso non si legge nulla; B non scarica né firma i file di A, non scrive nella sua cartella; il bucket non è pubblico.
- **Modalità locale** (senza Supabase): 12 controlli su 12, compresa l'importazione di un archivio; typecheck, lint e 16 test unitari, di cui 4 sull'importazione.
- **Ritorno dai link delle e-mail** (`/auth/callback`): senza codice o con un codice falso si torna al login con l'avviso; un rimando verso un altro sito viene ignorato.
- **Assistente AI con chiave Gemini dell'utente** (`tests/e2e/ai.mjs`, chiave reale e dati demo): 12 controlli su 12. Chiave sbagliata rifiutata con un messaggio chiaro; anteprima dei dati inviati, salute esclusa per impostazione; la cifra data dall'AI coincide con il saldo calcolato; dibattito tra due agenti più sintesi in 7 secondi; la chiave non arriva mai al server di LIFE 365. Il riepilogo inviato non contiene mai profilo, numeri dei documenti, targhe, recapiti né note (4 test unitari).
- **Foglio di istruzioni** (`stampa/istruzioni.pdf`): QR letto.
- **Volantino** (`stampa/volantino.pdf`): QR di fronte e retro letti, portano a https://life-365-app.vercel.app; nessuna menzione della demo.

## Non verificato

- **Importazione nel cloud con i file** (Impostazioni › Importa archivio): la parte sui dati è coperta da test, il trasferimento dei file usa lo stesso canale già collaudato per i caricamenti, ma il percorso completo su un account reale non è ancora stato eseguito.
- **Cambia password** e **Password dimenticata** con un'e-mail vera.

- **E-mail vere di conferma e di recupero password**: il progetto richiede la conferma dell'indirizzo; gli utenti di prova sono stati creati già confermati. Il mittente è quello predefinito di Supabase, che invia poche e-mail all'ora.
- **Link di conferma aperto su un dispositivo diverso** da quello della registrazione: l'indirizzo risulta confermato, ma poi bisogna accedere a mano.
- **Assistente AI** con i dati reali di un account cloud: stesso codice della prova locale; le chiamate partono dal browser.
- **iPhone reale** e installazione nella schermata Home.

## Decisioni

- **Assistente AI:** la chiave Gemini dell'utente resta nel browser di ogni dispositivo (localStorage) e le chiamate vanno direttamente a Google, quindi la chiave non passa dal server e non entra nel database. Va inserita su ogni dispositivo. Modelli di riserva: 3.5-flash-lite, flash-lite-latest, 3.1-flash-lite, 3.5-flash. Con le chiavi gratuite Google può usare i contenuti: l'interfaccia lo dice.

- **Archivio cloud:** una riga JSON per utente con numero di versione, al posto di 18 tabelle normalizzate. È lo stesso modello della versione locale, il codice resta unico e due dispositivi non si sovrascrivono a vicenda. Limite: niente interrogazioni SQL sui singoli movimenti.
- **File nel cloud:** il browser li carica direttamente su Supabase Storage, nella cartella dell'utente imposta dalla RLS, per evitare il limite di 4,5 MB delle funzioni Vercel; per aprirli si usa un link temporaneo di 60 secondi.
- **Nuovi account** partono vuoti; da Impostazioni si può svuotare l'archivio, con copia di sicurezza (ne restano le ultime 5). Nel cloud non ci sono dati di esempio.
- **Dati reali** dell'installazione sul PC (`C:\LIFE-OS`): restano lì, per scelta.
- **Indirizzo:** `life-365.vercel.app` appartiene a un altro utente, quindi il sito è `life-365-app.vercel.app`.
