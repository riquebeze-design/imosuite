import { useMemo } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAppStore } from "@/state/AppStore";
import { getRecommendedProperties } from "@/lib/recommendation";
import { PropertyCard } from "@/components/PropertyCard";

export function RecommendationCarousel({ title }: { title: string }) {
  const { state } = useAppStore();

  const recommended = useMemo(() => {
    const rec = getRecommendedProperties(state.catalog, state.events, 10);
    return rec.length ? rec : state.catalog.filter((p) => p.featured).slice(0, 8);
  }, [state.catalog, state.events]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Personalizado com base em visualizações, favoritos e contactos (demo).
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent>
            {recommended.map((p) => (
              <CarouselItem key={p.id} className="basis-[85%] sm:basis-1/2 lg:basis-1/3">
                <PropertyCard property={p} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-3 rounded-full" />
          <CarouselNext className="-right-3 rounded-full" />
        </Carousel>
      </div>
    </section>
  );
}
