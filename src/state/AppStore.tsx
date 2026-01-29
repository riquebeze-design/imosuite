import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {
  Agent,
  AutomationRule,
  AutomationRun,
  EmailCampaign,
  Lead,
  LeadStage,
  LeadTemperature,
  Property,
} from "@/types/realestate";
import { storage } from "@/lib/storage";
import type { PropertyEvent } from "@/lib/recommendation";
import { MOCK_PROPERTIES } from "@/data/mockProperties";
import { MOCK_AGENTS } from "@/data/mockAgents";
import { supabase } from "@/integrations/supabaseClient";
import {
  createLeadInSupabase,
  insertAutomationRunToSupabase,
  insertLeadActivityInSupabase,
  loadAutomationsFromSupabase,
  loadEmailCampaignsFromSupabase,
  loadLeadsFromSupabase,
  loadPropertiesFromSupabase,
  updateLeadStageInSupabase,
  upsertAutomationRulesToSupabase,
  upsertEmailCampaignToSupabase,
} from "@/integrations/supabaseRepo";

const LS_KEYS = {
  favorites: "atlascasa:favorites",
  compare: "atlascasa:compare",
  events: "atlascasa:events",
  leads: "atlascasa:leads",
  automationRules: "atlascasa:automationRules",
  automationRuns: "atlascasa:automationRuns",
  session: "atlascasa:session",
  emailCampaigns: "atlascasa:emailCampaigns",
} as const;

function uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function activity(
  type: Lead["activities"][number]["type"],
  title: string,
  detail?: string,
  at?: string,
): Lead["activities"][number] {
  return {
    id: uuid(),
    type,
    at: at ?? new Date().toISOString(),
    title,
    detail,
  };
}

function applyTemplate(
  tmpl: string,
  vars: Record<string, string | number | undefined | null>,
) {
  return tmpl.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const k = String(key).trim();
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

function leadTemperatureFromLead(lead: Lead, property?: Property): LeadTemperature {
  const budget = lead.maxBudgetEur ?? (property ? property.priceEur : undefined);
  const hasPhone = lead.phone.replace(/\D/g, "").length >= 9;
  const wroteMsg = Boolean(lead.message && lead.message.trim().length > 10);

  // Heurística simples (substituível por IA real via Edge Function)
  let score = 0;
  if (hasPhone) score += 2;
  if (wroteMsg) score += 2;
  if (lead.propertyId) score += 2;
  if (typeof budget === "number" && budget > 0) score += 1;

  if (score >= 6) return "quente";
  if (score >= 4) return "morno";
  return "frio";
}

function pickAgentForLead(
  lead: { preferredMunicipality?: string; propertyId?: string },
  catalog: Property[],
) {
  const property = lead.propertyId
    ? catalog.find((p) => p.id === lead.propertyId)
    : undefined;
  const municipality = lead.preferredMunicipality ?? property?.municipality;

  const candidates = MOCK_AGENTS.filter((a) => a.role !== "admin");
  const byMunicipality = municipality
    ? candidates.filter((a) => a.municipalities.includes(municipality))
    : [];

  const pool = byMunicipality.length ? byMunicipality : candidates;

  const rrBase = storage.get<number>("atlascasa:rr", 0);
  const idx = pool.length ? rrBase % pool.length : 0;
  const assigned = pool[idx]?.id;
  storage.set("atlascasa:rr", rrBase + 1);

  return assigned;
}

export type AppSession = {
  agentId: string;
};

type BackendStatus = "idle" | "syncing" | "ready" | "error";

export type AppState = {
  catalog: Property[];
  favorites: string[];
  compare: string[];
  events: PropertyEvent[];
  leads: Lead[];
  automationRules: AutomationRule[];
  automationRuns: AutomationRun[];
  emailCampaigns: EmailCampaign[];
  session: AppSession | null;
  backend: {
    mode: "local" | "supabase";
    status: BackendStatus;
    lastError?: string;
  };
};

type LeadCreateInput = Omit<
  Lead,
  "id" | "createdAt" | "stage" | "temperature" | "activities"
>;

type HydratePayload = Partial<Omit<AppState, "backend">> & {
  backend?: Partial<AppState["backend"]>;
};

type Action =
  | { type: "hydrate"; state: HydratePayload }
  | { type: "favorite_toggle"; propertyId: string }
  | { type: "compare_toggle"; propertyId: string }
  | { type: "compare_clear" }
  | { type: "event_add"; event: PropertyEvent }
  | { type: "lead_create_request"; lead: LeadCreateInput }
  | { type: "lead_create_committed"; lead: Lead; runs: AutomationRun[] }
  | { type: "lead_set_stage"; leadId: string; stage: LeadStage }
  | {
      type: "lead_add_activity";
      leadId: string;
      title: string;
      detail?: string;
      activityType: Lead["activities"][number]["type"];
    }
  | { type: "automation_rules_set"; rules: AutomationRule[] }
  | { type: "automation_run_add"; run: AutomationRun }
  | { type: "session_login"; agentId: string }
  | { type: "session_logout" }
  | { type: "email_campaign_add"; campaign: EmailCampaign }
  | { type: "email_campaign_update"; campaign: EmailCampaign };

const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "rule_new_lead_default",
    name: "Novo lead → atribuir consultor → WhatsApp → e-mail → qualificar",
    enabled: true,
    trigger: "lead_created",
    actions: [
      { type: "assign_round_robin" },
      {
        type: "send_whatsapp",
        template:
          "Olá {{nome}}! Obrigado pelo seu contacto. Sou {{agente}} da AtlasCasa. Quer agendar uma visita ao imóvel?",
      },
      {
        type: "send_email",
        subject: "AtlasCasa — Próximos passos",
        body:
          "Olá {{nome}},\n\nObrigado pelo seu contacto. Pode indicar o melhor dia/horário para uma visita?\n\nCumprimentos,\n{{agente}} (AtlasCasa)",
      },
      { type: "ai_qualify_lead" },
    ],
  },
];

