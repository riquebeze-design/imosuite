import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/state/AppStore";
import type { LeadStage } from "@/types/realestate";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatEUR } from "@/lib/format";
import { ArrowLeft, Mail, MessageCircle, Sparkles } from "lucide-react";

const STAGES: LeadStage[] = [
  "Novo",
  "Em contacto",
  "Visita marcada",
  "Proposta",
  "Fechado",
];

function aiEmailReply(opts: {
  leadName: string;
  leadMsg?: string;
  propertyTitle?: string;
  propertyPrice?: number;
}) {
  // Regras: não inventar; incentivar visita; escalar quando necessário.
  const subject = opts.propertyTitle
    ? `AtlasCasa — Visita ao imóvel: ${opts.propertyTitle}`
    : "AtlasCasa — Seguimento do seu pedido";

  const bodyLines = [
    `Olá ${opts.leadName},`,
    "",
    opts.propertyTitle
      ? `Obrigado pelo seu interesse no imóvel “${opts.propertyTitle}”${typeof opts.propertyPrice === "number" ? ` (${formatEUR(opts.propertyPrice)})` : ""}.`
      : "Obrigado pelo seu contacto. Para avançarmos com recomendações certeiras, preciso de mais alguns detalhes.",
    "",
    "Pode indicar o melhor dia/horário para agendarmos uma visita?",
    "",
    "Se preferir, responda com:",
    "• concelho/distrito preferidos",
    "• tipologia (T1–T5)",
    "• orçamento aproximado",
    "• venda ou arrendamento",
    "",
    "Cumprimentos,",
    "Equipa AtlasCasa",
  ];

  // Se a mensagem pedir algo jurídico, recomendar humano
  const redFlags = ["contrato", "juríd", "hipoteca", "IMT", "escritura", "reclama"];
  const needsHuman =
    (opts.leadMsg ?? "").toLowerCase() &&
    redFlags.some((k) => (opts.leadMsg ?? "").toLowerCase().includes(k));

  const footer = needsHuman
    ? "\n\nNota: para garantir rigor nesta matéria, um consultor humano fará o acompanhamento."
    : "";

  return { subject, body: bodyLines.join("\n") + footer };
}

