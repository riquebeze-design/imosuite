import { useEffect, useState } from "react";
import {
  applyBrandToDocument,
  getBrandSettings,
  subscribeBrandSettings,
} from "@/lib/brandSettings";

export function BrandStyleProvider() {
  const [settings, setSettings] = useState(() => getBrandSettings());

  useEffect(() => {
    applyBrandToDocument(settings);
  }, [settings]);

  useEffect(() => {
    return subscribeBrandSettings(() => setSettings(getBrandSettings()));
  }, []);

  return null;
}
