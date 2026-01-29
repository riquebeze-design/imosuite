import { storage } from "@/lib/storage";

export type HeroMediaMode = "images" | "video";

export type HeroSettings = {
  headline: string;
  subheadline?: string;
  mode: HeroMediaMode;
  images: string[];
  videoUrl?: string;
};

const KEY = "atlascasa:hero";

export function getHeroSettings(): HeroSettings {
  return storage.get<HeroSettings>(KEY, {
    headline: "Encontre o imóvel certo em Portugal",
    subheadline:
      "Pesquisa por distrito e concelho, contacte por WhatsApp e acompanhe leads no CRM.",
    mode: "images",
    images: [
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=2000&q=80",
    ],
    videoUrl: undefined,
  });
}

export function setHeroSettings(next: HeroSettings) {
  storage.set(KEY, next);
  // Atualização imediata no mesmo separador
  window.dispatchEvent(new Event("atlascasa:hero"));
}

export function subscribeHeroSettings(cb: () => void) {
  const onLocal = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };

  window.addEventListener("atlascasa:hero", onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("atlascasa:hero", onLocal);
    window.removeEventListener("storage", onStorage);
  };
}
