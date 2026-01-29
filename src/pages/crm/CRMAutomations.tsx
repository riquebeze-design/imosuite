import { useSeo } from "@/lib/seo";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { AutomationRuleBuilder } from "@/components/AutomationRuleBuilder";
import { useAppStore } from "@/state/AppStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CRMAutomationsPage() {
  useSeo({ title: "Automações — CRM AtlasCasa" });
  const { currentAgent, state } = useAppStore();
  if (!currentAgent) return <CRMLogin />;

  return (
    <CRMShell title="Automações">
      <div className="grid gap-4">
        <AutomationRuleBuilder />

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight">Registo de execuções</div>
              <div className="text-sm text-muted-foreground">
                Cada automação executada fica registada (demo).
              </div>
            </div>
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              {state.automationRuns.length} execuções
            </Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {state.automationRuns.slice(0, 25).map((r) => (
              <div key={r.id} className="rounded-3xl border bg-background p-4">
                <div className="font-semibold tracking-tight">{r.summary}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.at).toLocaleString("pt-PT")} • lead: {r.leadId}
                </div>
              </div>
            ))}
            {!state.automationRuns.length && (
              <div className="rounded-3xl border border-dashed bg-background/40 p-6 text-sm text-muted-foreground">
                Sem execuções. Crie um lead no site público para disparar automações.
              </div>
            )}
          </div>
        </Card>
      </div>
    </CRMShell>
  );
}
