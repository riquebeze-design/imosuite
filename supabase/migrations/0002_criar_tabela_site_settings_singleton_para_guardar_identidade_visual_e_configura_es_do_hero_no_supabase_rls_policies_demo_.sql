-- Site settings (single-tenant) — guarda identidade visual e hero no DB
create table if not exists public.site_settings (
  id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, settings)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- DEMO policies (anon key). Em produção, restringir por auth/role.
drop policy if exists "Public read site settings (demo)" on public.site_settings;
create policy "Public read site settings (demo)"
on public.site_settings for select
to public
using (true);

drop policy if exists "Anon update site settings (demo)" on public.site_settings;
create policy "Anon update site settings (demo)"
on public.site_settings for update
to public
using (true)
with check (true);

drop policy if exists "Anon insert site settings (demo)" on public.site_settings;
create policy "Anon insert site settings (demo)"
on public.site_settings for insert
to public
with check (true);
