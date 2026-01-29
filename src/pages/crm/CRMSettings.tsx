import { useSeo } from "@/lib/seo";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/state/AppStore";
import { isSupabaseConfigured } from "@/integrations/supabaseClient";
import { Button } from "@/components/ui/button";
import { seedMockDataToSupabase } from "@/integrations/supabaseRepo";
import { useToast } from "@/hooks/use-toast";
import { DatabaseZap } from "lucide-react";
import { HeroMediaManager } from "@/components/crm/HeroMediaManager";
import { AgentCreateModal } from "@/components/crm/AgentCreateModal";

export default function CRMSettingsPage() {
  useSeo({ title: "Definições — CRM AtlasCasa" });
  const { currentAgent, backendInfo, state } = useAppStore();
  const { toast } = useToast();
  if (!currentAgent) return <CRMLogin />;

  async function seed() {
    try {
      await seedMockDataToSupabase();
      toast({
        title: "Dados mock publicados",
        description:
          "Imóveis e agentes foram enviados para o Supabase (se o esquema e permissões estiverem correctos).",
      });
    } catch (e) {
      toast({
        title: "Falha ao publicar",
        description:
          e instanceof Error
            ? e.message
            : "Verifique se executou /src/supabase/schema.sql e as policies (RLS).",
        variant: "destructive",
      });
    }
  }

  return (
    <CRMShell title="Definições">
      <div className="grid gap-4">
        <HeroMediaManager />

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-tight">Agentes</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestão de consultores/gestores/admins. Na versão final, isto é controlado
                por Supabase Auth + roles.
              </p>
            </div>
            <AgentCreateModal />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {state.agents.map((a) => (
              <div
                key={a.id}
                className="rounded-3xl border bg-background p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold tracking-tight truncate">{a.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{a.email}</div>
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {a.municipalities.slice(0, 4).join(", ")}
                    {a.municipalities.length > 4 ? "…" : ""}
                  </div>
                </div>
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  {a.role}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="text-sm font-semibold tracking-tight">Backend</div>
          <p className="mt-1 text-sm text-muted-foreground">
            A app pode usar dados mock + localStorage ou Supabase (Auth/DB/Realtime/Edge
            Functions).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              Supabase: {isSupabaseConfigured() ? "configurado" : "não configurado"}
            </Badge>
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              Estado: {backendInfo.status}
            </Badge>
            {backendInfo.lastError && (
              <Badge className="rounded-full bg-destructive text-destructive-foreground">
                erro
              </Badge>
            )}
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              Esquema SQL: /src/supabase/schema.sql
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="rounded-2xl" onClick={seed}>
              <DatabaseZap className="h-4 w-4" />
              Publicar dados mock no Supabase
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Se falhar: confirme que executou o SQL e que as tabelas têm permissões para o
            anon key (ou RLS/policies adequadas).
          </p>
        </Card>

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="text-sm font-semibold tracking-tight">IA / Limites</div>
          <p className="mt-1 text-sm text-muted-foreground">
            A integração OpenAI deve ser feita em Edge Functions para proteger a chave e
            aplicar rate limits por utilizador.
          </p>
        </Card>

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="text-sm font-semibold tracking-tight">WhatsApp</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Nesta versão, usamos links wa.me. Para envio automático: Twilio/360dialog/Z-API
            via Edge Functions.
          </p>
        </Card>
      </div>
    </CRMShell>
  );
}