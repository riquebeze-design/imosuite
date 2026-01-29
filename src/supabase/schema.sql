-- AtlasCasa (demo) — esquema sugerido para Supabase/PostgreSQL
-- NOTA: este ficheiro é um guia. Execute no SQL Editor do Supabase.

-- EXTENSÕES
create extension if not exists pgcrypto;

-- USERS / AGENTS
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('admin','gestor','consultor')),
  email text not null unique,
  whatsapp_phone text not null,
  municipalities text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- PROPERTIES
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  kind text not null,
  purpose text not null,
  typology text not null,
  price_eur integer not null,
  district text not null,
  municipality text not null,
  parish text not null,
  area_m2 integer not null,
  bedrooms integer not null,
  bathrooms integer not null,
  parking integer not null,
  energy_rating text not null,
  description text not null,
  highlights text[] not null default '{}',
  images text[] not null default '{}',
  lat double precision not null,
  lng double precision not null,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- LEADS
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null,
  message text,

  property_id uuid references properties(id) on delete set null,
  preferred_district text,
  preferred_municipality text,
  preferred_typology text,
  max_budget_eur integer,

  stage text not null,
  temperature text not null,
  assigned_agent_id uuid references agents(id) on delete set null
);

-- ACTIVITY LOGS (por lead)
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null,
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- AUTOMATIONS
create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default true,
  trigger text not null,
  actions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references automations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);

-- EMAIL CAMPAIGNS
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  from_name text not null,
  from_email text not null,
  html text not null,
  segment jsonb not null,
  sent integer not null default 0,
  opens integer not null default 0,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

-- AI CONVERSATIONS
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  channel text not null,
  messages jsonb not null,
  created_at timestamptz not null default now()
);

-- NOTA SOBRE RLS/POLICIES:
-- Por omissão, o Supabase pode bloquear operações via anon key se activar RLS.
-- Para DEMO rápida, use também: src/supabase/policies_demo.sql