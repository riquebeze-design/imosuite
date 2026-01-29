import { useEffect } from "react";
import { isSupabaseConfigured } from "@/integrations/supabaseClient";
import { loadSiteSettingsFromSupabase } from "@/integrations/siteSettingsRepo";
import { setBrandSettings } from "@/lib/brandSettings";
import { setHeroSettings } from "@/lib/siteSettings";

export function SiteSettingsSyncProvider() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    (async () => {
      const data = await loadSiteSettingsFromSupabase();
      if (cancelled || !data) return;

      if (data.brand) setBrandSettings(data.brand);
      if (data.hero) setHeroSettings(data.hero);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
