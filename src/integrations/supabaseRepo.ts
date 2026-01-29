import type {
  Agent,
  AutomationRule,
  EmailCampaign,
  Lead,
  LeadStage,
  Property,
} from "@/types/realestate";
import { supabase } from "@/integrations/supabaseClient";
import { MOCK_AGENTS } from "@/data/mockAgents";
import { MOCK_PROPERTIES } from "@/data/mockProperties";

function assertSupabase() {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

function mapAgentFromRow(r: any): Agent {
  return {
    id: String(r.id),
    name: r.name,
    role: r.role,
    municipalities: Array.isArray(r.municipalities) ? r.municipalities : [],
    whatsappPhone: r.whatsapp_phone,
    email: r.email,
  };
}

function mapPropertyFromRow(r: any): Property {
  return {
    id: String(r.id),
    title: r.title,
    slug: r.slug,
    kind: r.kind,
    purpose: r.purpose,
    typology: r.typology,
    priceEur: Number(r.price_eur),
    district: r.district,
    municipality: r.municipality,
    parish: r.parish,
    areaM2: Number(r.area_m2),
    bedrooms: Number(r.bedrooms),
    bathrooms: Number(r.bathrooms),
    parking: Number(r.parking),
    energyRating: r.energy_rating,
    description: r.description,
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
    images: Array.isArray(r.images) ? r.images : [],
    location: { lat: Number(r.lat), lng: Number(r.lng) },
    createdAt: r.created_at ?? new Date().toISOString(),
    featured: Boolean(r.featured),
  };
}

export async function loadAgentsFromSupabase(): Promise<Agent[] | null> {
  const sb = assertSupabase();
  const { data, error } = await sb
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return null;
  if (!data?.length) return [];
  return data.map(mapAgentFromRow);
}

export async function loadPropertiesFromSupabase(): Promise<Property[] | null> {
  const sb = assertSupabase();
  const { data, error } = await sb
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return null;
  if (!data?.length) return [];
  return data.map(mapPropertyFromRow);
}

export async function loadLeadsFromSupabase(): Promise<Lead[] | null> {
  const sb = assertSupabase();

  const { data: leads, error: leadsErr } = await sb
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);
  if (leadsErr) return null;
  if (!leads?.length) return [];

  const leadIds = leads.map((l: any) => l.id);
  const { data: acts, error: actErr } = await sb
    .from("activity_logs")
    .select("*")
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false });

  // Se falhar, devolvemos leads sem histórico.
  const activitiesByLead = new Map<string, any[]>();
  if (!actErr && acts?.length) {
    for (const a of acts) {
      const id = String((a as any).lead_id);
      const arr = activitiesByLead.get(id) ?? [];
      arr.push(a as any);
      activitiesByLead.set(id, arr);
    }
  }

  return leads.map((l: any) => {
    const a = activitiesByLead.get(String(l.id)) ?? [];
    return {
      id: String(l.id),
      createdAt: l.created_at ?? new Date().toISOString(),
      name: l.name,
      email: l.email,
      phone: l.phone,
      message: l.message ?? undefined,
      propertyId: l.property_id ? String(l.property_id) : undefined,
      preferredDistrict: l.preferred_district ?? undefined,
      preferredMunicipality: l.preferred_municipality ?? undefined,
      preferredTypology: l.preferred_typology ?? undefined,
      maxBudgetEur:
        typeof l.max_budget_eur === "number" ? l.max_budget_eur : undefined,
      stage: l.stage,
      temperature: l.temperature,
      assignedAgentId: l.assigned_agent_id ? String(l.assigned_agent_id) : undefined,
      activities: a.map((x: any) => ({
        id: String(x.id),
        type: x.type,
        at: x.created_at ?? new Date().toISOString(),
        title: x.title,
        detail: x.detail ?? undefined,
      })),
    } as Lead;
  });
}

