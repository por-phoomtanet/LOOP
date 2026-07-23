import type { Metadata } from "next";
import { Archivo, Prompt } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
});

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "renty — Peer-to-Peer Rental Marketplace",
  description: "เช่าอะไรก็ได้จากคนใกล้ตัวคุณ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${prompt.variable}`}>
      <body>{children}</body>
    </html>
  );
}
