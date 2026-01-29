import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function applyTemplate(tmpl: string, vars: Record<string, string>) {
  return tmpl.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const k = String(key).trim();
    return vars[k] ?? "";
  });
}

function classifyLeadTemperature(lead: {
  phone: string;
  message?: string | null;
  property_id?: string | null;
  max_budget_eur?: number | null;
}) {
  const hasPhone = (lead.phone ?? "").replace(/\D/g, "").length >= 9;
  const wroteMsg = Boolean((lead.message ?? "").trim().length > 10);
  const hasProperty = Boolean(lead.property_id);
  const hasBudget = typeof lead.max_budget_eur === "number" && lead.max_budget_eur > 0;

  let score = 0;
  if (hasPhone) score += 2;
  if (wroteMsg) score += 2;
  if (hasProperty) score += 2;
  if (hasBudget) score += 1;

  if (score >= 6) return "quente";
  if (score >= 4) return "morno";
  return "frio";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      console.error("[lead-automation] Missing leadId");
      return new Response(JSON.stringify({ error: "Missing leadId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const sb = createClient(supabaseUrl, serviceRoleKey);

    console.log("[lead-automation] Run requested", { leadId });

    const { data: lead, error: leadErr } = await sb
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr) {
      console.error("[lead-automation] Failed to load lead", { leadErr });
      return new Response(JSON.stringify({ error: leadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lead) {
      console.warn("[lead-automation] Lead not found", { leadId });
      return new Response(JSON.stringify({ ok: true, message: "Lead not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: property } = lead.property_id
      ? await sb
          .from("properties")
          .select("id, title, municipality, district, slug")
          .eq("id", lead.property_id)
          .maybeSingle()
      : { data: null };

    const municipality =
      lead.preferred_municipality ?? property?.municipality ?? null;

    const { data: agents } = await sb
      .from("agents")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);

    const eligibleAgents = (agents ?? []).filter((a) => a.role !== "admin");
    const byMunicipality = municipality
      ? eligibleAgents.filter((a) => (a.municipalities ?? []).includes(municipality))
      : [];
    const pool = byMunicipality.length ? byMunicipality : eligibleAgents;

    let assignedAgentId = lead.assigned_agent_id as string | null;

    const { data: rules } = await sb
      .from("automations")
      .select("*")
      .eq("enabled", true)
      .eq("trigger", "lead_created")
      .order("created_at", { ascending: true })
      .limit(50);

    const now = () => new Date().toISOString();

    for (const rule of rules ?? []) {
      const actions = Array.isArray(rule.actions) ? rule.actions : [];

      const summaries: string[] = [];

      for (const act of actions) {
        if (act?.type === "assign_round_robin") {
          if (!assignedAgentId && pool.length) {
            // Determinístico simples (primeiro da pool)
            assignedAgentId = String(pool[0].id);
            const { error } = await sb
              .from("leads")
              .update({ assigned_agent_id: assignedAgentId })
              .eq("id", leadId);
            if (error) {
              console.error("[lead-automation] Failed assign agent", { error });
            } else {
              summaries.push("atribuição");
              await sb.from("activity_logs").insert({
                lead_id: leadId,
                type: "automation",
                title: "Atribuição automática",
                detail: municipality
                  ? `Atribuído por concelho: ${municipality}`
                  : "Atribuído por rodízio",
                created_at: now(),
              });
            }
          } else {
            summaries.push("atribuição");
          }
        }

        // Vars para templates
        const agent = assignedAgentId
          ? (agents ?? []).find((a) => String(a.id) === String(assignedAgentId))
          : null;
        const vars = {
          nome: lead.name ?? "",
          agente: agent?.name ?? "Equipa AtlasCasa",
          imovel: property?.title ?? "",
        };

        if (act?.type === "send_whatsapp") {
          const text = applyTemplate(String(act.template ?? ""), vars);
          await sb.from("activity_logs").insert({
            lead_id: leadId,
            type: "whatsapp",
            title: "WhatsApp (automação)",
            detail: text,
            created_at: now(),
          });
          summaries.push("WhatsApp");

          // Envio real: integrar provider (Twilio/360dialog) usando secret.
          console.log("[lead-automation] WhatsApp prepared", {
            leadId,
            to: lead.phone,
          });
        }

        if (act?.type === "send_email") {
          const subject = applyTemplate(String(act.subject ?? ""), vars);
          const body = applyTemplate(String(act.body ?? ""), vars);
          await sb.from("activity_logs").insert({
            lead_id: leadId,
            type: "email",
            title: `E-mail (automação): ${subject}`,
            detail: body,
            created_at: now(),
          });
          summaries.push("e-mail");

          console.log("[lead-automation] Email prepared", {
            leadId,
            to: lead.email,
          });
        }

        if (act?.type === "ai_qualify_lead") {
          const temp = classifyLeadTemperature(lead);
          const { error } = await sb
            .from("leads")
            .update({ temperature: temp })
            .eq("id", leadId);
          if (error) {
            console.error("[lead-automation] Failed to update temperature", { error });
          }
          await sb.from("activity_logs").insert({
            lead_id: leadId,
            type: "automation",
            title: "Qualificação (IA demo)",
            detail: `Temperatura definida como “${temp}”.`,
            created_at: now(),
          });
          summaries.push("qualificação");
        }
      }

      await sb.from("automation_runs").insert({
        rule_id: rule.id,
        lead_id: leadId,
        summary: `${rule.name} — ${summaries.join(", ")}`,
        created_at: now(),
      });
    }

    console.log("[lead-automation] Completed", { leadId });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[lead-automation] Unhandled error", { e });
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
