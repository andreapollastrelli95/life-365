import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Ritorno dai link delle e-mail di Supabase (conferma dell'indirizzo, password dimenticata).
 * Il codice si scambia con una sessione solo nello stesso browser in cui è partita la richiesta;
 * altrove l'indirizzo risulta comunque confermato e si chiede di accedere.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  // Solo percorsi interni: niente redirect verso altri siti.
  const destinazione = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destinazione, url.origin));
  }
  const login = new URL("/login", url.origin);
  login.searchParams.set("avviso", url.searchParams.get("error_description") ? "link-scaduto" : "confermato");
  return NextResponse.redirect(login);
}