export async function loadAutomationsFromSupabase(): Promise<AutomationRule[] | null> {
  const sb = assertSupabase();
  const { data, error } = await sb
    .from("automations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return null;
  if (!data?.length) return [];
  return data.map((r: any) => ({
    id: String(r.id),
    name: r.name,
    enabled: Boolean(r.enabled),
    trigger: r.trigger,
    actions: (r.actions ?? []) as any,
  }));
}

export async function loadEmailCampaignsFromSupabase(): Promise<EmailCampaign[] | null> {
  const sb = assertSupabase();
  const { data, error } = await sb
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return null;
  if (!data?.length) return [];

  return data.map((c: any) => ({
    id: String(c.id),
    createdAt: c.created_at ?? new Date().toISOString(),
    name: c.name,
    subject: c.subject,
    fromName: c.from_name,
    fromEmail: c.from_email,
    html: c.html,
    segment: (c.segment ?? {}) as any,
    stats: {
      sent: Number(c.sent ?? 0),
      opens: Number(c.opens ?? 0),
      clicks: Number(c.clicks ?? 0),
    },
  }));
}

export async function createLeadInSupabase(lead: Lead) {
  const sb = assertSupabase();

  const { error } = await sb.from("leads").insert({
    id: lead.id,
    created_at: lead.createdAt,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message ?? null,
    property_id: lead.propertyId ?? null,
    preferred_district: lead.preferredDistrict ?? null,
    preferred_municipality: lead.preferredMunicipality ?? null,
    preferred_typology: lead.preferredTypology ?? null,
    max_budget_eur: lead.maxBudgetEur ?? null,
    stage: lead.stage,
    temperature: lead.temperature,
    assigned_agent_id: lead.assignedAgentId ?? null,
  });

  if (error) throw error;

  if (lead.activities.length) {
    const { error: aerr } = await sb.from("activity_logs").insert(
      lead.activities.map((a) => ({
        lead_id: lead.id,
        type: a.type,
        title: a.title,
        detail: a.detail ?? null,
        created_at: a.at,
      })),
    );
    if (aerr) throw aerr;
  }
}

export async function updateLeadStageInSupabase(leadId: string, stage: LeadStage) {
  const sb = assertSupabase();
  const { error } = await sb.from("leads").update({ stage }).eq("id", leadId);
  if (error) throw error;
}

export async function insertLeadActivityInSupabase(opts: {
  leadId: string;
  type: string;
  title: string;
  detail?: string;
  at?: string;
}) {
  const sb = assertSupabase();
  const { error } = await sb.from("activity_logs").insert({
    lead_id: opts.leadId,
    type: opts.type,
    title: opts.title,
    detail: opts.detail ?? null,
    created_at: opts.at ?? new Date().toISOString(),
  });
  if (error) throw error;
}

export async function upsertAutomationRulesToSupabase(rules: AutomationRule[]) {
  const sb = assertSupabase();
  const { error } = await sb.from("automations").upsert(
    rules.map((r) => ({
      id: r.id,
      name: r.name,
      enabled: r.enabled,
      trigger: r.trigger,
      actions: r.actions,
    })),
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function insertAutomationRunToSupabase(run: {
  id?: string;
  ruleId: string;
  leadId: string;
  summary: string;
  at?: string;
}) {
  const sb = assertSupabase();
  const { error } = await sb.from("automation_runs").insert({
    id: run.id,
    rule_id: run.ruleId,
    lead_id: run.leadId,
    summary: run.summary,
    created_at: run.at ?? new Date().toISOString(),
  });
  if (error) throw error;
}

export async function upsertEmailCampaignToSupabase(c: EmailCampaign) {
  const sb = assertSupabase();
  const { error } = await sb.from("email_campaigns").upsert(
    {
      id: c.id,
      created_at: c.createdAt,
      name: c.name,
      subject: c.subject,
      from_name: c.fromName,
      from_email: c.fromEmail,
      html: c.html,
      segment: c.segment,
      sent: c.stats.sent,
      opens: c.stats.opens,
      clicks: c.stats.clicks,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function seedMockDataToSupabase() {
  const sb = assertSupabase();

  const { error: aerr } = await sb.from("agents").upsert(
    MOCK_AGENTS.map((a) => ({
      name: a.name,
      role: a.role,
      email: a.email,
      whatsapp_phone: a.whatsappPhone,
      municipalities: a.municipalities,
    })),
    { onConflict: "email" },
  );
  if (aerr) throw aerr;

  const { error: perr } = await sb.from("properties").upsert(
    MOCK_PROPERTIES.map((p) => ({
      title: p.title,
      slug: p.slug,
      kind: p.kind,
      purpose: p.purpose,
      typology: p.typology,
      price_eur: p.priceEur,
      district: p.district,
      municipality: p.municipality,
      parish: p.parish,
      area_m2: p.areaM2,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parking: p.parking,
      energy_rating: p.energyRating,
      description: p.description,
      highlights: p.highlights,
      images: p.images,
      lat: p.location.lat,
      lng: p.location.lng,
      featured: Boolean(p.featured),
    })),
    { onConflict: "slug" },
  );
  if (perr) throw perr;
}