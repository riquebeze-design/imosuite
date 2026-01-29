import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useAppStore } from "@/state/AppStore";
import { searchProperties } from "@/lib/search";
import { PropertyGrid } from "@/components/PropertyGrid";
import { useSeo } from "@/lib/seo";
import { Search, SlidersHorizontal } from "lucide-react";

const PURPOSES: Purpose[] = ["Venda", "Arrendamento"];
const TYPOLOGIES: Typology[] = ["T1", "T2", "T3", "T4", "T5"];

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PropertiesPage() {
  useSeo({
    title: "Imóveis — AtlasCasa",
    description:
      "Pesquisa avançada por distrito, concelho, freguesia, tipologia e preço.",
  });

  const { state } = useAppStore();
  const query = useQuery();

  const [q, setQ] = useState(query.get("q") ?? "");
  const [district, setDistrict] = useState<District | "">(
    (query.get("district") as District) ?? "",
  );
  const [municipality, setMunicipality] = useState(query.get("municipality") ?? "");
  const [parish, setParish] = useState(query.get("parish") ?? "");
  const [purpose, setPurpose] = useState<Purpose | "">(
    (query.get("purpose") as Purpose) ?? "",
  );
  const [typology, setTypology] = useState<Typology | "">(
    (query.get("typology") as Typology) ?? "",
  );
  const [priceMin, setPriceMin] = useState(query.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(query.get("priceMax") ?? "");

  const municipalities = useMemo(() => {
    if (!district) return [];
    return MUNICIPALITIES_BY_DISTRICT[district];
  }, [district]);

  const parishes = useMemo(() => {
    if (!municipality) return [];
    return PARISHES_BY_MUNICIPALITY[municipality] ?? [];
  }, [municipality]);

  const results = useMemo(() => {
    const pm = priceMin ? Number(priceMin.replace(/\D/g, "")) : undefined;
    const px = priceMax ? Number(priceMax.replace(/\D/g, "")) : undefined;

    return searchProperties(state.catalog, {
      q,
      district: district || undefined,
      municipality: municipality || undefined,
      parish: parish || undefined,
      purpose: purpose || undefined,
      typology: typology || undefined,
      priceMin: pm,
      priceMax: px,
    });
  }, [
    district,
    municipality,
    parish,
    priceMax,
    priceMin,
    purpose,
    q,
    state.catalog,
    typology,
  ]);

  const activeFilters = [
    district,
    municipality,
    parish,
    purpose,
    typology,
    priceMin ? `≥ ${priceMin}` : "",
    priceMax ? `≤ ${priceMax}` : "",
  ].filter(Boolean);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Pesquisa de imóveis
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Filtre por distrito, concelho, freguesia, tipologia e preço.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilters.length ? `${activeFilters.length} filtros` : "Sem filtros"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
          <Card className="rounded-3xl border bg-card p-4 h-fit">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm font-semibold">Pesquisa</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="h-11 rounded-2xl pl-10"
                    placeholder="Ex.: Sintra, T3, moradia…"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-semibold">Finalidade</div>
                <Select
                  value={purpose}
                  onValueChange={(v) => setPurpose(v as Purpose)}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Venda / Arrendamento" />
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

              <div className="grid gap-2">
                <div className="text-sm font-semibold">Localização</div>
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
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-semibold">Tipologia</div>
                <Select
                  value={typology}
                  onValueChange={(v) => setTypology(v as Typology)}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="T1–T5" />
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

              <div className="grid gap-2">
                <div className="text-sm font-semibold">Preço (€)</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-2xl"
                    placeholder="Mín."
                  />
                  <Input
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-2xl"
                    placeholder="Máx."
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {activeFilters.length ? (
                  activeFilters.map((f) => (
                    <Badge
                      key={String(f)}
                      className="rounded-full bg-secondary text-muted-foreground"
                    >
                      {f}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Ajuste filtros para ver resultados.
                  </span>
                )}
              </div>

              <Button
                variant="secondary"
                className="rounded-2xl"
                onClick={() => {
                  setQ("");
                  setDistrict("");
                  setMunicipality("");
                  setParish("");
                  setPurpose("");
                  setTypology("");
                  setPriceMin("");
                  setPriceMax("");
                }}
              >
                Limpar
              </Button>
            </div>
          </Card>

          <div>
            <div className="text-sm text-muted-foreground mb-3">
              {results.length} resultados
            </div>
            <PropertyGrid properties={results} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}