const DEFAULT_CAMPAIGNS: EmailCampaign[] = [
  {
    id: "camp_welcome",
    createdAt: new Date().toISOString(),
    name: "Boas-vindas (demo)",
    subject: "AtlasCasa — Obrigado pelo seu interesse",
    fromName: "AtlasCasa",
    fromEmail: "geral@atlascasa.pt",
    html: `<div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
  <h2 style="margin:0 0 8px">Obrigado pelo seu interesse</h2>
  <p style="margin:0 0 12px">Podemos agendar uma visita esta semana? Responda com o melhor horário.</p>
  <p style="margin:0">Cumprimentos,<br/>Equipa AtlasCasa</p>
</div>`,
    segment: { districts: ["Lisboa"] },
    stats: { sent: 120, opens: 68, clicks: 19 },
  },
];

function initialState(): AppState {
  return {
    catalog: MOCK_PROPERTIES,
    favorites: storage.get<string[]>(LS_KEYS.favorites, []),
    compare: storage.get<string[]>(LS_KEYS.compare, []),
    events: storage.get<PropertyEvent[]>(LS_KEYS.events, []),
    leads: storage.get<Lead[]>(LS_KEYS.leads, []),
    automationRules: storage.get<AutomationRule[]>(
      LS_KEYS.automationRules,
      DEFAULT_AUTOMATION_RULES,
    ),
    automationRuns: storage.get<AutomationRun[]>(LS_KEYS.automationRuns, []),
    emailCampaigns: storage.get<EmailCampaign[]>(
      LS_KEYS.emailCampaigns,
      DEFAULT_CAMPAIGNS,
    ),
    session: storage.get<AppSession | null>(LS_KEYS.session, null),
    backend: {
      mode: supabase ? "supabase" : "local",
      status: "idle",
    },
  };
}

function persist(state: AppState) {
  storage.set(LS_KEYS.favorites, state.favorites);
  storage.set(LS_KEYS.compare, state.compare);
  storage.set(LS_KEYS.events, state.events);
  storage.set(LS_KEYS.leads, state.leads);
  storage.set(LS_KEYS.automationRules, state.automationRules);
  storage.set(LS_KEYS.automationRuns, state.automationRuns);
  storage.set(LS_KEYS.session, state.session);
  storage.set(LS_KEYS.emailCampaigns, state.emailCampaigns);
}

