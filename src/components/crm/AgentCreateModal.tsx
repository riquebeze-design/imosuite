import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createAgentInSupabase,
  loadAgentsFromSupabase,
} from "@/integrations/supabaseRepo";
import { isSupabaseConfigured } from "@/integrations/supabaseClient";
import type { AgentRole } from "@/types/realestate";
import { useAppStore } from "@/state/AppStore";
import { UserPlus } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Indique o nome"),
  role: z.enum(["admin", "gestor", "consultor"]),
  email: z.string().email("E-mail inválido"),
  whatsappPhone: z.string().min(9, "Indique um WhatsApp válido"),
  municipalities: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const ROLE_LABEL: Record<AgentRole, string> = {
  admin: "Admin",
  gestor: "Gestor",
  consultor: "Consultor",
};

function parseMunicipalities(value?: string) {
  return (value ?? "")
    .split(/\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AgentCreateModal({ trigger }: { trigger?: React.ReactNode }) {
  const { toast } = useToast();
  const { dispatch, state } = useAppStore();
  const [open, setOpen] = useState(false);

  const canWrite = useMemo(() => isSupabaseConfigured(), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      role: "consultor",
      email: "",
      whatsappPhone: "+351",
      municipalities: "",
    },
  });

  async function submit(values: FormValues) {
    if (!canWrite) {
      toast({
        title: "Supabase não configurado",
        description:
          "Para criar agentes no backend, configure Supabase e policies (RLS).",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAgentInSupabase({
        name: values.name,
        role: values.role,
        email: values.email,
        whatsappPhone: values.whatsappPhone,
        municipalities: parseMunicipalities(values.municipalities),
      });

      const fresh = await loadAgentsFromSupabase();
      if (fresh) {
        dispatch({ type: "hydrate", state: { agents: fresh } } as any);
      }

      toast({
        title: "Agente criado",
        description: "O novo agente foi guardado no Supabase.",
      });
      form.reset();
      setOpen(false);
    } catch (e) {
      toast({
        title: "Falha ao criar agente",
        description:
          e instanceof Error
            ? e.message
            : "Verifique policies (RLS) na tabela agents.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="rounded-2xl">
            <UserPlus className="h-4 w-4" />
            Criar agente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Criar agente</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input className="h-11 rounded-2xl" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Perfil</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as AgentRole)}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["admin", "gestor", "consultor"] as AgentRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>WhatsApp</Label>
              <Input
                className="h-11 rounded-2xl"
                {...form.register("whatsappPhone")}
                placeholder="+3519…"
              />
              {form.formState.errors.whatsappPhone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.whatsappPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input className="h-11 rounded-2xl" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Concelhos (um por linha ou separados por vírgula)</Label>
            <Textarea
              className="rounded-2xl min-h-28"
              {...form.register("municipalities")}
              placeholder="Lisboa\nCascais\nOeiras"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Agentes atuais no sistema: {state.agents.length}
            </p>
            <Button type="submit" className="rounded-2xl">
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}