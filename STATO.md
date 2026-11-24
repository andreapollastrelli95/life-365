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
- **Modalità locale** (senza Supabase): 11 controlli su 11; typecheck, lint e 12 test unitari.
- **Volantino** (`stampa/volantino.pdf`): QR di fronte e retro letti, portano a https://life-365-app.vercel.app; nessuna menzione della demo.

## Non verificato

- **E-mail vere di conferma e di recupero password**: il progetto richiede la conferma dell'indirizzo; gli utenti di prova sono stati creati già confermati. Il mittente è quello predefinito di Supabase, che invia poche e-mail all'ora.
- **Link di conferma aperto su un dispositivo diverso** da quello della registrazione: l'indirizzo risulta confermato, ma poi bisogna accedere a mano.
- **iPhone reale** e installazione nella schermata Home.

## Decisioni

- **Archivio cloud:** una riga JSON per utente con numero di versione, al posto di 18 tabelle normalizzate. È lo stesso modello della versione locale, il codice resta unico e due dispositivi non si sovrascrivono a vicenda. Limite: niente interrogazioni SQL sui singoli movimenti.
- **File nel cloud:** il browser li carica direttamente su Supabase Storage, nella cartella dell'utente imposta dalla RLS, per evitare il limite di 4,5 MB delle funzioni Vercel; per aprirli si usa un link temporaneo di 60 secondi.
- **Nuovi account** partono vuoti; da Impostazioni si può svuotare l'archivio, con copia di sicurezza (ne restano le ultime 5). Nel cloud non ci sono dati di esempio.
- **Dati reali** dell'installazione sul PC (`C:\LIFE-OS`): restano lì, per scelta.
- **Indirizzo:** `life-365.vercel.app` appartiene a un altro utente, quindi il sito è `life-365-app.vercel.app`.
