import type { Metadata } from "next";
import { Quicksand, JetBrains_Mono } from "next/font/google";
import WhatsAppButton from "@/components/WhatsAppButton/WhatsAppButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: "Kason Motors",
  description: "Kason Motors - Your trusted car dealer",
  icons: {
    icon: [{ url: "/logo-nobg.png", type: "image/png" }],
    apple: "/logo-nobg.png",
  },
};

const fontSans = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
