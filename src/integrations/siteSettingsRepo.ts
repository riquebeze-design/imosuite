import { supabase } from "@/integrations/supabaseClient";
import type { BrandSettings } from "@/lib/brandSettings";
import type { HeroSettings } from "@/lib/siteSettings";

export type SiteSettingsPayload = {
  brand?: BrandSettings;
  hero?: HeroSettings;
};

function assertSupabase() {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

export async function loadSiteSettingsFromSupabase(): Promise<SiteSettingsPayload | null> {
  const sb = assertSupabase();
  const { data, error } = await sb
    .from("site_settings")
    .select("settings")
    .eq("id", "main")
    .maybeSingle();

  if (error) return null;
  const settings = (data?.settings ?? {}) as any;

  return {
    brand: settings.brand as BrandSettings | undefined,
    hero: settings.hero as HeroSettings | undefined,
  };
}

export async function upsertSiteSettingsToSupabase(partial: SiteSettingsPayload) {
  const sb = assertSupabase();

  // Merge client-side para não perder campos
  const current = await loadSiteSettingsFromSupabase();
  const next: SiteSettingsPayload = {
    ...(current ?? {}),
    ...partial,
  };

  const { error } = await sb.from("site_settings").upsert(
    {
      id: "main",
      settings: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}
