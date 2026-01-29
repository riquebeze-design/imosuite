import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useAppStore } from "@/state/AppStore";
import { formatEUR } from "@/lib/format";

type Msg = { role: "user" | "assistant"; content: string };

function suggestFromCatalog(q: string, catalog: ReturnType<typeof useAppStore>["state"]["catalog"]) {
  const qq = q.toLowerCase();
  const hits = catalog
    .filter((p) =>
      `${p.title} ${p.district} ${p.municipality} ${p.parish} ${p.typology} ${p.purpose}`
        .toLowerCase()
        .includes(qq),
    )
    .slice(0, 3);

  if (!hits.length) return null;

  const lines = hits.map(
    (p) =>
      `• ${p.title} — ${formatEUR(p.priceEur)} (${p.municipality}, ${p.district})`,
  );
  return (
    "Com base no que indicou, estes imóveis podem encaixar no seu perfil:\n" +
    lines.join("\n") +
    "\n\nSe quiser, diga o seu orçamento e o concelho preferido para eu afinar e sugerir visitas."
  );
}

function classifyEscalation(q: string) {
  const redFlags = ["contrato", "juríd", "hipoteca", "IMT", "escritura", "reclama"];
  if (redFlags.some((k) => q.toLowerCase().includes(k))) {
    return (
      "Para garantir rigor, vou encaminhar este tema para um consultor humano. Pode indicar um telefone e o melhor horário para contacto?"
    );
  }
  return null;
}

export function AIChatWidget() {
  const { state } = useAppStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o agente de IA da AtlasCasa (demo). Posso recomendar imóveis, ajudar a qualificar o seu pedido e sugerir próximos passos. O que procura?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickChips = useMemo(
    () => [
      "T2 em Lisboa até 450.000€",
      "Moradia em Cascais",
      "Arrendamento T1 perto da praia",
    ],
    [],
  );

  function reply(userText: string) {
    const escalation = classifyEscalation(userText);
    if (escalation) return escalation;

    const suggestion = suggestFromCatalog(userText, state.catalog);
    if (suggestion) return suggestion;

    return (
      "Perfeito — para eu recomendar com precisão, diga: distrito/concelho, tipologia (T1–T5), orçamento e se é venda ou arrendamento. Depois sugiro 3 opções e proponho marcação de visita."
    );
  }

  function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: t }, { role: "assistant", content: reply(t) }]);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="rounded-full shadow-md">
            <Sparkles className="h-4 w-4" />
            IA
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md rounded-l-3xl">
          <SheetHeader>
            <SheetTitle className="tracking-tight">Agente de IA</SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickChips.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="text-xs rounded-full bg-secondary px-3 py-1.5 text-muted-foreground hover:text-foreground transition"
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 h-[55vh] overflow-auto rounded-3xl border bg-card p-3">
            <div className="grid gap-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    m.role === "user"
                      ? "ml-10 rounded-3xl bg-primary text-primary-foreground p-3"
                      : "mr-10 rounded-3xl bg-secondary p-3"
                  }
                >
                  <div className="text-xs opacity-80">
                    {m.role === "user" ? "Você" : "AtlasCasa IA"}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.content}
                  </div>
                  {m.role === "assistant" && idx === 0 && (
                    <div className="mt-2">
                      <Badge className="rounded-full bg-accent text-accent-foreground ring-1 ring-accent/50">
                        Usa apenas dados do catálogo (demo)
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-11 rounded-2xl"
              placeholder="Escreva a sua pergunta…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button className="h-11 rounded-2xl" onClick={() => send()}>
              Enviar
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Modo demonstração: respostas heurísticas. Integração OpenAI + Supabase Edge
            Functions pode substituir esta lógica sem alterar a UI.
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
