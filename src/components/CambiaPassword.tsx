"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { useToast } from "./Toast";

/** Cambio password dell'account (anche dopo il link «Password dimenticata?»). */
export function CambiaPassword() {
  const notify = useToast();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);
    if (pwd.length < 8) return setErrore("La password deve avere almeno 8 caratteri.");
    if (pwd !== pwd2) return setErrore("Le due password non coincidono.");
    setBusy(true);
    try {
      const { error } = await getBrowserClient().auth.updateUser({ password: pwd });
      if (error) {
        setErrore(/same|different/i.test(error.message) ? "La nuova password deve essere diversa da quella attuale." : "Cambio non riuscito. Riprova.");
        return;
      }
      notify("success", "Password cambiata");
      setPwd("");
      setPwd2("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={salva} className="space-y-3 text-sm" noValidate>
      <div>
        <label className="label" htmlFor="pwd-nuova">Nuova password</label>
        <input id="pwd-nuova" type="password" className="input" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pwd-ripeti">Ripeti la nuova password</label>
        <input id="pwd-ripeti" type="password" className="input" autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
      </div>
      {errore && <p role="alert" className="rounded-lg bg-bad-bg px-3 py-2 text-bad">{errore}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Salvataggio…" : "Cambia password"}</button>
    </form>
  );
}
