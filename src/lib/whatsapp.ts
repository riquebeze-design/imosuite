export function buildWhatsAppLink(phoneE164: string, message: string) {
  const clean = phoneE164.replace(/\s+/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${encodeURIComponent(clean.replace(/^\+/, ""))}?text=${text}`;
}
