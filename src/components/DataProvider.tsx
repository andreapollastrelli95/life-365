"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { InfoSessione } from "@/lib/data/sessione";
import type { Db } from "@/lib/types";

interface DataContextValue {
  db: Db;
  today: string;
  sessione: InfoSessione;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Istantanea dei dati letta sul server. Dopo ogni modifica il layout la rigenera. */
export function DataProvider({ db, today, sessione, children }: DataContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ db, today, sessione }), [db, today, sessione]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve stare dentro DataProvider");
  return ctx;
}
