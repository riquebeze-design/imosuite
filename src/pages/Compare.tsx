import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { useAppStore } from "@/state/AppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatEUR } from "@/lib/format";
import { useSeo } from "@/lib/seo";

export default function ComparePage() {
  useSeo({ title: "Comparar — AtlasCasa" });
  const { state, dispatch } = useAppStore();

  const list = useMemo(() => {
    const set = new Set(state.compare);
    return state.catalog.filter((p) => set.has(p.id));
  }, [state.catalog, state.compare]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Comparação
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare até 4 imóveis lado a lado.
            </p>
          </div>
          <Button
            variant="secondary"
            className="rounded-2xl"
            onClick={() => dispatch({ type: "compare_clear" })}
          >
            Limpar
          </Button>
        </div>

        <div className="mt-6">
          {list.length ? (
            <div className="grid gap-4 lg:grid-cols-4">
              {list.map((p) => (
                <Card key={p.id} className="rounded-3xl border bg-card overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <div className="font-semibold tracking-tight leading-snug">
                      {p.title}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {p.municipality}, {p.district}
                    </div>
                    <div className="mt-3 text-lg font-semibold tracking-tight">
                      {formatEUR(p.priceEur)}
                    </div>

                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2">
                        <span className="text-muted-foreground">Tipologia</span>
                        <span className="font-semibold">{p.typology}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2">
                        <span className="text-muted-foreground">Área</span>
                        <span className="font-semibold">{p.areaM2} m²</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2">
                        <span className="text-muted-foreground">Energia</span>
                        <span className="font-semibold">{p.energyRating}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2">
                        <span className="text-muted-foreground">Finalidade</span>
                        <span className="font-semibold">{p.purpose}</span>
                      </div>
                    </div>

                    <Button asChild className="mt-4 w-full rounded-2xl">
                      <Link to={`/imovel/${p.slug}`}>Ver detalhe</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl border bg-card p-6">
              <div className="text-lg font-semibold">Sem imóveis para comparar</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Adicione imóveis à comparação a partir dos cartões.
              </p>
              <Button asChild className="mt-4 rounded-2xl">
                <Link to="/imoveis">Ir para pesquisa</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
