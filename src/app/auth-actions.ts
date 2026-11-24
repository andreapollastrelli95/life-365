"use server";

import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";

/** Chiude la sessione e torna alla pagina di accesso. */
export async function esciAction(): Promise<void> {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
