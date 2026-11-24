import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { CLOUD_ENABLED } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Chi sta usando l'app in questa richiesta.
 * - locale: nessun Supabase configurato, archivio su file (installazione sul PC);
 * - cloud: utente autenticato, archivio e file nel suo spazio Supabase (RLS);
 * - anonimo: cloud senza accesso (il proxy lo manda a /login).
 */
export type Sessione =
  | { modo: "locale" }
  | { modo: "cloud"; supabase: SupabaseClient; userId: string; email: string }
  | { modo: "anonimo" };

export const getSessione = cache(async (): Promise<Sessione> => {
  if (!CLOUD_ENABLED) return { modo: "locale" };
  const supabase = (await getServerClient()) as unknown as SupabaseClient;
  const { data } = await supabase.auth.getUser();
  if (data.user) return { modo: "cloud", supabase, userId: data.user.id, email: data.user.email ?? "" };
  return { modo: "anonimo" };
});

export class AccessoRichiestoError extends Error {
  constructor() {
    super("Accesso richiesto.");
  }
}

/** Dati della sessione utili al browser (niente client né token). */
export interface InfoSessione {
  modo: Sessione["modo"];
  email?: string;
}

export const infoSessione = (s: Sessione): InfoSessione =>
  s.modo === "cloud" ? { modo: s.modo, email: s.email } : { modo: s.modo };
