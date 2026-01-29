import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { useAppStore } from "@/state/AppStore";
import { PropertyGrid } from "@/components/PropertyGrid";
import { useSeo } from "@/lib/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function FavoritesPage() {
  useSeo({ title: "Favoritos — AtlasCasa" });
  const { state } = useAppStore();

  const favorites = useMemo(() => {
    const set = new Set(state.favorites);
    return state.catalog.filter((p) => set.has(p.id));
  }, [state.catalog, state.favorites]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Favoritos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guarde imóveis para voltar mais tarde e receber recomendações melhores.
        </p>

        <div className="mt-6">
          {favorites.length ? (
            <PropertyGrid properties={favorites} />
          ) : (
            <Card className="rounded-3xl border bg-card p-6">
              <div className="text-lg font-semibold">Ainda não tem favoritos</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore o catálogo e clique no coração para guardar.
              </p>
              <Button asChild className="mt-4 rounded-2xl">
                <Link to="/imoveis">Ver imóveis</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
