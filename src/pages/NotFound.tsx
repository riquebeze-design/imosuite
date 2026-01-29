import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Card className="rounded-3xl border bg-card p-8">
          <h1 className="text-3xl font-semibold tracking-tight">Página não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O endereço "{location.pathname}" não existe.
          </p>
          <Button asChild className="mt-6 rounded-2xl">
            <Link to="/">Voltar à Home</Link>
          </Button>
        </Card>
      </section>
    </SiteShell>
  );
};

export default NotFound;