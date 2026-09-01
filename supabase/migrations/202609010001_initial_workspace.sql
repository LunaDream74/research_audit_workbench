create extension if not exists pgcrypto;

create type public.import_status as enum ('previewed', 'confirmed', 'failed', 'partial');
create type public.investigation_status as enum ('unresolved', 'interrupted', 'stale', 'proposal_ready', 'approved', 'approved_with_limitation', 'resolved', 'archived');
create type public.analysis_status as enum ('temporary', 'completed', 'interrupted', 'stale');
create type public.plan_status as enum ('draft', 'approved', 'approved_with_limitation');
create type public.actor_type as enum ('researcher', 'agent', 'system');

create table public.import_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status public.import_status not null default 'previewed',
  source_name text not null,
  preview_digest text not null,
  file_inventory jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  preview jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  import_attempt_id uuid,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (import_attempt_id, owner_id) references public.import_attempts(id, owner_id)
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  experiment_id uuid not null,
  name text not null,
  metrics jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  readiness jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (experiment_id, owner_id) references public.experiments(id, owner_id)
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null,
  storage_path text,
  external_path text,
  sha256 text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  check (storage_path is not null or external_path is not null)
);

create table public.run_artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id uuid not null,
  artifact_id uuid not null,
  role text not null,
  source_relation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, artifact_id, role),
  foreign key (run_id, owner_id) references public.runs(id, owner_id),
  foreign key (artifact_id, owner_id) references public.artifacts(id, owner_id)
);

create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_a_id uuid not null,
  run_b_id uuid not null,
  question text not null,
  status public.investigation_status not null default 'unresolved',
  active_analysis_revision_id uuid,
  active_plan_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (run_a_id, owner_id) references public.runs(id, owner_id),
  foreign key (run_b_id, owner_id) references public.runs(id, owner_id),
  check (run_a_id <> run_b_id)
);

create table public.analysis_revisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  investigation_id uuid not null,
  revision integer not null check (revision > 0),
  selection_digest text not null,
  status public.analysis_status not null default 'completed',
  result jsonb not null default '{}'::jsonb,
  finding_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (id, owner_id),
  unique (investigation_id, revision),
  foreign key (investigation_id, owner_id) references public.investigations(id, owner_id)
);

create table public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  investigation_id uuid not null,
  version integer not null check (version > 0),
  status public.plan_status not null default 'draft',
  body jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  digest text not null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  unique (investigation_id, version),
  foreign key (investigation_id, owner_id) references public.investigations(id, owner_id),
  check (
    (status = 'draft' and approved_at is null and approved_by is null)
    or
    (status in ('approved', 'approved_with_limitation') and approved_at is not null and approved_by = owner_id)
  )
);

create table public.investigation_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  investigation_id uuid not null,
  event_type text not null,
  actor_type public.actor_type not null,
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (investigation_id, owner_id) references public.investigations(id, owner_id)
);

alter table public.investigations
  add constraint investigations_active_analysis_fk
  foreign key (active_analysis_revision_id, owner_id) references public.analysis_revisions(id, owner_id) deferrable initially deferred,
  add constraint investigations_active_plan_fk
  foreign key (active_plan_version_id, owner_id) references public.plan_versions(id, owner_id) deferrable initially deferred;

create index runs_owner_experiment_idx on public.runs(owner_id, experiment_id);
create index investigations_owner_status_updated_idx on public.investigations(owner_id, status, updated_at desc);
create index analysis_investigation_revision_idx on public.analysis_revisions(investigation_id, revision desc);
create index plans_investigation_version_idx on public.plan_versions(investigation_id, version desc);
create index events_investigation_created_idx on public.investigation_events(investigation_id, created_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_approved_plan()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('approved', 'approved_with_limitation') then
    raise exception 'approved plan versions are immutable';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['import_attempts','experiments','runs','artifacts','investigations','plan_versions']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

create trigger protect_approved_plan_update
before update or delete on public.plan_versions
for each row execute function public.protect_approved_plan();

do $$
declare table_name text;
begin
  foreach table_name in array array['import_attempts','experiments','runs','artifacts','run_artifacts','investigations','analysis_revisions','plan_versions','investigation_events']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', table_name || '_delete_own', table_name);
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'research-evidence',
  'research-evidence',
  false,
  2097152,
  array['application/json','text/plain','text/csv','image/png','image/jpeg']
) on conflict (id) do nothing;

create policy "evidence_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'research-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "evidence_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'research-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "evidence_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'research-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'research-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "evidence_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'research-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
