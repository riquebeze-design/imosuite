import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Property } from "@/types/realestate";
import { formatCompactEUR } from "@/lib/format";
import { Heart, MapPin, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/state/AppStore";

export function PropertyCard({ property }: { property: Property }) {
  const { state, dispatch } = useAppStore();
  const isFav = state.favorites.includes(property.id);
  const isCmp = state.compare.includes(property.id);

  return (
    <Card className="group overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative">
        <Link to={`/imovel/${property.slug}`}>
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="rounded-full bg-background/85 text-foreground ring-1 ring-border">
            {property.purpose}
          </Badge>
          <Badge className="rounded-full bg-primary text-primary-foreground">
            {property.typology}
          </Badge>
        </div>

        <div className="absolute right-3 top-3 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "h-9 w-9 rounded-full bg-background/85 hover:bg-background",
              isFav && "ring-2 ring-primary/40",
            )}
            onClick={() => dispatch({ type: "favorite_toggle", propertyId: property.id })}
            title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={cn("h-4 w-4", isFav && "fill-primary text-primary")} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "h-9 w-9 rounded-full bg-background/85 hover:bg-background",
              isCmp && "ring-2 ring-primary/40",
            )}
            onClick={() => dispatch({ type: "compare_toggle", propertyId: property.id })}
            title={isCmp ? "Remover da comparação" : "Adicionar à comparação"}
          >
            <Scale className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/imovel/${property.slug}`}
              className="block font-semibold tracking-tight leading-snug hover:underline"
            >
              {property.title}
            </Link>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">
                {property.municipality}, {property.district}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tracking-tight">
              {formatCompactEUR(property.priceEur)}
            </div>
            <div className="text-xs text-muted-foreground">
              {property.areaM2} m² • {property.energyRating}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {property.highlights.slice(0, 3).map((h) => (
            <span
              key={h}
              className="text-xs rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
