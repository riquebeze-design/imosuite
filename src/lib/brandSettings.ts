import { storage } from "@/lib/storage";

export type BrandTheme = {
  background: string; // HSL string: "36 33% 98%"
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  radiusRem: number;
  fontSans: string; // CSS font-family value
};

export type CompanyProfile = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  /** Tamanho (largura/altura) da "área" do logotipo, em px */
  logoSizePx: number;
};

export type BrandSettings = {
  theme: BrandTheme;
  company: CompanyProfile;
};

const KEY = "atlascasa:brand";

export function getBrandSettings(): BrandSettings {
  return storage.get<BrandSettings>(KEY, {
    theme: {
      background: "36 33% 98%",
      foreground: "222 47% 11%",
      primary: "216 76% 50%",
      primaryForeground: "210 40% 98%",
      accent: "164 56% 92%",
      accentForeground: "171 55% 18%",
      border: "214 20% 90%",
      radiusRem: 0.9,
      fontSans:
        '"Red Hat Virtual", "Red Hat Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
    },
    company: {
      name: "AtlasCasa",
      tagline: "Imobiliária • Portugal",
      email: "geral@atlascasa.pt",
      phone: "+351 21 000 0000",
      address: "Lisboa, Portugal",
      logoUrl: undefined,
      logoSizePx: 36,
    },
  });
}

export function setBrandSettings(next: BrandSettings) {
  storage.set(KEY, next);
  window.dispatchEvent(new Event("atlascasa:brand"));
}

export function subscribeBrandSettings(cb: () => void) {
  const onLocal = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };

  window.addEventListener("atlascasa:brand", onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("atlascasa:brand", onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

export function applyBrandToDocument(settings: BrandSettings) {
  const r = document.documentElement;
  r.style.setProperty("--background", settings.theme.background);
  r.style.setProperty("--foreground", settings.theme.foreground);
  r.style.setProperty("--primary", settings.theme.primary);
  r.style.setProperty("--primary-foreground", settings.theme.primaryForeground);
  r.style.setProperty("--accent", settings.theme.accent);
  r.style.setProperty("--accent-foreground", settings.theme.accentForeground);
  r.style.setProperty("--border", settings.theme.border);
  r.style.setProperty("--radius", `${settings.theme.radiusRem}rem`);
  r.style.setProperty("--font-sans", settings.theme.fontSans);
}