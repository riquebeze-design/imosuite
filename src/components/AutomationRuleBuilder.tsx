import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/state/AppStore";
import type { AutomationAction, AutomationRule } from "@/types/realestate";
import { Play, Plus, Trash2 } from "lucide-react";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function actionLabel(a: AutomationAction) {
  switch (a.type) {
    case "assign_round_robin":
      return "Atribuição (rodízio)";
    case "send_whatsapp":
      return "WhatsApp";
    case "send_email":
      return "E-mail";
    case "ai_qualify_lead":
      return "Qualificação IA";
  }
}

export function AutomationRuleBuilder() {
  const { state, dispatch } = useAppStore();
  const { toast } = useToast();

  const rules = state.automationRules;

  const runsByRule = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of state.automationRuns) {
      map.set(r.ruleId, (map.get(r.ruleId) ?? 0) + 1);
    }
    return map;
  }, [state.automationRuns]);

  function updateRule(rule: AutomationRule) {
    dispatch({
      type: "automation_rules_set",
      rules: rules.map((r) => (r.id === rule.id ? rule : r)),
    });
  }

  function addRule() {
    const newRule: AutomationRule = {
      id: uid("rule"),
      name: "Nova regra",
      enabled: true,
      trigger: "lead_created",
      actions: [{ type: "assign_round_robin" }, { type: "ai_qualify_lead" }],
    };
    dispatch({ type: "automation_rules_set", rules: [newRule, ...rules] });
  }

  function removeRule(id: string) {
    dispatch({
      type: "automation_rules_set",
      rules: rules.filter((r) => r.id !== id),
    });
  }

  function simulateRun(rule: AutomationRule) {
    dispatch({
      type: "automation_run_add",
      run: {
        id: uid("run"),
        ruleId: rule.id,
        leadId: "lead_demo",
        at: new Date().toISOString(),
        summary: `${rule.name} — execução manual (demo)`,
      },
    });
    toast({ title: "Regra executada", description: "Execução simulada registada." });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Regras de automação (Edge Functions no Supabase na versão final). Variáveis
            disponíveis: <span className="font-medium">{"{{nome}}"}</span>,{" "}
            <span className="font-medium">{"{{agente}}"}</span>.
          </p>
        </div>
        <Button className="rounded-2xl" onClick={addRule}>
          <Plus className="h-4 w-4" />
          Nova regra
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="rounded-[2rem] border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="grid gap-2 w-full">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => updateRule({ ...rule, enabled: v })}
                  />
                  <Badge className="rounded-full bg-secondary text-muted-foreground">
                    trigger: {rule.trigger}
                  </Badge>
                  <Badge className="rounded-full bg-secondary text-muted-foreground">
                    execuções: {runsByRule.get(rule.id) ?? 0}
                  </Badge>
                </div>

                <Input
                  className="h-11 rounded-2xl"
                  value={rule.name}
                  onChange={(e) => updateRule({ ...rule, name: e.target.value })}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl bg-secondary p-4">
                    <div className="text-sm font-semibold tracking-tight">Ações</div>
                    <div className="mt-2 grid gap-2">
                      {rule.actions.map((a, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-2xl bg-background px-3 py-2"
                        >
                          <div className="text-sm">
                            <span className="font-medium">{idx + 1}.</span>{" "}
                            {actionLabel(a)}
                          </div>
                          <button
                            className="text-xs rounded-full bg-secondary px-2 py-1 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              updateRule({
                                ...rule,
                                actions: rule.actions.filter((_, i) => i !== idx),
                              })
                            }
                            title="Remover ação"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="text-xs rounded-full bg-background px-3 py-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          updateRule({
                            ...rule,
                            actions: [
                              ...rule.actions,
                              { type: "send_whatsapp", template: "Olá {{nome}}!" },
                            ],
                          })
                        }
                      >
                        + WhatsApp
                      </button>
                      <button
                        className="text-xs rounded-full bg-background px-3 py-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          updateRule({
                            ...rule,
                            actions: [
                              ...rule.actions,
                              {
                                type: "send_email",
                                subject: "AtlasCasa — contacto",
                                body: "Olá {{nome}},\n\nPodemos marcar visita?\n\n{{agente}}",
                              },
                            ],
                          })
                        }
                      >
                        + E-mail
                      </button>
                      <button
                        className="text-xs rounded-full bg-background px-3 py-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          updateRule({
                            ...rule,
                            actions: [...rule.actions, { type: "ai_qualify_lead" }],
                          })
                        }
                      >
                        + Qualificação
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-secondary p-4">
                    <div className="text-sm font-semibold tracking-tight">Templates</div>
                    <div className="mt-3 grid gap-3">
                      {rule.actions.map((a, idx) => {
                        if (a.type === "send_whatsapp") {
                          return (
                            <div key={idx} className="grid gap-2">
                              <div className="text-xs text-muted-foreground">WhatsApp</div>
                              <Textarea
                                className="rounded-2xl min-h-20 bg-background"
                                value={a.template}
                                onChange={(e) => {
                                  const next = [...rule.actions];
                                  next[idx] = { ...a, template: e.target.value };
                                  updateRule({ ...rule, actions: next });
                                }}
                              />
                            </div>
                          );
                        }
                        if (a.type === "send_email") {
                          return (
                            <div key={idx} className="grid gap-2">
                              <div className="text-xs text-muted-foreground">E-mail</div>
                              <Input
                                className="h-10 rounded-2xl bg-background"
                                value={a.subject}
                                onChange={(e) => {
                                  const next = [...rule.actions];
                                  next[idx] = { ...a, subject: e.target.value };
                                  updateRule({ ...rule, actions: next });
                                }}
                              />
                              <Textarea
                                className="rounded-2xl min-h-28 bg-background"
                                value={a.body}
                                onChange={(e) => {
                                  const next = [...rule.actions];
                                  next[idx] = { ...a, body: e.target.value };
                                  updateRule({ ...rule, actions: next });
                                }}
                              />
                            </div>
                          );
                        }
                        return null;
                      })}

                      {!rule.actions.some(
                        (a) => a.type === "send_whatsapp" || a.type === "send_email",
                      ) && (
                        <div className="text-xs text-muted-foreground">
                          Adicione uma ação WhatsApp ou E-mail para editar templates.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-2 md:pl-4">
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => simulateRun(rule)}
                >
                  <Play className="h-4 w-4" />
                  Executar
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}