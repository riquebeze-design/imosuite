import React, { createContext, useContext, useMemo, useReducer } from "react";
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

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function activity(
  type: Lead["activities"][number]["type"],
  title: string,
  detail?: string,
): Lead["activities"][number] {
  return {
    id: uid("act"),
    type,
    at: new Date().toISOString(),
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
};

type Action =
  | { type: "favorite_toggle"; propertyId: string }
  | { type: "compare_toggle"; propertyId: string }
  | { type: "compare_clear" }
  | { type: "event_add"; event: PropertyEvent }
  | {
      type: "lead_create";
      lead: Omit<
        Lead,
        "id" | "createdAt" | "stage" | "temperature" | "activities"
      >;
    }
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

function reducer(state: AppState, action: Action): AppState {
  const next = (() => {
    switch (action.type) {
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
      case "lead_create": {
        const leadId = uid("lead");
        const property = action.lead.propertyId
          ? state.catalog.find((p) => p.id === action.lead.propertyId)
          : undefined;

        const assignedAgentId =
          action.lead.assignedAgentId ?? pickAgentForLead(action.lead, state.catalog);

        const createdAt = new Date().toISOString();
        const temp = leadTemperatureFromLead(
          {
            id: leadId,
            createdAt,
            stage: "Novo",
            temperature: "frio",
            activities: [],
            ...action.lead,
            assignedAgentId,
          },
          property,
        );

        const lead: Lead = {
          id: leadId,
          createdAt,
          stage: "Novo",
          temperature: temp,
          assignedAgentId,
          activities: [
            {
              id: uid("act"),
              type: "lead_created",
              at: createdAt,
              title: "Lead criado",
              detail: action.lead.propertyId
                ? `Interesse no imóvel ${property?.title ?? action.lead.propertyId}`
                : "Pedido genérico",
            },
          ],
          ...action.lead,
        };

        // Executa automações (demo)
        const agent = MOCK_AGENTS.find((a) => a.id === assignedAgentId);
        const vars = {
          nome: lead.name,
          agente: agent?.name ?? "Equipa AtlasCasa",
        };

        const enabledRules = state.automationRules.filter(
          (r) => r.enabled && r.trigger === "lead_created",
        );

        let nextLead = lead;
        const runs: AutomationRun[] = [];

        for (const rule of enabledRules) {
          const summaries: string[] = [];
          for (const act of rule.actions) {
            if (act.type === "assign_round_robin") {
              summaries.push("atribuição");
            }
            if (act.type === "send_whatsapp") {
              const text = applyTemplate(act.template, vars);
              nextLead = {
                ...nextLead,
                activities: [
                  activity("whatsapp", "WhatsApp (automação)", text),
                  ...nextLead.activities,
                ],
              };
              summaries.push("WhatsApp");
            }
            if (act.type === "send_email") {
              const subject = applyTemplate(act.subject, vars);
              const body = applyTemplate(act.body, vars);
              nextLead = {
                ...nextLead,
                activities: [
                  activity("email", `E-mail (automação): ${subject}`, body),
                  ...nextLead.activities,
                ],
              };
              summaries.push("e-mail");
            }
            if (act.type === "ai_qualify_lead") {
              const newTemp = leadTemperatureFromLead(nextLead, property);
              nextLead = {
                ...nextLead,
                temperature: newTemp,
                activities: [
                  activity(
                    "automation",
                    "Qualificação (IA demo)",
                    `Temperatura definida como " ${newTemp} ".`,
                  ),
                  ...nextLead.activities,
                ],
              };
              summaries.push("qualificação");
            }
          }

          runs.push({
            id: uid("run"),
            ruleId: rule.id,
            leadId: leadId,
            at: new Date().toISOString(),
            summary: `${rule.name} — ${summaries.join(", ")}`,
          });
        }

        return {
          ...state,
          leads: [nextLead, ...state.leads],
          automationRuns: [...runs, ...state.automationRuns].slice(0, 250),
        };
      }
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
          const at = new Date().toISOString();
          return {
            ...l,
            activities: [
              {
                id: uid("act"),
                type: action.activityType,
                at,
                title: action.title,
                detail: action.detail,
              },
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
};

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const store = useMemo<AppStore>(() => {
    const currentAgent = state.session
      ? MOCK_AGENTS.find((a) => a.id === state.session?.agentId) ?? null
      : null;

    return {
      state,
      dispatch,
      getPropertyById: (id) => state.catalog.find((p) => p.id === id),
      getAgentById: (id) => MOCK_AGENTS.find((a) => a.id === id),
      currentAgent,
    };
  }, [state]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppStore must be used within AppStoreProvider");
  return v;
}