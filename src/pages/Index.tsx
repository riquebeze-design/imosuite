import { SiteShell } from "@/components/SiteShell";
import { HeroSearch } from "@/components/HeroSearch";
import { useAppStore } from "@/state/AppStore";
import { PropertyGrid } from "@/components/PropertyGrid";
import { RecommendationCarousel } from "@/components/RecommendationCarousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";
import { CheckCircle2, Sparkles, Workflow } from "lucide-react";

export default function Index() {
  useSeo({
    title: "AtlasCasa — Imobiliária em Portugal",
    description:
      "Site imobiliário premium com pesquisa por distrito/concelho e CRM interno com automações (demo).",
  });

  const { state } = useAppStore();
  const featured = state.catalog.filter((p) => p.featured).slice(0, 6);

  return (
    <SiteShell>
      <HeroSearch />

      <div className="h-10 md:h-14" />

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              Imóveis em destaque
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Uma seleção curada para uma apresentação premium.
            </p>
          </div>
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link to="/imoveis">Ver tudo</Link>
          </Button>
        </div>

        <div className="mt-5">
          <PropertyGrid properties={featured} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <Card className="rounded-[2rem] border bg-card p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-4">
              <Badge className="rounded-full bg-accent text-accent-foreground ring-1 ring-accent/50">
                Operação única (não-SaaS)
              </Badge>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Do site institucional ao CRM — numa experiência integrada.
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Este protótipo inclui pesquisa avançada, favoritos, comparação, leads e uma
                área interna com pipeline e automações. O backend Supabase pode ser ligado
                sem alterar a interface.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-3xl bg-secondary p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 ring-1 ring-primary/15 grid place-items-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Agente de IA (demo)</div>
                  <div className="text-sm text-muted-foreground">
                    Recomenda imóveis e qualifica pedidos sem inventar informação.
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-secondary p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 ring-1 ring-primary/15 grid place-items-center">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Automação de leads</div>
                  <div className="text-sm text-muted-foreground">
                    Atribuição automática, mensagens e registo de execuções.
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-secondary p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 ring-1 ring-primary/15 grid place-items-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">CRM imobiliário</div>
                  <div className="text-sm text-muted-foreground">
                    Pipeline visual e histórico completo de actividade por lead.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <RecommendationCarousel title="Recomendados para si" />
    </SiteShell>
  );
}