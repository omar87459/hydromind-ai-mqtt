-- HydroMind AI — Supabase schema
--
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New
-- query) after creating your project. It creates one table per JSON
-- dataset (crops, methods, knowledge_base), each storing a row's full
-- object as a single JSONB "payload" column — the exact shape already
-- used by backend/data/*.json. This means backend/app/data_store.py can
-- read Supabase rows and hand them to the rest of the app completely
-- unchanged; see that file's docstring for why.
--
-- These tables hold reference data (crop/method/knowledge-base library),
-- not farm-specific or user data, so a public-read policy is appropriate
-- — there's nothing here that needs to be private.

create table if not exists crops (
    id text primary key,
    payload jsonb not null
);

create table if not exists methods (
    id text primary key,
    payload jsonb not null
);

create table if not exists knowledge_base (
    id text primary key,
    payload jsonb not null
);

alter table crops enable row level security;
alter table methods enable row level security;
alter table knowledge_base enable row level security;

create policy "Public read access" on crops
    for select using (true);

create policy "Public read access" on methods
    for select using (true);

create policy "Public read access" on knowledge_base
    for select using (true);

-- Writes (seeding/updating the reference data) go through backend/supabase_setup/seed.py
-- using the service role key, which bypasses RLS — no public write policy is defined.
