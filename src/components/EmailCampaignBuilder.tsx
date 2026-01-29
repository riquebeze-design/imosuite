import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/state/AppStore";
import { DISTRICTS } from "@/data/ptLocations";
import type { District, EmailCampaign, Typology } from "@/types/realestate";
import { Eye, Send, Sparkles } from "lucide-react";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const TYPOLOGIES: Typology[] = ["T1", "T2", "T3", "T4", "T5"];

const TEMPLATES = {
  novoImovel: {
    name: "Novo imóvel semelhante",
    subject: "AtlasCasa — Novo imóvel que pode interessar",
    html: `<div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
  <h2 style="margin:0 0 8px">Novo imóvel que pode interessar</h2>
  <p style="margin:0 0 12px">Encontrámos uma opção semelhante ao seu perfil. Quer agendar uma visita?</p>
  <p style="margin:0">Cumprimentos,<br/>Equipa AtlasCasa</p>
</div>`,
  },
  followUp: {
    name: "Follow-up de visita",
    subject: "AtlasCasa — Seguimento da visita",
    html: `<div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
  <h2 style="margin:0 0 8px">Obrigado pela visita</h2>
  <p style="margin:0 0 12px">Fico disponível para esclarecer dúvidas e, se fizer sentido, avançarmos com proposta.</p>
  <p style="margin:0">Cumprimentos,<br/>Equipa AtlasCasa</p>
</div>`,
  },
  reativacao: {
    name: "Reativação",
    subject: "AtlasCasa — Novidades no mercado",
    html: `<div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
  <h2 style="margin:0 0 8px">Novidades no mercado</h2>
  <p style="margin:0 0 12px">Quer que lhe enviemos novas opções dentro do seu orçamento e localização?</p>
  <p style="margin:0">Cumprimentos,<br/>Equipa AtlasCasa</p>
</div>`,
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

export function EmailCampaignBuilder() {
  const { state, dispatch } = useAppStore();
  const { toast } = useToast();

  const [name, setName] = useState<string>("Campanha");
  const [subject, setSubject] = useState<string>(TEMPLATES.novoImovel.subject);
  const [fromName, setFromName] = useState<string>("AtlasCasa");
  const [fromEmail, setFromEmail] = useState<string>("geral@atlascasa.pt");
  const [html, setHtml] = useState<string>(TEMPLATES.novoImovel.html);

  const [selectedDistricts, setSelectedDistricts] = useState<District[]>(["Lisboa"]);
  const [selectedTypologies, setSelectedTypologies] = useState<Typology[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const estimatedAudience = useMemo(() => {
    // demo: estima com base nos leads existentes
    const leads = state.leads;
    return leads.filter((l) => {
      const okDistrict =
        !selectedDistricts.length ||
        (l.preferredDistrict && selectedDistricts.includes(l.preferredDistrict));
      const okTyp =
        !selectedTypologies.length ||
        (l.preferredTypology && selectedTypologies.includes(l.preferredTypology));
      return okDistrict && okTyp;
    }).length;
  }, [selectedDistricts, selectedTypologies, state.leads]);

  function applyTemplate(k: TemplateKey) {
    const t = TEMPLATES[k];
    setName(t.name);
    setSubject(t.subject);
    setHtml(t.html);
    toast({ title: "Template aplicado", description: t.name });
  }

  function saveCampaign() {
    const campaign: EmailCampaign = {
      id: uid("camp"),
      createdAt: new Date().toISOString(),
      name,
      subject,
      fromName,
      fromEmail,
      html,
      segment: {
        districts: selectedDistricts.length ? selectedDistricts : undefined,
        typologies: selectedTypologies.length ? selectedTypologies : undefined,
        priceMin: priceMin ? Number(priceMin.replace(/\D/g, "")) : undefined,
        priceMax: priceMax ? Number(priceMax.replace(/\D/g, "")) : undefined,
      },
      stats: { sent: 0, opens: 0, clicks: 0 },
    };
    dispatch({ type: "email_campaign_add", campaign });
    toast({ title: "Campanha criada", description: "Guardada no módulo de marketing." });
  }

  function simulateSend() {
    const sent = Math.max(estimatedAudience, 12);
    toast({
      title: "Envio simulado",
      description: `Campanha enviada para ${sent} contactos (demo).`,
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold tracking-tight">Editor de campanha</div>
              <div className="text-sm text-muted-foreground">
                Editor simples (HTML). Pode ser substituído por editor visual.
              </div>
            </div>
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              audiência estimada: {estimatedAudience}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <div className="text-sm font-semibold">Template</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
                  <button
                    key={k}
                    className="text-xs rounded-full bg-secondary px-3 py-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => applyTemplate(k)}
                  >
                    {TEMPLATES[k].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-semibold">Nome</div>
              <Input className="h-11 rounded-2xl" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-semibold">Assunto</div>
              <Input className="h-11 rounded-2xl" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-sm font-semibold">From (nome)</div>
                <Input className="h-11 rounded-2xl" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-semibold">From (email)</div>
                <Input className="h-11 rounded-2xl" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-semibold">HTML</div>
              <Textarea className="rounded-2xl min-h-56" value={html} onChange={(e) => setHtml(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="rounded-2xl" onClick={saveCampaign}>
                <Sparkles className="h-4 w-4" />
                Guardar
              </Button>
              <Button variant="secondary" className="rounded-2xl" onClick={() => setPreviewOpen((v) => !v)}>
                <Eye className="h-4 w-4" />
                {previewOpen ? "Fechar" : "Pré-visualizar"}
              </Button>
              <Button variant="secondary" className="rounded-2xl" onClick={simulateSend}>
                <Send className="h-4 w-4" />
                Simular envio
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="text-sm font-semibold tracking-tight">Segmentação</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Segmentação por distrito, tipologia e faixa de preço (demo).
          </p>

          <div className="mt-4 grid gap-4">
            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-sm font-semibold">Distritos</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {DISTRICTS.map((d) => {
                  const checked = selectedDistricts.includes(d);
                  return (
                    <label key={d} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedDistricts((prev) =>
                            v
                              ? [...prev, d]
                              : prev.filter((x) => x !== d),
                          );
                        }}
                      />
                      <span>{d}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-sm font-semibold">Tipologias</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPOLOGIES.map((t) => {
                  const active = selectedTypologies.includes(t);
                  return (
                    <button
                      key={t}
                      className={
                        active
                          ? "text-xs rounded-full bg-primary px-3 py-1.5 text-primary-foreground"
                          : "text-xs rounded-full bg-background px-3 py-1.5 text-muted-foreground hover:text-foreground"
                      }
                      onClick={() => {
                        setSelectedTypologies((prev) =>
                          active ? prev.filter((x) => x !== t) : [...prev, t],
                        );
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-sm font-semibold">Faixa de preço</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  className="h-11 rounded-2xl bg-background"
                  placeholder="Mín."
                  inputMode="numeric"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
                <Input
                  className="h-11 rounded-2xl bg-background"
                  placeholder="Máx."
                  inputMode="numeric"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Na versão final: segmentação por comportamento (cliques/favoritos).
              </div>
            </div>

            {previewOpen && (
              <div className="rounded-3xl border bg-background p-4">
                <div className="text-sm font-semibold">Pré-visualização</div>
                <div className="mt-3 rounded-2xl border bg-card p-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border bg-card p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Campanhas</div>
            <div className="text-sm text-muted-foreground">
              Relatórios (abertura/cliques) com dados mock.
            </div>
          </div>
          <Badge className="rounded-full bg-secondary text-muted-foreground">
            {state.emailCampaigns.length} campanhas
          </Badge>
        </div>

        <div className="mt-4 grid gap-3">
          {state.emailCampaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border bg-background p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="font-semibold tracking-tight truncate">{c.name}</div>
                <div className="text-sm text-muted-foreground truncate">{c.subject}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  enviados: {c.stats.sent}
                </Badge>
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  aberturas: {c.stats.opens}
                </Badge>
                <Badge className="rounded-full bg-secondary text-muted-foreground">
                  cliques: {c.stats.clicks}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}