export default function CRMLeadDetailPage() {
  const { leadId } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const { currentAgent, state, dispatch, getPropertyById, getAgentById } = useAppStore();

  const lead = useMemo(
    () => state.leads.find((l) => l.id === leadId),
    [leadId, state.leads],
  );

  const property = lead?.propertyId ? getPropertyById(lead.propertyId) : undefined;
  const assigned = lead?.assignedAgentId ? getAgentById(lead.assignedAgentId) : undefined;

  const [note, setNote] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  if (!currentAgent) return <CRMLogin />;

  if (!lead) {
    return (
      <CRMShell title="Lead">
        <Card className="rounded-3xl border bg-card p-6">
          <div className="text-lg font-semibold">Lead não encontrado</div>
          <Button className="mt-4 rounded-2xl" onClick={() => nav("/crm/leads")}>
            Voltar
          </Button>
        </Card>
      </CRMShell>
    );
  }

  const waText = `Olá ${lead.name}! Sou ${assigned?.name ?? "AtlasCasa"}. Obrigado pelo contacto. Quer agendar uma visita?`;
  const waHref = assigned ? buildWhatsAppLink(assigned.whatsappPhone, waText) : undefined;

  function addNote() {
    if (!note.trim()) return;
    dispatch({
      type: "lead_add_activity",
      leadId: lead.id,
      activityType: "note",
      title: "Nota",
      detail: note.trim(),
    });
    setNote("");
    toast({ title: "Nota registada" });
  }

  function logEmail() {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    dispatch({
      type: "lead_add_activity",
      leadId: lead.id,
      activityType: "email",
      title: `E-mail enviado: ${emailSubject.trim()}`,
      detail: emailBody.trim(),
    });
    toast({ title: "E-mail registado", description: "Envio simulado (demo)." });
    setEmailSubject("");
    setEmailBody("");
  }

  function generateAI() {
    const r = aiEmailReply({
      leadName: lead.name,
      leadMsg: lead.message,
      propertyTitle: property?.title,
      propertyPrice: property?.priceEur,
    });
    setEmailSubject(r.subject);
    setEmailBody(r.body);
    toast({ title: "Resposta IA gerada", description: "Verifique e ajuste antes de enviar." });
  }

  return (
    <CRMShell title="Lead">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <Button variant="secondary" className="rounded-2xl" asChild>
              <Link to="/crm/leads">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-secondary text-muted-foreground">
                {lead.stage}
              </Badge>
              <Badge className="rounded-full bg-secondary text-muted-foreground">
                {lead.temperature}
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl font-semibold tracking-tight">{lead.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {lead.email} • {lead.phone}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Preferências: {lead.preferredMunicipality ?? "—"} • {lead.preferredDistrict ?? "—"}
              {lead.preferredTypology ? ` • ${lead.preferredTypology}` : ""}
              {lead.maxBudgetEur ? ` • até ${formatEUR(lead.maxBudgetEur)}` : ""}
            </div>
          </div>

          {property && (
            <div className="mt-4 rounded-3xl border bg-background p-4">
              <div className="text-sm font-semibold tracking-tight">Imóvel associado</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold tracking-tight truncate">{property.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {property.municipality}, {property.district}
                  </div>
                </div>
                <Button asChild variant="secondary" className="rounded-2xl">
                  <Link to={`/imovel/${property.slug}`}>Abrir</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-xs text-muted-foreground">Consultor</div>
              <div className="mt-1 font-semibold tracking-tight">
                {assigned?.name ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {assigned?.email ?? ""}
              </div>
            </div>
            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-xs text-muted-foreground">Pipeline</div>
              <div className="mt-2">
                <Select
                  value={lead.stage}
                  onValueChange={(v) =>
                    dispatch({
                      type: "lead_set_stage",
                      leadId: lead.id,
                      stage: v as LeadStage,
                    })
                  }
                >
                  <SelectTrigger className="h-10 rounded-2xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-3xl bg-secondary p-4">
              <div className="text-xs text-muted-foreground">Ações</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  className="rounded-2xl"
                  variant="secondary"
                  asChild
                  disabled={!waHref}
                >
                  <a href={waHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="rounded-2xl" variant="secondary">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="tracking-tight">Registar e-mail</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <Input
                        className="h-11 rounded-2xl"
                        placeholder="Assunto"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                      <Textarea
                        className="rounded-2xl min-h-44"
                        placeholder="Mensagem"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="secondary"
                          className="rounded-2xl"
                          onClick={generateAI}
                        >
                          <Sparkles className="h-4 w-4" />
                          Gerar resposta IA
                        </Button>
                        <Button className="rounded-2xl" onClick={logEmail}>
                          Registar envio
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Demo: regista no histórico. Integração real via Resend/SendGrid.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border bg-background p-4">
            <div className="text-sm font-semibold tracking-tight">Mensagem do cliente</div>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {lead.message || "(sem mensagem)"}
            </p>
          </div>

          <div className="mt-4 rounded-3xl border bg-background p-4">
            <div className="text-sm font-semibold tracking-tight">Notas</div>
            <div className="mt-3 grid gap-2">
              <Textarea
                className="rounded-2xl min-h-24"
                placeholder="Adicionar nota…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end">
                <Button className="rounded-2xl" onClick={addNote}>
                  Guardar nota
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-card p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight">Histórico</div>
              <div className="text-sm text-muted-foreground">
                E-mails, WhatsApp, notas e automações.
              </div>
            </div>
            <Badge className="rounded-full bg-secondary text-muted-foreground">
              {lead.activities.length}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3">
            {lead.activities.map((a) => (
              <div key={a.id} className="rounded-3xl border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold tracking-tight">{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.at).toLocaleString("pt-PT")}
                    </div>
                  </div>
                  <Badge className="rounded-full bg-secondary text-muted-foreground">
                    {a.type}
                  </Badge>
                </div>
                {a.detail && (
                  <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                    {a.detail}
                  </div>
                )}
              </div>
            ))}

            {!lead.activities.length && (
              <div className="rounded-3xl border border-dashed bg-background/40 p-6 text-sm text-muted-foreground">
                Sem atividades ainda.
              </div>
            )}
          </div>
        </Card>
      </div>
    </CRMShell>
  );
}
