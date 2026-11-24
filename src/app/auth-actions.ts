"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

/** Apre la demo senza account: dati finti, nessun salvataggio. */
export async function entraDemoAction(): Promise<void> {
  const store = await cookies();
  store.set(DEMO_COOKIE, "1", { path: "/", httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 });
  redirect("/");
}

/** Chiude la demo o la sessione e torna alla pagina di accesso. */
export async function esciAction(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
