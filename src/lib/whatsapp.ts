import { CONTACT_PHONE_NUMBERS } from "./contact";

/**
 * Returns the primary business WhatsApp number in E.164 digits-only format.
 */
export function getWhatsAppBusinessE164(): string {
  return CONTACT_PHONE_NUMBERS[0].e164;
}

export function buildWhatsAppUrl(message: string): string {
  const phone = getWhatsAppBusinessE164();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
