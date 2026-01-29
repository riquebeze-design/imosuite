import type { District, Property, Purpose, Typology } from "@/types/realestate";

export type PropertySearchFilters = {
  q?: string;
  district?: District;
  municipality?: string;
  parish?: string;
  purpose?: Purpose;
  typology?: Typology;
  priceMin?: number;
  priceMax?: number;
};

export function searchProperties(
  properties: Property[],
  filters: PropertySearchFilters,
) {
  const q = filters.q?.trim().toLowerCase();

  return properties.filter((p) => {
    if (filters.district && p.district !== filters.district) return false;
    if (filters.municipality && p.municipality !== filters.municipality)
      return false;
    if (filters.parish && p.parish !== filters.parish) return false;
    if (filters.purpose && p.purpose !== filters.purpose) return false;
    if (filters.typology && p.typology !== filters.typology) return false;

    if (typeof filters.priceMin === "number" && p.priceEur < filters.priceMin)
      return false;
    if (typeof filters.priceMax === "number" && p.priceEur > filters.priceMax)
      return false;

    if (q) {
      const hay = `${p.title} ${p.district} ${p.municipality} ${p.parish} ${p.kind} ${p.typology}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}
