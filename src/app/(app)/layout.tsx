import { connection } from "next/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { DataProvider } from "@/components/DataProvider";
import { ToastProvider } from "@/components/Toast";
import { getSnapshot } from "@/lib/data";
import { getSessione, infoSessione } from "@/lib/data/sessione";
import { todayISO } from "@/lib/domain/dates";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await connection(); // i dati si leggono a ogni richiesta, mai in fase di build
  const [db, sessione] = await Promise.all([getSnapshot(), getSessione()]);

  return (
    <DataProvider db={db} today={todayISO()} sessione={infoSessione(sessione)}>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </DataProvider>
  );
}
