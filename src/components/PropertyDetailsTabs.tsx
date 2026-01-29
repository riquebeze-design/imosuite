import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/types/realestate";
import { formatEUR } from "@/lib/format";
import { MapPin } from "lucide-react";

function OSMEmbed({ lat, lng }: { lat: number; lng: number }) {
  const bbox = `${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <iframe
        title="Mapa"
        src={src}
        className="h-[320px] w-full"
        loading="lazy"
      />
    </div>
  );
}

export function PropertyDetailsTabs({ property }: { property: Property }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="rounded-2xl bg-secondary p-1">
        <TabsTrigger value="overview" className="rounded-2xl">
          Visão geral
        </TabsTrigger>
        <TabsTrigger value="details" className="rounded-2xl">
          Detalhes
        </TabsTrigger>
        <TabsTrigger value="location" className="rounded-2xl">
          Localização
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {property.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {property.highlights.map((h) => (
                <Badge
                  key={h}
                  className="rounded-full bg-accent text-accent-foreground ring-1 ring-accent/50"
                >
                  {h}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Preço</div>
            <div className="text-2xl font-semibold tracking-tight">
              {formatEUR(property.priceEur)}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-secondary p-3">
                <div className="text-muted-foreground">Área</div>
                <div className="font-semibold">{property.areaM2} m²</div>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <div className="text-muted-foreground">Energia</div>
                <div className="font-semibold">{property.energyRating}</div>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <div className="text-muted-foreground">Quartos</div>
                <div className="font-semibold">{property.bedrooms}</div>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <div className="text-muted-foreground">WC</div>
                <div className="font-semibold">{property.bathrooms}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.parish}, {property.municipality}
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="details" className="mt-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Tipo</div>
            <div className="text-lg font-semibold tracking-tight">{property.kind}</div>
          </div>
          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Finalidade</div>
            <div className="text-lg font-semibold tracking-tight">{property.purpose}</div>
          </div>
          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Tipologia</div>
            <div className="text-lg font-semibold tracking-tight">{property.typology}</div>
          </div>

          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Estacionamento</div>
            <div className="text-lg font-semibold tracking-tight">{property.parking}</div>
          </div>
          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Distrito</div>
            <div className="text-lg font-semibold tracking-tight">{property.district}</div>
          </div>
          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Concelho</div>
            <div className="text-lg font-semibold tracking-tight">
              {property.municipality}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="location" className="mt-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <OSMEmbed lat={property.location.lat} lng={property.location.lng} />
          <div className="rounded-3xl border bg-card p-4">
            <div className="text-sm font-semibold tracking-tight">Morada (zona)</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.parish}, {property.municipality}, {property.district}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Mapa demonstrativo (OpenStreetMap). Para Mapbox, a integração é feita via
              token.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
