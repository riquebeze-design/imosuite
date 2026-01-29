import type { Property } from "@/types/realestate";
import { PropertyCard } from "@/components/PropertyCard";

export function PropertyGrid({ properties }: { properties: Property[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
