import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

export function WhatsAppCTAButton({
  agentPhone,
  message,
  className,
}: {
  agentPhone: string;
  message: string;
  className?: string;
}) {
  const href = buildWhatsAppLink(agentPhone, message);
  return (
    <Button asChild className={className ? className : "rounded-2xl"}>
      <a href={href} target="_blank" rel="noreferrer">
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </Button>
  );
}
