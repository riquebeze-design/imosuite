export type Purpose = "Venda" | "Arrendamento";
export type PropertyKind = "Apartamento" | "Moradia";
export type Typology = `T${1 | 2 | 3 | 4 | 5}`;

export type District =
  | "Lisboa"
  | "Porto"
  | "Setúbal"
  | "Braga"
  | "Aveiro"
  | "Faro"
  | "Coimbra"
  | "Leiria"
  | "Santarém";

export type Municipality = string;
export type Parish = string;

export type EnergyRating = "A+" | "A" | "B" | "C" | "D" | "E";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type Property = {
  id: string;
  title: string;
  slug: string;
  kind: PropertyKind;
  purpose: Purpose;
  typology: Typology;
  priceEur: number;

  district: District;
  municipality: Municipality;
  parish: Parish;

  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  energyRating: EnergyRating;

  description: string;
  highlights: string[];
  images: string[];
  location: GeoPoint;
  createdAt: string;
  featured?: boolean;
};

export type LeadTemperature = "quente" | "morno" | "frio";

export type LeadStage =
  | "Novo"
  | "Em contacto"
  | "Visita marcada"
  | "Proposta"
  | "Fechado";

export type CRMActivityType =
  | "lead_created"
  | "note"
  | "email"
  | "whatsapp"
  | "task"
  | "automation";

export type CRMActivity = {
  id: string;
  type: CRMActivityType;
  at: string;
  title: string;
  detail?: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  message?: string;

  propertyId?: string;
  preferredDistrict?: District;
  preferredMunicipality?: Municipality;
  preferredTypology?: Typology;
  maxBudgetEur?: number;

  stage: LeadStage;
  temperature: LeadTemperature;
  assignedAgentId?: string;

  activities: CRMActivity[];
};

export type AgentRole = "admin" | "gestor" | "consultor";

export type Agent = {
  id: string;
  name: string;
  role: AgentRole;
  municipalities: string[];
  whatsappPhone: string;
  email: string;
};

export type AutomationAction =
  | { type: "assign_round_robin" }
  | { type: "send_whatsapp"; template: string }
  | { type: "send_email"; subject: string; body: string }
  | { type: "ai_qualify_lead" };

export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: "lead_created";
  actions: AutomationAction[];
};

export type AutomationRun = {
  id: string;
  ruleId: string;
  leadId: string;
  at: string;
  summary: string;
};

export type EmailCampaign = {
  id: string;
  createdAt: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  html: string;
  segment: {
    districts?: District[];
    municipalities?: string[];
    typologies?: Typology[];
    priceMin?: number;
    priceMax?: number;
  };
  stats: {
    sent: number;
    opens: number;
    clicks: number;
  };
};
