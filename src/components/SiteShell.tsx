import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { Heart, LayoutGrid, Scale, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatWidget } from "@/components/AIChatWidget";
import { getBrandSettings, subscribeBrandSettings } from "@/lib/brandSettings";

function TopNavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
        )
      }
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{children}</span>
    </NavLink>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState(() => getBrandSettings());

  useEffect(() => {
    return subscribeBrandSettings(() => setBrand(getBrandSettings()));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="shrink-0">
            <BrandMark />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <TopNavLink to="/imoveis" icon={<LayoutGrid className="h-4 w-4" />}>
              Imóveis
            </TopNavLink>
            <TopNavLink to="/favoritos" icon={<Heart className="h-4 w-4" />}>
              Favoritos
            </TopNavLink>
            <TopNavLink to="/comparar" icon={<Scale className="h-4 w-4" />}>
              Comparar
            </TopNavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="rounded-full" variant="secondary">
              <Link to="/crm">
                <Sparkles className="h-4 w-4" />
                Área interna
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-3">
            <BrandMark />
            <p className="text-sm text-muted-foreground max-w-sm">
              Plataforma institucional + CRM para uma imobiliária em Portugal. Dados de
              demonstração baseados em distritos e concelhos.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Site</div>
            <div className="text-sm text-muted-foreground">
              <Link className="hover:text-foreground" to="/imoveis">
                Pesquisa de imóveis
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link className="hover:text-foreground" to="/favoritos">
                Favoritos
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link className="hover:text-foreground" to="/comparar">
                Comparação
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Contacto</div>
            <div className="text-sm text-muted-foreground">{brand.company.email}</div>
            <div className="text-sm text-muted-foreground">{brand.company.phone}</div>
            <div className="text-sm text-muted-foreground">{brand.company.address}</div>
            <div className="text-xs text-muted-foreground">
              Demonstração • RGPD: não use dados pessoais reais.
            </div>
          </div>
        </div>
      </footer>

      <AIChatWidget />
    </div>
  );
}