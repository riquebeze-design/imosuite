import { useSeo } from "@/lib/seo";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/state/AppStore";
import { isSupabaseConfigured } from "@/integrations/supabaseClient";

export default function CRMSettingsPage() {
  useSeo({ title: "Definições — CRM AtlasCasa" });
  const { currentAgent } = useAppStore();
  if (!currentAgent) return <CRMLogin />;

  return (
    <CRMShell title="Definições">
      <div className="grid gap-4">
        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="text-sm font-semibold tracking-tight">Backend</div>
          <p className="mt-1 text-sm text-muted-foreground">
            A demo usa dados mock + localStorage. Configure Supabase para persistência real,
            Auth e Edge Functions.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              Supabase: {isSupabaseConfigured() ? "configurado" : "não configurado"}
            </Badge>
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              Esquema SQL: /src/supabase/schema.sql
            </Badge>
          </div>
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
