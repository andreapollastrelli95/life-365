import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { CLOUD_ENABLED, DEMO_COOKIE } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Chi sta usando l'app in questa richiesta.
 * - locale: nessun Supabase configurato, archivio su file (installazione sul PC);
 * - cloud: utente autenticato, archivio e file nel suo spazio Supabase (RLS);
 * - demo: nessun account, dati finti generati al volo, nessun salvataggio;
 * - anonimo: cloud senza accesso né demo (il proxy lo manda a /login).
 */
export type Sessione =
  | { modo: "locale" }
  | { modo: "cloud"; supabase: SupabaseClient; userId: string; email: string }
  | { modo: "demo" }
  | { modo: "anonimo" };

export const getSessione = cache(async (): Promise<Sessione> => {
  if (!CLOUD_ENABLED) return { modo: "locale" };
  const supabase = (await getServerClient()) as unknown as SupabaseClient;
  const { data } = await supabase.auth.getUser();
  if (data.user) return { modo: "cloud", supabase, userId: data.user.id, email: data.user.email ?? "" };
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value === "1" ? { modo: "demo" } : { modo: "anonimo" };
});

export class DemoError extends Error {
  constructor() {
    super("Nella demo le modifiche non vengono salvate. Crea un account gratuito per usare LIFE 365 con i tuoi dati.");
  }
}

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
