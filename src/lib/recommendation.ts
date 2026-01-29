import type { Property } from "@/types/realestate";

export type PropertyEventType = "view" | "favorite" | "contact" | "compare";

export type PropertyEvent = {
  type: PropertyEventType;
  propertyId: string;
  at: string;
};

export function scorePropertyForUser(
  property: Property,
  events: PropertyEvent[],
  catalog: Property[],
) {
  const byId = new Map(catalog.map((p) => [p.id, p] as const));
  const recent = [...events].slice(-40);

  const likedIds = new Set(
    recent
      .filter((e) => e.type === "favorite" || e.type === "contact")
      .map((e) => e.propertyId),
  );

  const viewed = recent
    .filter((e) => e.type === "view")
    .map((e) => byId.get(e.propertyId))
    .filter(Boolean) as Property[];

  const anchors = [
    ...Array.from(likedIds)
      .map((id) => byId.get(id))
      .filter(Boolean),
    ...viewed.slice(-5),
  ] as Property[];

  if (!anchors.length) return 0;

  // Similaridade leve: localização + tipologia + finalidade + faixa de preço
  let score = 0;
  for (const a of anchors) {
    if (a.id === property.id) continue;
    if (a.district === property.district) score += 2;
    if (a.municipality === property.municipality) score += 3;
    if (a.typology === property.typology) score += 2;
    if (a.purpose === property.purpose) score += 1;

    const priceDiff = Math.abs(a.priceEur - property.priceEur);
    const priceBand = Math.max(15000, a.priceEur * 0.12);
    if (priceDiff < priceBand) score += 2;
    else if (priceDiff < priceBand * 2) score += 1;
  }

  // Bónus de frescura (imóveis featured ficam ligeiramente mais visíveis)
  if (property.featured) score += 1;

  return score;
}

export function getRecommendedProperties(
  catalog: Property[],
  events: PropertyEvent[],
  limit = 8,
) {
  const seen = new Set(events.map((e) => e.propertyId));

  return [...catalog]
    .filter((p) => !seen.has(p.id))
    .map((p) => ({ p, s: scorePropertyForUser(p, events, catalog) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.s > 0)
    .slice(0, limit)
    .map((x) => x.p);
}
