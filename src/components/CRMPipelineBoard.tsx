import { useMemo, useState } from "react";
import { useAppStore } from "@/state/AppStore";
import type { Lead, LeadStage } from "@/types/realestate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STAGES: LeadStage[] = [
  "Novo",
  "Em contacto",
  "Visita marcada",
  "Proposta",
  "Fechado",
];

function tempBadge(temp: Lead["temperature"]) {
  if (temp === "quente") return "bg-primary text-primary-foreground";
  if (temp === "morno")
    return "bg-accent text-accent-foreground ring-1 ring-accent/50";
  return "bg-secondary text-muted-foreground";
}

export function CRMPipelineBoard() {
  const { state, dispatch, currentAgent } = useAppStore();
  const [dragId, setDragId] = useState<string | null>(null);

  const visibleLeads = useMemo(() => {
    if (!currentAgent) return [];
    if (currentAgent.role === "admin" || currentAgent.role === "gestor")
      return state.leads;
    return state.leads.filter((l) => l.assignedAgentId === currentAgent.id);
  }, [currentAgent, state.leads]);

  const byStage = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    for (const s of STAGES) map.set(s, []);
    for (const l of visibleLeads) map.get(l.stage)?.push(l);
    // ordenar por data desc
    for (const s of STAGES) {
      map.get(s)?.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    return map;
  }, [visibleLeads]);

  function moveLead(leadId: string, stage: LeadStage) {
    dispatch({ type: "lead_set_stage", leadId, stage });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            Arraste um lead para mudar de estado.
          </div>
        </div>
        <Button asChild variant="secondary" className="rounded-2xl">
          <Link to="/crm/leads">Lista de leads</Link>
        </Button>
      </div>

      {/* Mobile-first: scroll horizontal. Desktop: grelha 5 colunas sem overflow */}
      <div className="-mx-4 px-4 overflow-x-auto lg:mx-0 lg:px-0 lg:overflow-visible">
        <div className="flex gap-4 min-w-max lg:min-w-0 lg:grid lg:grid-cols-5 lg:gap-4">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className={cn(
                "w-[290px] rounded-[2rem] border bg-card p-3 min-h-[440px]",
                "lg:w-auto lg:min-w-0 lg:min-h-[560px]",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragId) return;
                moveLead(dragId, stage);
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="text-sm font-semibold tracking-tight">{stage}</div>
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  {(byStage.get(stage) ?? []).length}
                </Badge>
              </div>

              <div className="mt-3 grid gap-3">
                {(byStage.get(stage) ?? []).map((l) => (
                  <Card
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "rounded-3xl border bg-background p-3 shadow-sm cursor-grab active:cursor-grabbing",
                      dragId === l.id && "opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/crm/leads/${l.id}`}
                          className="block text-sm font-semibold tracking-tight leading-snug hover:underline"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {l.name}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {l.preferredMunicipality ?? "—"} •{" "}
                          {l.preferredDistrict ?? "Portugal"}
                        </div>
                      </div>
                      <Badge className={cn("rounded-full shrink-0", tempBadge(l.temperature))}>
                        {l.temperature}
                      </Badge>
                    </div>

                    <div
                      className="mt-2 text-xs text-muted-foreground"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {l.message || "(sem mensagem)"}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(l.createdAt).toLocaleDateString("pt-PT")}
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {STAGES.filter((s) => s !== stage)
                          .slice(0, 2)
                          .map((s) => (
                            <button
                              key={s}
                              className="text-[11px] rounded-full bg-secondary px-2 py-1 text-muted-foreground hover:text-foreground"
                              onClick={() => moveLead(l.id, s)}
                              title={`Mover para ${s}`}
                            >
                              {s.split(" ")[0]}
                            </button>
                          ))}
                      </div>
                    </div>
                  </Card>
                ))}

                {!(byStage.get(stage) ?? []).length && (
                  <div className="rounded-3xl border border-dashed bg-background/40 p-3 text-xs text-muted-foreground">
                    Largue aqui para mover.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}