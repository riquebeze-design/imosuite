import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SiteShell } from "@/components/SiteShell";
import { useAppStore } from "@/state/AppStore";
import { getPropertyBySlug } from "@/data/mockProperties";
import { useSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PropertyDetailsTabs } from "@/components/PropertyDetailsTabs";
import { LeadFormModal } from "@/components/LeadFormModal";
import { WhatsAppCTAButton } from "@/components/WhatsAppCTAButton";
import { MOCK_AGENTS } from "@/data/mockAgents";
import { formatEUR } from "@/lib/format";
import { ArrowLeft, Heart, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecommendationCarousel } from "@/components/RecommendationCarousel";

export default function PropertyDetailsPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { state, dispatch } = useAppStore();

  const property = useMemo(() => {
    if (!slug) return undefined;
    return getPropertyBySlug(slug) ?? state.catalog.find((p) => p.slug === slug);
  }, [slug, state.catalog]);

  useSeo({
    title: property ? `${property.title} — AtlasCasa` : "Imóvel — AtlasCasa",
    description: property
      ? `${property.typology} • ${property.municipality}, ${property.district} • ${formatEUR(property.priceEur)}`
      : "Detalhe do imóvel",
  });

  useEffect(() => {
    if (!property) return;
    dispatch({
      type: "event_add",
      event: { type: "view", propertyId: property.id, at: new Date().toISOString() },
    });
  }, [dispatch, property]);

  const isFav = property ? state.favorites.includes(property.id) : false;
  const isCmp = property ? state.compare.includes(property.id) : false;

  const [activeImg, setActiveImg] = useState(0);

  if (!property) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-6xl px-4 py-14">
          <Card className="rounded-3xl border bg-card p-6">
            <div className="text-lg font-semibold">Imóvel não encontrado</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifique o link ou volte à pesquisa.
            </p>
            <div className="mt-4">
              <Button className="rounded-2xl" onClick={() => nav("/imoveis")}>
                Voltar à pesquisa
              </Button>
            </div>
          </Card>
        </section>
      </SiteShell>
    );
  }

  const agent =
    MOCK_AGENTS.find((a) => a.municipalities.includes(property.municipality)) ??
    MOCK_AGENTS[0];

  const waMsg = `Olá! Tenho interesse no imóvel “${property.title}” (${formatEUR(property.priceEur)}). Podemos agendar uma visita?`;

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-10">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            className="rounded-2xl"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className={cn("rounded-2xl", isFav && "ring-2 ring-primary/30")}
              onClick={() =>
                dispatch({ type: "favorite_toggle", propertyId: property.id })
              }
            >
              <Heart className={cn("h-4 w-4", isFav && "fill-primary text-primary")} />
              Favorito
            </Button>
            <Button
              variant="secondary"
              className={cn("rounded-2xl", isCmp && "ring-2 ring-primary/30")}
              onClick={() => {
                dispatch({ type: "compare_toggle", propertyId: property.id });
                dispatch({
                  type: "event_add",
                  event: {
                    type: "compare",
                    propertyId: property.id,
                    at: new Date().toISOString(),
                  },
                });
              }}
            >
              <Scale className="h-4 w-4" />
              Comparar
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border bg-card">
              <img
                src={property.images[activeImg]}
                alt={property.title}
                className="h-[340px] w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {property.images.slice(0, 4).map((src, idx) => (
                <button
                  key={src}
                  onClick={() => setActiveImg(idx)}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40",
                    idx === activeImg && "ring-2 ring-primary/30",
                  )}
                >
                  <img src={src} alt="" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-primary text-primary-foreground">
                  {property.typology}
                </Badge>
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  {property.purpose}
                </Badge>
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  {property.kind}
                </Badge>
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
                {property.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {property.parish}, {property.municipality} • {property.district}
              </p>
              <div className="mt-3 text-3xl font-semibold tracking-tight">
                {formatEUR(property.priceEur)}
              </div>
            </div>

            <Card className="rounded-3xl border bg-card p-4">
              <div className="text-sm font-semibold tracking-tight">Fale connosco</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Resposta rápida via WhatsApp ou formulário (gera lead no CRM).
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                Consultor sugerido: <span className="font-medium text-foreground">{agent.name}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <WhatsAppCTAButton
                  agentPhone={agent.whatsappPhone}
                  message={waMsg}
                  className="rounded-2xl"
                />
                <LeadFormModal
                  property={property}
                  trigger={
                    <Button className="rounded-2xl" variant="secondary">
                      Formulário
                    </Button>
                  }
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ao enviar, concorda com o tratamento dos seus dados para contacto (demo).
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <PropertyDetailsTabs property={property} />
        </div>
      </section>

      <RecommendationCarousel title="Imóveis semelhantes" />
    </SiteShell>
  );
}