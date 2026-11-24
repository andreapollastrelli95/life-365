# Stato di LIFE 365

Aggiornato al 25/11/2026.

## Verificato

- **Modalità locale** (senza Supabase): build, typecheck, lint, 12 test unitari; nel browser 11 controlli su 11 (pagine, salvataggio ed eliminazione, caricamento file).
- **Online su Vercel** (https://life-365-app.vercel.app): senza accesso si arriva al login; `/api/export` è protetto. La **demo** funziona a 390 px senza scorrimento orizzontale; il salvataggio viene rifiutato con un messaggio chiaro; l'uscita riporta al login.
- **Volantino** (`stampa/volantino.pdf`): QR di fronte e retro letti con un decodificatore, portano a https://life-365-app.vercel.app.

## Non ancora verificato

- **Account e dati nel cloud:** lo schema `supabase/life365_progetto_condiviso.sql` non è ancora applicato al progetto Supabase. Fino ad allora registrazione e accesso arrivano a una pagina d'errore.
- **Separazione tra utenti (RLS)** su tabelle e file: va provata con due account (`tests/e2e/prova.mjs` con `UTENTE_A` e `UTENTE_B`).
- **E-mail di conferma e recupero password:** l'indirizzo del sito va aggiunto in Supabase › Authentication › URL Configuration › Redirect URLs, altrimenti i link portano al sito predefinito del progetto condiviso.

## Prossimo passo

1. Applicare lo schema SQL e aggiungere `https://life-365-app.vercel.app/**` ai Redirect URLs.
2. Eseguire la prova cloud con due account di prova, poi cancellarli.

## Decisioni

- **Archivio cloud:** una riga JSON per utente con numero di versione, al posto di 18 tabelle normalizzate. È lo stesso modello dati della versione locale, il codice resta unico e due salvataggi contemporanei non si sovrascrivono. Limite: niente interrogazioni SQL sui singoli movimenti.
- **File nel cloud:** il browser li carica direttamente su Supabase Storage (cartella dell'utente, imposta dalla RLS), per evitare il limite di 4,5 MB delle funzioni Vercel; per aprirli si usa un link temporaneo di 60 secondi.
- **Nuovo account:** parte vuoto. Da Impostazioni può caricare i dati di esempio o svuotare l'archivio; prima di ogni sostituzione viene salvata una copia di sicurezza, e se ne tengono 5.
- **Dati reali** dell'installazione sul PC (`C:\LIFE-OS`): restano solo sul PC, per scelta.
- **Indirizzo:** `life-365.vercel.app` è già di un altro utente, quindi il sito è `life-365-app.vercel.app`.
