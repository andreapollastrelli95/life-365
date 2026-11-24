-- LIFE 365 — schema per un progetto Supabase CONDIVISO con altre app.
-- Crea solo oggetti con prefisso life365_: non tocca profili, funzioni o trigger delle altre app.
-- Si può rieseguire: ogni istruzione è idempotente.
--
-- Modello: una riga per utente con tutto l'archivio in JSON (`dati`), più le copie di sicurezza.
-- Il numero di `versione` impedisce che due dispositivi si sovrascrivano a vicenda.
-- I file caricati stanno nel bucket privato life365-allegati, nella cartella <user_id>/.

create table if not exists public.life365_archivio (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dati jsonb not null,
  versione integer not null default 1 check (versione > 0),
  aggiornato timestamptz not null default now(),
  constraint life365_archivio_dimensione check (pg_column_size(dati) <= 20 * 1024 * 1024)
);

create table if not exists public.life365_backup (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dati jsonb not null,
  creato timestamptz not null default now()
);
create index if not exists life365_backup_user_idx on public.life365_backup (user_id, creato desc);

-- Solo gli utenti autenticati, e ognuno solo sulle proprie righe.
revoke all on public.life365_archivio, public.life365_backup from anon;
grant select, insert, update, delete on public.life365_archivio, public.life365_backup to authenticated;

alter table public.life365_archivio enable row level security;
alter table public.life365_archivio force row level security;
alter table public.life365_backup enable row level security;
alter table public.life365_backup force row level security;

drop policy if exists life365_archivio_proprietario on public.life365_archivio;
create policy life365_archivio_proprietario on public.life365_archivio
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists life365_backup_proprietario on public.life365_backup;
create policy life365_backup_proprietario on public.life365_backup
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Bucket privato per i file (25 MB per file).
insert into storage.buckets (id, name, public, file_size_limit)
values ('life365-allegati', 'life365-allegati', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists life365_file_lettura on storage.objects;
create policy life365_file_lettura on storage.objects for select to authenticated
  using (bucket_id = 'life365-allegati' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists life365_file_inserimento on storage.objects;
create policy life365_file_inserimento on storage.objects for insert to authenticated
  with check (bucket_id = 'life365-allegati' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists life365_file_modifica on storage.objects;
create policy life365_file_modifica on storage.objects for update to authenticated
  using (bucket_id = 'life365-allegati' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'life365-allegati' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists life365_file_eliminazione on storage.objects;
create policy life365_file_eliminazione on storage.objects for delete to authenticated
  using (bucket_id = 'life365-allegati' and (storage.foldername(name))[1] = (select auth.uid())::text);
