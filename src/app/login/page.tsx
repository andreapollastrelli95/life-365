"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/Logo";
import { getBrowserClient } from "@/lib/supabase/client";
import { CLOUD_ENABLED } from "@/lib/supabase/config";

type Modo = "accedi" | "registrati" | "recupera";

const AVVISI: Record<string, { ok: boolean; text: string }> = {
  confermato: { ok: true, text: "Indirizzo e-mail confermato. Ora accedi con la tua password." },
  "link-scaduto": { ok: false, text: "Il link è scaduto o è già stato usato. Accedi, oppure chiedi un nuovo link." },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const avviso = useSearchParams().get("avviso");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState<Modo>("accedi");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(avviso ? AVVISI[avviso] ?? null : null);

  if (!CLOUD_ENABLED) {
    return (
      <main className="grid min-h-dvh place-items-center bg-night-900 p-6">
        <div className="card w-full max-w-sm space-y-3 p-6 text-sm">
          <Logo />
          <p>L&apos;accesso con account non è attivo: questa installazione lavora in <strong>modalità locale</strong>, con i dati sul PC.</p>
          <Link href="/" className="btn btn-primary w-full">Entra</Link>
        </div>
      </main>
    );
  }

  // Dopo l'accesso la sessione è nei cookie: si ricarica la radice, che passa dal proxy.
  const entra = () => { router.replace("/"); router.refresh(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = getBrowserClient();
    try {
      if (modo === "registrati") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` } });
        if (error) throw error;
        if (!data.session) setMsg({ ok: true, text: "Account creato. Apri l'e-mail di conferma che ti abbiamo inviato, poi accedi qui." });
        else entra();
      } else if (modo === "recupera") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/impostazioni%23password` });
        if (error) throw error;
        setMsg({ ok: true, text: "Se l'indirizzo è registrato riceverai un'e-mail: apri il link da questo dispositivo e scegli la nuova password in Impostazioni." });
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        entra();
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setMsg({
        ok: false,
        text: /invalid login/i.test(m) ? "E-mail o password non corrette."
          : /not confirmed/i.test(m) ? "Prima conferma l'indirizzo dal link nell'e-mail che hai ricevuto."
          : /rate limit/i.test(m) ? "Troppe richieste in poco tempo. Riprova tra qualche minuto."
          : /already registered/i.test(m) ? "Esiste già un account con questa e-mail: accedi."
          : "Operazione non riuscita. Riprova.",
      });
    } finally {
      setBusy(false);
    }
  };

  const cambia = (m: Modo) => { setModo(m); setMsg(null); };

  return (
    <main className="grid min-h-dvh place-items-center bg-night-900 p-4">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div>
          <Logo />
          <p className="mt-1 text-sm text-muted">Finanze, documenti, casa, salute e scadenze: la tua vita in ordine, tutto l&apos;anno.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {modo !== "recupera" && (
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" required minLength={8}
                autoComplete={modo === "registrati" ? "new-password" : "current-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              {modo === "registrati" && <p className="mt-1 text-xs text-muted">Almeno 8 caratteri.</p>}
            </div>
          )}
          {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-good-bg text-good" : "bg-bad-bg text-bad"}`}>{msg.text}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Attendi…" : modo === "registrati" ? "Crea account" : modo === "recupera" ? "Invia il link" : "Accedi"}
          </button>
        </form>

        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button type="button" className="text-accent underline" onClick={() => cambia(modo === "registrati" ? "accedi" : "registrati")}>
            {modo === "registrati" ? "Ho già un account" : "Crea un account gratuito"}
          </button>
          {modo === "accedi" && <button type="button" className="text-muted underline" onClick={() => cambia("recupera")}>Password dimenticata?</button>}
          {modo === "recupera" && <button type="button" className="text-muted underline" onClick={() => cambia("accedi")}>Torna all&apos;accesso</button>}
        </div>

        <p className="border-t border-line pt-4 text-center text-xs text-muted">
          Un solo account per tutti i tuoi dispositivi: i dati si sincronizzano su telefono, tablet e computer.
        </p>
      </div>
    </main>
  );
}
