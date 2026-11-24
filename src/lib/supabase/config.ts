/** Valori pubblici: la chiave anon/publishable è pensata per il browser, la sicurezza la garantisce la RLS. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** Con Supabase configurato l'app è in modalità cloud (account e dati online); altrimenti locale. */
export const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Bucket privato dei file caricati: ogni utente ha la sua cartella `<user_id>/`. */
export const BUCKET_ALLEGATI = "life365-allegati";

/** Cookie che apre la demo senza account (dati finti, nessun salvataggio). */
export const DEMO_COOKIE = "life365-demo";
