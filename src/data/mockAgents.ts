import type { Agent } from "@/types/realestate";

export const MOCK_AGENTS: Agent[] = [
  {
    id: "ag_ana",
    name: "Ana Ribeiro",
    role: "admin",
    municipalities: ["Lisboa", "Oeiras", "Cascais"],
    whatsappPhone: "+351912345678",
    email: "ana.ribeiro@atlascasa.pt",
  },
  {
    id: "ag_miguel",
    name: "Miguel Santos",
    role: "gestor",
    municipalities: ["Sintra", "Amadora", "Almada", "Seixal"],
    whatsappPhone: "+351913987654",
    email: "miguel.santos@atlascasa.pt",
  },
  {
    id: "ag_ines",
    name: "Inês Carvalho",
    role: "consultor",
    municipalities: [
      "Porto",
      "Matosinhos",
      "Vila Nova de Gaia",
      "Maia",
      "Gondomar",
    ],
    whatsappPhone: "+351914112233",
    email: "ines.carvalho@atlascasa.pt",
  },
  {
    id: "ag_joao",
    name: "João Almeida",
    role: "consultor",
    municipalities: ["Faro", "Loulé", "Portimão", "Lagos", "Albufeira"],
    whatsappPhone: "+351915445566",
    email: "joao.almeida@atlascasa.pt",
  },
];
