import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/state/AppStore";
import { Link } from "react-router-dom";
import { Flame, IceCream, ThermometerSun, Users } from "lucide-react";

export function AgentDashboard() {
  const { state, currentAgent } = useAppStore();

  const visibleLeads = useMemo(() => {
    if (!currentAgent) return [];
    if (currentAgent.role === "admin" || currentAgent.role === "gestor") return state.leads;
    return state.leads.filter((l) => l.assignedAgentId === currentAgent.id);
  }, [currentAgent, state.leads]);

  const byStage = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of visibleLeads) map.set(l.stage, (map.get(l.stage) ?? 0) + 1);
    return map;
  }, [visibleLeads]);

  const hot = visibleLeads.filter((l) => l.temperature === "quente").length;
  const warm = visibleLeads.filter((l) => l.temperature === "morno").length;
  const cold = visibleLeads.filter((l) => l.temperature === "frio").length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-3xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total de leads</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {visibleLeads.length}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Visível para o seu perfil.
          </div>
        </Card>

        <Card className="rounded-3xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Quentes</div>
            <Badge className="rounded-full bg-primary text-primary-foreground">alta</Badge>
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            {hot}
          </div>
        </Card>

        <Card className="rounded-3xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">Mornos</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-primary" />
            {warm}
          </div>
        </Card>

        <Card className="rounded-3xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">Frios</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight flex items-center gap-2">
            <IceCream className="h-5 w-5 text-primary" />
            {cold}
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight">Pipeline</div>
            <div className="text-sm text-muted-foreground">
              Visão rápida por estado.
            </div>
          </div>
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link to="/crm/pipeline">Abrir pipeline</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {["Novo", "Em contacto", "Visita marcada", "Proposta", "Fechado"].map((s) => (
            <div key={s} className="rounded-2xl bg-secondary p-3">
              <div className="text-xs text-muted-foreground">{s}</div>
              <div className="mt-1 text-xl font-semibold tracking-tight">
                {byStage.get(s) ?? 0}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