function buildLeadAndAutomations(
  state: AppState,
  input: LeadCreateInput,
  leadId: string,
  createdAt: string,
): { lead: Lead; runs: AutomationRun[] } {
  const property = input.propertyId
    ? state.catalog.find((p) => p.id === input.propertyId)
    : undefined;

  const assignedAgentId =
    input.assignedAgentId ?? pickAgentForLead(input, state.catalog);

  const baseLead: Lead = {
    id: leadId,
    createdAt,
    stage: "Novo",
    temperature: "frio",
    assignedAgentId,
    activities: [
      {
        id: uuid(),
        type: "lead_created",
        at: createdAt,
        title: "Lead criado",
        detail: input.propertyId
          ? `Interesse no imóvel ${property?.title ?? input.propertyId}`
          : "Pedido genérico",
      },
    ],
    ...input,
  };

  const agent = MOCK_AGENTS.find((a) => a.id === assignedAgentId);
  const vars = {
    nome: baseLead.name,
    agente: agent?.name ?? "Equipa AtlasCasa",
  };

  const enabledRules = state.automationRules.filter(
    (r) => r.enabled && r.trigger === "lead_created",
  );

  let lead = baseLead;
  const runs: AutomationRun[] = [];

  for (const rule of enabledRules) {
    const summaries: string[] = [];
    for (const act of rule.actions) {
      if (act.type === "assign_round_robin") {
        summaries.push("atribuição");
      }
      if (act.type === "send_whatsapp") {
        const text = applyTemplate(act.template, vars);
        lead = {
          ...lead,
          activities: [activity("whatsapp", "WhatsApp (automação)", text), ...lead.activities],
        };
        summaries.push("WhatsApp");
      }
      if (act.type === "send_email") {
        const subject = applyTemplate(act.subject, vars);
        const body = applyTemplate(act.body, vars);
        lead = {
          ...lead,
          activities: [
            activity("email", `E-mail (automação): ${subject}`, body),
            ...lead.activities,
          ],
        };
        summaries.push("e-mail");
      }
      if (act.type === "ai_qualify_lead") {
        const newTemp = leadTemperatureFromLead(lead, property);
        lead = {
          ...lead,
          temperature: newTemp,
          activities: [
            activity(
              "automation",
              "Qualificação (IA demo)",
              `Temperatura definida como "${newTemp}".`,
            ),
            ...lead.activities,
          ],
        };
        summaries.push("qualificação");
      }
    }

    runs.push({
      id: uuid(),
      ruleId: rule.id,
      leadId,
      at: new Date().toISOString(),
      summary: `${rule.name} — ${summaries.join(", ")}`,
    });
  }

  // temperatura base (caso não haja ação de IA)
  if (lead.temperature === "frio") {
    lead = { ...lead, temperature: leadTemperatureFromLead(lead, property) };
  }

  return { lead, runs };
}

function reducer(state: AppState, action: Action): AppState {
  const next = (() => {
    switch (action.type) {
      case "hydrate": {
        const mergedBackend = {
          ...state.backend,
          ...(action.state.backend ?? {}),
          mode: supabase ? "supabase" : state.backend.mode,
          status: (action.state.backend?.status ?? "ready") as BackendStatus,
          lastError: action.state.backend?.lastError ?? undefined,
        };

        return {
          ...state,
          ...action.state,
          backend: mergedBackend,
        } as AppState;
      }
      case "favorite_toggle": {
        const favorites = state.favorites.includes(action.propertyId)
          ? state.favorites.filter((id) => id !== action.propertyId)
          : [...state.favorites, action.propertyId];
        return { ...state, favorites };
      }
      case "compare_toggle": {
        const exists = state.compare.includes(action.propertyId);
        const compare = exists
          ? state.compare.filter((id) => id !== action.propertyId)
          : [...state.compare, action.propertyId].slice(0, 4);
        return { ...state, compare };
      }
      case "compare_clear":
        return { ...state, compare: [] };
      case "event_add": {
        const events = [...state.events, action.event].slice(-250);
        return { ...state, events };
      }
      case "lead_create_request":
        // tratado no dispatch com side effects
        return state;
      case "lead_create_committed":
        return {
          ...state,
          leads: [action.lead, ...state.leads],
          automationRuns: [...action.runs, ...state.automationRuns].slice(0, 250),
        };
      case "lead_set_stage": {
        const leads = state.leads.map((l) =>
          l.id === action.leadId
            ? {
                ...l,
                stage: action.stage,
                activities: [
                  activity(
                    "automation",
                    "Estado do pipeline actualizado",
                    `Novo estado: ${action.stage}`,
                  ),
                  ...l.activities,
                ],
              }
            : l,
        );
        return { ...state, leads };
      }
      case "lead_add_activity": {
        const leads = state.leads.map((l) => {
          if (l.id !== action.leadId) return l;
          return {
            ...l,
            activities: [
              activity(action.activityType, action.title, action.detail),
              ...l.activities,
            ],
          };
        });
        return { ...state, leads };
      }
      case "automation_rules_set":
        return { ...state, automationRules: action.rules };
      case "automation_run_add":
        return {
          ...state,
          automationRuns: [action.run, ...state.automationRuns].slice(0, 250),
        };
      case "session_login":
        return { ...state, session: { agentId: action.agentId } };
      case "session_logout":
        return { ...state, session: null };
      case "email_campaign_add":
        return { ...state, emailCampaigns: [action.campaign, ...state.emailCampaigns] };
      case "email_campaign_update":
        return {
          ...state,
          emailCampaigns: state.emailCampaigns.map((c) =>
            c.id === action.campaign.id ? action.campaign : c,
          ),
        };
      default:
        return state;
    }
  })();

  persist(next);
  return next;
}

