import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getHeroSettings,
  setHeroSettings,
  type HeroMediaMode,
  type HeroSettings,
} from "@/lib/siteSettings";
import { isSupabaseConfigured, supabase } from "@/integrations/supabaseClient";
import { ImagePlus, Trash2, Upload, Video } from "lucide-react";

const BUCKET = "site-media";

function filePath(prefix: string, name: string) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${prefix}/${Date.now()}_${safe}`;
}

async function uploadToSupabase(file: File, path: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Falha ao obter URL pública");
  return data.publicUrl;
}

export function HeroMediaManager() {
  const { toast } = useToast();
  const [draft, setDraft] = useState<HeroSettings>(() => getHeroSettings());
  const [imageUrl, setImageUrl] = useState("");

  const canUpload = isSupabaseConfigured();

  const helper = useMemo(() => {
    if (canUpload) {
      return `Uploads para Supabase Storage (bucket: “${BUCKET}”). O bucket deve ser público para o Hero carregar no site.`;
    }
    return "Sem Supabase: pode colar URLs de imagens/vídeo. (Uploads directos requerem Storage.)";
  }, [canUpload]);

  function save() {
    setHeroSettings(draft);
    toast({ title: "Hero actualizado", description: "Alterações aplicadas ao site." });
  }

  async function onAddImages(files: FileList | null) {
    if (!files?.length) return;

    if (!canUpload) {
      toast({
        title: "Uploads indisponíveis",
        description: "Configure Supabase Storage para carregar ficheiros.",
        variant: "destructive",
      });
      return;
    }

    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadToSupabase(f, filePath("hero/images", f.name));
        urls.push(url);
      }
      setDraft((d) => ({ ...d, images: [...urls, ...d.images], mode: "images" }));
      toast({ title: "Imagens carregadas", description: `${urls.length} ficheiro(s).` });
    } catch (e) {
      toast({
        title: "Falha no upload",
        description:
          e instanceof Error
            ? e.message
            : "Verifique bucket/policies do Storage.",
        variant: "destructive",
      });
    }
  }

  async function onAddVideo(file: File | null) {
    if (!file) return;

    if (!canUpload) {
      toast({
        title: "Uploads indisponíveis",
        description: "Configure Supabase Storage para carregar vídeo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await uploadToSupabase(file, filePath("hero/video", file.name));
      setDraft((d) => ({ ...d, videoUrl: url, mode: "video" }));
      toast({ title: "Vídeo carregado", description: "Hero atualizado para vídeo." });
    } catch (e) {
      toast({
        title: "Falha no upload",
        description:
          e instanceof Error
            ? e.message
            : "Verifique bucket/policies do Storage.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="rounded-[2rem] border bg-card p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight">Hero (vídeo/fotos + headline)</div>
          <div className="text-sm text-muted-foreground">{helper}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-secondary text-muted-foreground">
            modo: {draft.mode}
          </Badge>
          <Button className="rounded-2xl" onClick={save}>
            Guardar
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-semibold">Headline</div>
            <Input
              className="h-11 rounded-2xl"
              value={draft.headline}
              onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              placeholder="Headline no centro"
            />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-semibold">Subheadline (opcional)</div>
            <Textarea
              className="rounded-2xl min-h-24"
              value={draft.subheadline ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, subheadline: e.target.value }))
              }
              placeholder="Texto de apoio"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">Modo</div>
            <Select
              value={draft.mode}
              onValueChange={(v) => setDraft((d) => ({ ...d, mode: v as HeroMediaMode }))}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="images">Fotos (slideshow)</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-3xl bg-secondary p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Fotos</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => setDraft((d) => ({ ...d, images: [] }))}
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                className="h-11 rounded-2xl bg-background"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Cole URL de uma imagem (https://…)"
              />
              <Button
                className="rounded-2xl"
                variant="secondary"
                onClick={() => {
                  const u = imageUrl.trim();
                  if (!u) return;
                  setDraft((d) => ({ ...d, images: [u, ...d.images], mode: "images" }));
                  setImageUrl("");
                }}
              >
                <ImagePlus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild className="rounded-2xl" variant="secondary">
                <label className="cursor-pointer">
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onAddImages(e.target.files)}
                  />
                  <Upload className="h-4 w-4" />
                  Carregar fotos
                </label>
              </Button>
              {!canUpload && (
                <span className="text-xs text-muted-foreground">
                  (requer Supabase Storage)
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {draft.images.slice(0, 9).map((src) => (
                <div key={src} className="relative overflow-hidden rounded-2xl border bg-background">
                  <img src={src} alt="" className="h-20 w-full object-cover" />
                  <button
                    className="absolute right-1 top-1 rounded-full bg-background/80 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        images: d.images.filter((x) => x !== src),
                      }))
                    }
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              ))}
              {!draft.images.length && (
                <div className="col-span-3 rounded-2xl border border-dashed bg-background/40 p-4 text-xs text-muted-foreground">
                  Adicione URLs ou carregue fotos.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-secondary p-4">
          <div className="text-sm font-semibold">Vídeo</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina um URL (MP4/WebM) ou carregue para o Storage.
          </p>

          <div className="mt-3 grid gap-2">
            <Input
              className="h-11 rounded-2xl bg-background"
              value={draft.videoUrl ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, videoUrl: e.target.value, mode: "video" }))
              }
              placeholder="https://…/hero.mp4"
            />
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-2xl" variant="secondary">
                <label className="cursor-pointer">
                  <input
                    className="hidden"
                    type="file"
                    accept="video/*"
                    onChange={(e) => onAddVideo(e.target.files?.[0] ?? null)}
                  />
                  <Video className="h-4 w-4" />
                  Carregar vídeo
                </label>
              </Button>
              {!canUpload && (
                <span className="text-xs text-muted-foreground">
                  (requer Supabase Storage)
                </span>
              )}
            </div>

            {draft.videoUrl && (
              <div className="mt-3 overflow-hidden rounded-3xl border bg-background">
                <video
                  src={draft.videoUrl}
                  className="h-48 w-full object-cover"
                  muted
                  playsInline
                  controls
                />
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border bg-background/60 p-3 text-xs text-muted-foreground">
            Dica: crie o bucket <span className="font-medium">{BUCKET}</span> como público para
            o site conseguir carregar os media.
          </div>
        </div>
      </div>
    </Card>
  );
}
