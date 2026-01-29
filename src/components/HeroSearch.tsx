import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DISTRICTS,
  MUNICIPALITIES_BY_DISTRICT,
  PARISHES_BY_MUNICIPALITY,
} from "@/data/ptLocations";
import type { District, Purpose, Typology } from "@/types/realestate";
import { Search } from "lucide-react";

const PURPOSES: Purpose[] = ["Venda", "Arrendamento"];
const TYPOLOGIES: Typology[] = ["T1", "T2", "T3", "T4", "T5"];

export function HeroSearch() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<District | "">("");
  const [municipality, setMunicipality] = useState<string>("");
  const [parish, setParish] = useState<string>("");
  const [purpose, setPurpose] = useState<Purpose | "">("");
  const [typology, setTypology] = useState<Typology | "">("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const municipalities = useMemo(() => {
    if (!district) return [];
    return MUNICIPALITIES_BY_DISTRICT[district];
  }, [district]);

  const parishes = useMemo(() => {
    if (!municipality) return [];
    return PARISHES_BY_MUNICIPALITY[municipality] ?? [];
  }, [municipality]);

  function go() {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (district) sp.set("district", district);
    if (municipality) sp.set("municipality", municipality);
    if (parish) sp.set("parish", parish);
    if (purpose) sp.set("purpose", purpose);
    if (typology) sp.set("typology", typology);
    if (priceMin.trim()) sp.set("priceMin", priceMin.trim());
    if (priceMax.trim()) sp.set("priceMax", priceMax.trim());
    nav(`/imoveis?${sp.toString()}`);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14">
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div className="space-y-5">
          <Badge className="rounded-full px-3 py-1 bg-accent text-accent-foreground ring-1 ring-accent/60">
            Catálogo com dados mock (Portugal)
          </Badge>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Encontre o imóvel certo —
            <span className="text-primary"> com pesquisa por distrito e concelho</span>.
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Uma experiência premium para clientes e uma área interna com CRM e automações
            para consultores.
          </p>
        </div>

        <Card className="rounded-3xl border bg-card shadow-sm p-4 md:p-5">
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-[1fr_0.8fr]">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex.: Arroios, T2, Cascais…"
                className="h-11 rounded-2xl"
              />
              <Select value={purpose} onValueChange={(v) => setPurpose(v as Purpose)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Finalidade" />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <Select
                value={district}
                onValueChange={(v) => {
                  setDistrict(v as District);
                  setMunicipality("");
                  setParish("");
                }}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Distrito" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={municipality}
                onValueChange={(v) => {
                  setMunicipality(v);
                  setParish("");
                }}
                disabled={!district}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Concelho" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={typology}
                onValueChange={(v) => setTypology(v as Typology)}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Tipologia" />
                </SelectTrigger>
                <SelectContent>
                  {TYPOLOGIES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Select
                value={parish}
                onValueChange={(v) => setParish(v)}
                disabled={!municipality}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Freguesia" />
                </SelectTrigger>
                <SelectContent>
                  {parishes.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  inputMode="numeric"
                  placeholder="Preço mín."
                  className="h-11 rounded-2xl"
                />
                <Input
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  inputMode="numeric"
                  placeholder="Preço máx."
                  className="h-11 rounded-2xl"
                />
              </div>

              <Button
                onClick={go}
                className="h-11 rounded-2xl px-4"
                title="Pesquisar"
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Pesquisar</span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Dica: use a pesquisa para filtrar e, no detalhe, contacte via WhatsApp.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}