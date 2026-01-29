import { useEffect, useState } from "react";
import { getBrandSettings, subscribeBrandSettings } from "@/lib/brandSettings";

export function BrandMark() {
  const [brand, setBrand] = useState(() => getBrandSettings());

  useEffect(() => {
    return subscribeBrandSettings(() => setBrand(getBrandSettings()));
  }, []);

  const logoUrl = brand.company.logoUrl;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-9 w-9 rounded-2xl bg-primary/10 ring-1 ring-primary/15 grid place-items-center overflow-hidden shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={brand.company.name}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <div className="h-4 w-4 rounded-md bg-primary" />
        )}
      </div>
      <div className="leading-none min-w-0">
        <div className="text-[15px] font-semibold tracking-tight truncate">
          {brand.company.name}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {brand.company.tagline}
        </div>
      </div>
    </div>
  );
}