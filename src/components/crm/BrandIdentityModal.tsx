import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  applyBrandToDocument,
  getBrandSettings,
  setBrandSettings,
  type BrandSettings,
} from "@/lib/brandSettings";
import { hexToHslVars, hslVarsToCss } from "@/lib/color";
import { isSupabaseConfigured, supabase } from "@/integrations/supabaseClient";
import { Paintbrush, Upload } from "lucide-react";
import { upsertSiteSettingsToSupabase } from "@/integrations/siteSettingsRepo";

const BUCKET = "site-media";

function filePath(prefix: string, name: string) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${prefix}/${Date.now()}_${safe}`;
}

async function uploadLogo(file: File) {
  if (!supabase) throw new Error("Supabase não configurado");
  const path = filePath("brand/logo", file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Falha ao obter URL do logotipo");
  return data.publicUrl;
}

const FONT_PRESETS = [
  {
    id: "redhat",
    label: "Red Hat Virtual",
    value:
      '"Red Hat Virtual", "Red Hat Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  },
  {
    id: "dmsans",
    label: "DM Sans",
    value:
      '"DM Sans", "Red Hat Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  },
  {
    id: "poppins",
    label: "Poppins",
    value:
      '"Poppins", "Red Hat Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  },
];

export function BrandIdentityModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BrandSettings>(() => getBrandSettings());
  const [saving, setSaving] = useState(false);

  // re-sync draft every time it opens
  useEffect(() => {
    if (!open) return;
    setDraft(getBrandSettings());
  }, [open]);

  const canUpload = useMemo(() => isSupabaseConfigured(), []);

  async function save() {
    setSaving(true);
    try {
      // 1) persist local
      setBrandSettings(draft);
      applyBrandToDocument(draft);

      // 2) persist Supabase
      if (isSupabaseConfigured()) {
        await upsertSiteSettingsToSupabase({ brand: draft });
      }

      toast({ title: "Identidade visual actualizada" });
      setOpen(false);
    } catch (e) {
      toast({
        title: "Falha ao guardar",
        description:
          e instanceof Error
            ? e.message
            : "Verifique tabela site_settings e policies (RLS).",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function setHex(field: keyof BrandSettings["theme"], hex: string) {
    const hsl = hexToHslVars(hex);
    setDraft((d) => ({
      ...d,
      theme: {
        ...d.theme,
        [field]: hsl,
      },
    }));
  }

  const logoSize = Math.max(24, Math.min(96, draft.company.logoSizePx || 36));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl" variant="secondary">
          <Paintbrush className="h-4 w-4" />
          Identidade visual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Identidade visual</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="rounded-2xl bg-secondary p-1">
            <TabsTrigger value="brand" className="rounded-2xl">
              Empresa
            </TabsTrigger>
            <TabsTrigger value="theme" className="rounded-2xl">
              Tema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Card className="rounded-[2rem] border bg-card p-4">
                <div className="text-sm font-semibold tracking-tight">Dados da empresa</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Estes dados aparecem no header/footer.
                </p>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2">
                    <Label>Nome</Label>
                    <Input
                      className="h-11 rounded-2xl"
                      value={draft.company.name}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          company: { ...d.company, name: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Tagline</Label>
                    <Input
                      className="h-11 rounded-2xl"
                      value={draft.company.tagline}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          company: { ...d.company, tagline: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>E-mail</Label>
                      <Input
                        className="h-11 rounded-2xl"
                        value={draft.company.email}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            company: { ...d.company, email: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Telefone</Label>
                      <Input
                        className="h-11 rounded-2xl"
                        value={draft.company.phone}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            company: { ...d.company, phone: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Morada</Label>
                    <Textarea
                      className="rounded-2xl min-h-20"
                      value={draft.company.address}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          company: { ...d.company, address: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem] border bg-card p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold tracking-tight">Logotipo</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Carregue um SVG/PNG ou cole um URL.
                    </p>
                  </div>
                  <Badge className="rounded-full bg-secondary text-muted-foreground">
                    bucket: {BUCKET}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="overflow-hidden rounded-3xl border bg-background grid place-items-center"
                    style={{ width: logoSize + 20, height: logoSize + 20 }}
                  >
                    {draft.company.logoUrl ? (
                      <img
                        src={draft.company.logoUrl}
                        alt="Logo"
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-lg bg-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold tracking-tight truncate">
                      {draft.company.name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {draft.company.tagline}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <Label>Tamanho da área do logotipo</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[logoSize]}
                      min={24}
                      max={96}
                      step={1}
                      onValueChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          company: { ...d.company, logoSizePx: v[0] },
                        }))
                      }
                    />
                    <Badge className="rounded-full bg-secondary text-muted-foreground">
                      {logoSize}px
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aplica-se ao header e ao footer.
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <Label>URL do logotipo</Label>
                  <Input
                    className="h-11 rounded-2xl"
                    value={draft.company.logoUrl ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        company: { ...d.company, logoUrl: e.target.value },
                      }))
                    }
                    placeholder="https://…"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button asChild className="rounded-2xl" variant="secondary">
                    <label className="cursor-pointer">
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*,image/svg+xml"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (!canUpload) {
                            toast({
                              title: "Upload indisponível",
                              description:
                                "Configure Supabase Storage/policies para carregar ficheiros.",
                              variant: "destructive",
                            });
                            return;
                          }
                          try {
                            const url = await uploadLogo(f);
                            setDraft((d) => ({
                              ...d,
                              company: { ...d.company, logoUrl: url },
                            }));
                            toast({ title: "Logotipo carregado" });
                          } catch (err) {
                            toast({
                              title: "Falha no upload",
                              description:
                                err instanceof Error
                                  ? err.message
                                  : "Verifique bucket/policies do Storage.",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <Upload className="h-4 w-4" />
                      Carregar logotipo
                    </label>
                  </Button>
                  {!canUpload && (
                    <span className="text-xs text-muted-foreground">
                      (requer Supabase Storage)
                    </span>
                  )}
                  <Button
                    className="rounded-2xl"
                    variant="secondary"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        company: { ...d.company, logoUrl: undefined },
                      }))
                    }
                  >
                    Remover
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="rounded-3xl border bg-background p-4">
                  <div className="text-sm font-semibold tracking-tight">Pré-visualização</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="rounded-3xl border bg-background grid place-items-center overflow-hidden"
                      style={{ width: logoSize, height: logoSize }}
                    >
                      {draft.company.logoUrl ? (
                        <img
                          src={draft.company.logoUrl}
                          alt="Logo"
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-md bg-primary" />
                      )}
                    </div>
                    <div className="leading-none min-w-0">
                      <div className="text-[15px] font-semibold tracking-tight truncate">
                        {draft.company.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {draft.company.tagline}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Card className="rounded-[2rem] border bg-card p-4">
                <div className="text-sm font-semibold tracking-tight">Cores</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajuste a identidade visual do site. (Sem gradientes.)
                </p>

                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label>Background</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-12 rounded-xl border bg-background"
                        onChange={(e) => setHex("background", e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {draft.theme.background}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Foreground</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-12 rounded-xl border bg-background"
                        onChange={(e) => setHex("foreground", e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {draft.theme.foreground}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Primary</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-12 rounded-xl border bg-background"
                        onChange={(e) => setHex("primary", e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {draft.theme.primary}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Accent</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-12 rounded-xl border bg-background"
                        onChange={(e) => setHex("accent", e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {draft.theme.accent}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Radius</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[draft.theme.radiusRem]}
                        min={0.5}
                        max={1.6}
                        step={0.05}
                        onValueChange={(v) =>
                          setDraft((d) => ({
                            ...d,
                            theme: { ...d.theme, radiusRem: v[0] },
                          }))
                        }
                      />
                      <Badge className="rounded-full bg-secondary text-muted-foreground">
                        {draft.theme.radiusRem.toFixed(2)}rem
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Fonte</Label>
                    <div className="flex flex-wrap gap-2">
                      {FONT_PRESETS.map((f) => {
                        const active = draft.theme.fontSans === f.value;
                        return (
                          <button
                            key={f.id}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                theme: { ...d.theme, fontSans: f.value },
                              }))
                            }
                            className={
                              active
                                ? "text-xs rounded-full bg-primary px-3 py-1.5 text-primary-foreground"
                                : "text-xs rounded-full bg-secondary px-3 py-1.5 text-muted-foreground hover:text-foreground"
                            }
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avançado: pode editar o valor completo (font-family).
                    </div>
                    <Input
                      className="h-11 rounded-2xl"
                      value={draft.theme.fontSans}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          theme: { ...d.theme, fontSans: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem] border bg-card p-4">
                <div className="text-sm font-semibold tracking-tight">Pré-visualização</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mostra como o site ficará com estas cores.
                </p>

                <div
                  className="mt-4 rounded-[2rem] border p-5"
                  style={{
                    background: hslVarsToCss(draft.theme.background),
                    color: hslVarsToCss(draft.theme.foreground),
                    borderColor: hslVarsToCss(draft.theme.border),
                    borderRadius: `${draft.theme.radiusRem}rem`,
                    fontFamily: draft.theme.fontSans,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold tracking-tight truncate">
                        {draft.company.name}
                      </div>
                      <div style={{ opacity: 0.75 }} className="text-sm truncate">
                        {draft.company.tagline}
                      </div>
                    </div>
                    <button
                      style={{
                        background: hslVarsToCss(draft.theme.primary),
                        color: hslVarsToCss(draft.theme.primaryForeground),
                        borderRadius: `${draft.theme.radiusRem}rem`,
                      }}
                      className="px-4 py-2 text-sm font-semibold"
                    >
                      CTA
                    </button>
                  </div>

                  <div
                    style={{
                      background: hslVarsToCss(draft.theme.accent),
                      color: hslVarsToCss(draft.theme.accentForeground),
                      borderRadius: `${draft.theme.radiusRem}rem`,
                    }}
                    className="mt-4 p-4"
                  >
                    <div className="font-semibold">Cartão / realce</div>
                    <div className="text-sm" style={{ opacity: 0.85 }}>
                      Texto com bom contraste (teste).
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    className="rounded-2xl"
                    onClick={() => setDraft(getBrandSettings())}
                  >
                    Repor
                  </Button>
                  <Button className="rounded-2xl" onClick={save}>
                    Guardar
                  </Button>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Nota: o tema aplica-se via CSS variables (rápido e consistente com shadcn).
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="rounded-2xl"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button className="rounded-2xl" onClick={save} disabled={saving}>
            {saving ? "A guardar…" : "Guardar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}