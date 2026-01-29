import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/state/AppStore";
import { useSeo } from "@/lib/seo";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CRMLeadsPage() {
  useSeo({ title: "Leads — CRM AtlasCasa" });
  const { currentAgent, state } = useAppStore();
  const [q, setQ] = useState("");

  if (!currentAgent) return <CRMLogin />;

  const visible = useMemo(() => {
    const base =
      currentAgent.role === "admin" || currentAgent.role === "gestor"
        ? state.leads
        : state.leads.filter((l) => l.assignedAgentId === currentAgent.id);

    const qq = q.trim().toLowerCase();
    if (!qq) return base;
    return base.filter((l) =>
      `${l.name} ${l.email} ${l.phone} ${l.preferredDistrict ?? ""} ${l.preferredMunicipality ?? ""} ${l.stage}`
        .toLowerCase()
        .includes(qq),
    );
  }, [currentAgent.id, currentAgent.role, q, state.leads]);

  return (
    <CRMShell title="Leads">
      <Card className="rounded-3xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 rounded-2xl pl-10"
              placeholder="Pesquisar por nome, concelho, estado…"
            />
          </div>
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link to="/crm/pipeline">Ver pipeline</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-3">
          {visible.map((l) => (
            <Link
              key={l.id}
              to={`/crm/leads/${l.id}`}
              className="block rounded-3xl border bg-background p-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold tracking-tight truncate">{l.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground truncate">
                    {l.preferredMunicipality ?? "—"} • {l.preferredDistrict ?? "Portugal"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {l.email} • {l.phone}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="rounded-full bg-secondary text-muted-foreground">
                    {l.stage}
                  </Badge>
                  <Badge
                    className={cn(
                      "rounded-full",
                      l.temperature === "quente"
                        ? "bg-primary text-primary-foreground"
                        : l.temperature === "morno"
                          ? "bg-accent text-accent-foreground ring-1 ring-accent/50"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {l.temperature}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {l.message || "(sem mensagem)"}
              </div>
            </Link>
          ))}

          {!visible.length && (
            <div className="rounded-3xl border border-dashed bg-background/40 p-6 text-sm text-muted-foreground">
              Sem leads ainda. Envie um formulário a partir do site público.
            </div>
          )}
        </div>
      </Card>
    </CRMShell>
  );
}
