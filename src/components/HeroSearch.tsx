import { useEffect, useMemo, useState } from "react";
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
import {
  DISTRICTS,
  MUNICIPALITIES_BY_DISTRICT,
  PARISHES_BY_MUNICIPALITY,
} from "@/data/ptLocations";
import type { District, Purpose, Typology } from "@/types/realestate";
import { Search } from "lucide-react";
import { getHeroSettings, subscribeHeroSettings } from "@/lib/siteSettings";
import { cn } from "@/lib/utils";

const PURPOSES: Purpose[] = ["Venda", "Arrendamento"];
const TYPOLOGIES: Typology[] = ["T1", "T2", "T3", "T4", "T5"];

export function HeroSearch() {
  const nav = useNavigate();

  const [hero, setHero] = useState(() => getHeroSettings());
  const [activeIdx, setActiveIdx] = useState(0);

  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<District | "">("");
  const [municipality, setMunicipality] = useState<string>("");
  const [parish, setParish] = useState<string>("");
  const [purpose, setPurpose] = useState<Purpose | "">("");
  const [typology, setTypology] = useState<Typology | "">("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    return subscribeHeroSettings(() => setHero(getHeroSettings()));
  }, []);

  useEffect(() => {
    if (hero.mode !== "images") return;
    if (!hero.images?.length) return;
    const t = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % hero.images.length);
    }, 6500);
    return () => window.clearInterval(t);
  }, [hero.images, hero.mode]);

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
    <section className="relative overflow-hidden">
      {/* Media de fundo */}
      <div className="absolute inset-0">
        {hero.mode === "video" && hero.videoUrl ? (
          <video
            className="h-full w-full object-cover"
            src={hero.videoUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="h-full w-full">
            {(hero.images?.length ? hero.images : [""]).map((src, idx) => (
              <img
                key={`${src}_${idx}`}
                src={src}
                alt=""
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                  idx === (activeIdx % Math.max(hero.images.length, 1))
                    ? "opacity-100"
                    : "opacity-0",
                )}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
        )}
        {/* overlay sólido (sem gradientes) */}
        <div className="absolute inset-0 bg-background/55" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-10 md:pt-16">
        <div className="min-h-[540px] grid items-center">
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-end">
            {/* Headline centrada */}
            <div className="text-center md:text-left">
              <div className="mx-auto md:mx-0 max-w-2xl rounded-[2rem] border bg-background/70 backdrop-blur p-6 md:p-7 shadow-sm">
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                  {hero.headline}
                </h1>
                {hero.subheadline && (
                  <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                    {hero.subheadline}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
                  <Button
                    className="rounded-2xl"
                    onClick={() => nav("/imoveis")}
                  >
                    Ver imóveis
                  </Button>
                  <Button
                    className="rounded-2xl"
                    variant="secondary"
                    onClick={() => nav("/crm")}
                  >
                    Área interna
                  </Button>
                </div>
              </div>
            </div>

            {/* Pesquisa */}
            <Card className="rounded-3xl border bg-background/80 backdrop-blur shadow-sm p-4 md:p-5">
              <div className="grid gap-3">
                <div className="grid gap-2 md:grid-cols-[1fr_0.8fr]">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ex.: Arroios, T2, Cascais…"
                    className="h-11 rounded-2xl"
                  />
                  <Select
                    value={purpose}
                    onValueChange={(v) => setPurpose(v as Purpose)}
                  >
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
                  Dica: no CRM, pode definir o vídeo/fotos e a headline deste Hero.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}