"use client";

import { FaWhatsapp } from "react-icons/fa";
import { CONTACT_PHONE_NUMBERS } from "@/lib/contact";

export default function WhatsAppButton() {
  const phoneNumber = CONTACT_PHONE_NUMBERS[0].e164;

  return (
    <a
      href={`https://wa.me/${phoneNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp size={26} />
    </a>
  );
}