type AppStore = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getPropertyById: (id: string) => Property | undefined;
  getAgentById: (id: string) => Agent | undefined;
  currentAgent: Agent | null;
  backendInfo: AppState["backend"];
};

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  const [backend, setBackend] = useState<AppState["backend"]>(state.backend);

  useEffect(() => {
    stateRef.current = state;
    setBackend(state.backend);
  }, [state]);

  // Hydrate inicial via Supabase (se disponível)
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      baseDispatch({
        type: "hydrate",
        state: {
          backend: { mode: "supabase", status: "syncing" },
        },
      });

      const [props, leads, autos, camps] = await Promise.all([
        loadPropertiesFromSupabase().catch(() => null),
        loadLeadsFromSupabase().catch(() => null),
        loadAutomationsFromSupabase().catch(() => null),
        loadEmailCampaignsFromSupabase().catch(() => null),
      ]);

      if (cancelled) return;

      baseDispatch({
        type: "hydrate",
        state: {
          catalog: props && props.length ? props : undefined,
          leads: leads ?? undefined,
          automationRules: autos && autos.length ? autos : undefined,
          emailCampaigns: camps && camps.length ? camps : undefined,
          backend: { mode: "supabase", status: "ready" },
        },
      });
    })().catch((e) => {
      if (cancelled) return;
      baseDispatch({
        type: "hydrate",
        state: {
          backend: {
            mode: "supabase",
            status: "error",
            lastError: e instanceof Error ? e.message : String(e),
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const dispatch = useCallback(async (action: Action) => {
    // Intercepta criação de lead para garantir sync + automações consistentes
    if (action.type === "lead_create_request") {
      const leadId = uuid();
      const createdAt = new Date().toISOString();
      const { lead, runs } = buildLeadAndAutomations(
        stateRef.current,
        action.lead,
        leadId,
        createdAt,
      );

      // tenta escrever no Supabase (sem bloquear a UI em caso de falha)
      if (supabase) {
        try {
          await createLeadInSupabase(lead);
          for (const r of runs) {
            await insertAutomationRunToSupabase({
              id: r.id,
              ruleId: r.ruleId,
              leadId: r.leadId,
              summary: r.summary,
              at: r.at,
            });
          }
        } catch {
          // fallback silencioso: mantém local
        }
      }

      baseDispatch({ type: "lead_create_committed", lead, runs });
      return;
    }

    baseDispatch(action);

    // Side effects (best effort)
    if (!supabase) return;

    try {
      if (action.type === "lead_set_stage") {
        await updateLeadStageInSupabase(action.leadId, action.stage);
        await insertLeadActivityInSupabase({
          leadId: action.leadId,
          type: "automation",
          title: "Estado do pipeline actualizado",
          detail: `Novo estado: ${action.stage}`,
        });
      }

      if (action.type === "lead_add_activity") {
        await insertLeadActivityInSupabase({
          leadId: action.leadId,
          type: action.activityType,
          title: action.title,
          detail: action.detail,
        });
      }

      if (action.type === "automation_rules_set") {
        await upsertAutomationRulesToSupabase(action.rules);
      }

      if (action.type === "automation_run_add") {
        await insertAutomationRunToSupabase({
          id: action.run.id,
          ruleId: action.run.ruleId,
          leadId: action.run.leadId,
          summary: action.run.summary,
          at: action.run.at,
        });
      }

      if (action.type === "email_campaign_add") {
        await upsertEmailCampaignToSupabase(action.campaign);
      }
      if (action.type === "email_campaign_update") {
        await upsertEmailCampaignToSupabase(action.campaign);
      }
    } catch {
      // ignore
    }
  }, []);

  const store = useMemo<AppStore>(() => {
    const currentAgent = state.session
      ? MOCK_AGENTS.find((a) => a.id === state.session?.agentId) ?? null
      : null;

    return {
      state,
      dispatch: dispatch as any,
      getPropertyById: (id) => state.catalog.find((p) => p.id === id),
      getAgentById: (id) => MOCK_AGENTS.find((a) => a.id === id),
      currentAgent,
      backendInfo: backend,
    };
  }, [backend, dispatch, state]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppStore must be used within AppStoreProvider");
  return v;
}