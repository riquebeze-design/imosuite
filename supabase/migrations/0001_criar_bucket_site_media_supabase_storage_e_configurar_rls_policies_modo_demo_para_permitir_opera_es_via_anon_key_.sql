-- AtlasCasa (DEMO) — políticas permissivas para permitir uso com anon key

-- 1) Storage: bucket + policies
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read site-media" on storage.objects;
create policy "Public read site-media"
on storage.objects for select
to public
using (bucket_id = 'site-media');

drop policy if exists "Anon insert site-media (demo)" on storage.objects;
create policy "Anon insert site-media (demo)"
on storage.objects for insert
to public
with check (bucket_id = 'site-media');

drop policy if exists "Anon update site-media (demo)" on storage.objects;
create policy "Anon update site-media (demo)"
on storage.objects for update
to public
using (bucket_id = 'site-media')
with check (bucket_id = 'site-media');

-- 2) RLS: tabelas (demo)
alter table if exists public.properties enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.activity_logs enable row level security;
alter table if exists public.automations enable row level security;
alter table if exists public.automation_runs enable row level security;
alter table if exists public.email_campaigns enable row level security;
alter table if exists public.agents enable row level security;

DROP POLICY IF EXISTS "Public read properties" ON public.properties;
CREATE POLICY "Public read properties" ON public.properties
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anon insert properties (demo)" ON public.properties;
CREATE POLICY "Anon insert properties (demo)" ON public.properties
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update properties (demo)" ON public.properties;
CREATE POLICY "Anon update properties (demo)" ON public.properties
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read agents (demo)" ON public.agents;
CREATE POLICY "Public read agents (demo)" ON public.agents
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anon insert agents (demo)" ON public.agents;
CREATE POLICY "Anon insert agents (demo)" ON public.agents
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update agents (demo)" ON public.agents;
CREATE POLICY "Anon update agents (demo)" ON public.agents
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon insert leads (demo)" ON public.leads;
CREATE POLICY "Anon insert leads (demo)" ON public.leads
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public read leads (demo)" ON public.leads;
CREATE POLICY "Public read leads (demo)" ON public.leads
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anon update leads (demo)" ON public.leads;
CREATE POLICY "Anon update leads (demo)" ON public.leads
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon insert activity logs (demo)" ON public.activity_logs;
CREATE POLICY "Anon insert activity logs (demo)" ON public.activity_logs
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public read activity logs (demo)" ON public.activity_logs;
CREATE POLICY "Public read activity logs (demo)" ON public.activity_logs
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public read automations (demo)" ON public.automations;
CREATE POLICY "Public read automations (demo)" ON public.automations
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anon insert automations (demo)" ON public.automations;
CREATE POLICY "Anon insert automations (demo)" ON public.automations
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update automations (demo)" ON public.automations;
CREATE POLICY "Anon update automations (demo)" ON public.automations
FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read automation runs (demo)" ON public.automation_runs;
CREATE POLICY "Public read automation runs (demo)" ON public.automation_runs
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anon insert automation runs (demo)" ON public.automation_runs;
CREATE POLICY "Anon insert automation runs (demo)" ON public.automation_runs
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public read campaigns (demo)" ON public.email_campaigns;
CREATE POLICY "Public read campaigns (demo)" ON public.email_campaigns
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anon insert campaigns (demo)" ON public.email_campaigns;
CREATE POLICY "Anon insert campaigns (demo)" ON public.email_campaigns
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update campaigns (demo)" ON public.email_campaigns;
CREATE POLICY "Anon update campaigns (demo)" ON public.email_campaigns
FOR UPDATE TO public USING (true) WITH CHECK (true);
