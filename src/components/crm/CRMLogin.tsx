import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/BrandMark";
import { useAppStore } from "@/state/AppStore";
import type { AgentRole } from "@/types/realestate";

const ROLE_LABEL: Record<AgentRole, string> = {
  admin: "Admin",
  gestor: "Gestor",
  consultor: "Consultor",
};

export function CRMLogin() {
  const { dispatch, state } = useAppStore();
  const [agentId, setAgentId] = useState(state.agents[0]?.id ?? "");

  const agent = useMemo(
    () => state.agents.find((a) => a.id === agentId),
    [agentId, state.agents],
  );

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-12">
      <Card className="w-full max-w-lg rounded-[2rem] border bg-card p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <BrandMark />
          <Badge className="rounded-full bg-accent text-accent-foreground ring-1 ring-accent/50">
            Demo
          </Badge>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Entrar no CRM</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nesta demo, a autenticação é simulada. Com Supabase Auth, o login passa a ser
          real com perfis (admin/gestor/consultor).
        </p>

        <div className="mt-6 grid gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-semibold">Escolha o utilizador</div>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Utilizador" />
              </SelectTrigger>
              <SelectContent>
                {state.agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} — {ROLE_LABEL[a.role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {agent && (
            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-sm font-semibold tracking-tight">Acesso</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Municípios: {agent.municipalities.slice(0, 4).join(", ")}
                {agent.municipalities.length > 4 ? "…" : ""}
              </div>
            </div>
          )}

          <Button
            className="mt-2 h-11 rounded-2xl"
            onClick={() => dispatch({ type: "session_login", agentId })}
            disabled={!agentId}
          >
            Entrar
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          RGPD: não introduza dados pessoais reais nesta demonstração.
        </p>
      </Card>
    </div>
  );
}