import { useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/state/AppStore";
import type { Property } from "@/types/realestate";

const schema = z.object({
  name: z.string().min(2, "Indique o nome"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(9, "Indique um contacto válido"),
  message: z.string().optional(),
  maxBudgetEur: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LeadFormModal({
  property,
  trigger,
}: {
  property?: Property;
  trigger: React.ReactNode;
}) {
  const { toast } = useToast();
  const { dispatch } = useAppStore();

  const defaultMsg = useMemo(() => {
    if (!property) return "Olá! Gostava de obter mais informações.";
    return `Olá! Tenho interesse no imóvel “${property.title}”. Podemos agendar uma visita?`;
  }, [property]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: defaultMsg,
      maxBudgetEur: property ? String(property.priceEur) : "",
    },
  });

  function submit(values: FormValues) {
    const maxBudgetEur = values.maxBudgetEur
      ? Number(values.maxBudgetEur.replace(/\D/g, ""))
      : undefined;

    dispatch({
      type: "lead_create_request",
      lead: {
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        propertyId: property?.id,
        maxBudgetEur,
        preferredDistrict: property?.district,
        preferredMunicipality: property?.municipality,
        preferredTypology: property?.typology,
      },
    } as any);

    if (property) {
      dispatch({
        type: "event_add",
        event: {
          type: "contact",
          propertyId: property.id,
          at: new Date().toISOString(),
        },
      });
    }

    toast({
      title: "Pedido enviado",
      description:
        "Recebemos o seu contacto. Um consultor irá responder em breve.",
    });

    form.reset();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="tracking-tight">
            {property ? "Contactar sobre este imóvel" : "Contactar"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(submit)}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input className="h-11 rounded-2xl" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input className="h-11 rounded-2xl" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
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
            <Label>Orçamento (opcional)</Label>
            <Input
              className="h-11 rounded-2xl"
              inputMode="numeric"
              placeholder="Ex.: 450000"
              {...form.register("maxBudgetEur")}
            />
          </div>

          <div className="grid gap-2">
            <Label>Mensagem</Label>
            <Textarea
              className="min-h-28 rounded-2xl"
              {...form.register("message")}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" className="rounded-2xl">
              Enviar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}