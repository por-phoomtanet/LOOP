import type { Metadata } from "next";
import { Archivo, Prompt } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
});

// Prompt คงไว้สำหรับฝั่ง Admin (เหมือนเดิม)
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-prompt",
});

// BM Khaijeaw — ฟอนต์ฝั่ง user (marketplace) ฝังจากไฟล์ local
const khaijeaw = localFont({
  src: [
    { path: "../public/front/BM Khaijeaw Thin.ttf", weight: "100", style: "normal" },
    { path: "../public/front/BM Khaijeaw Light.ttf", weight: "300", style: "normal" },
    { path: "../public/front/BM Khaijeaw.ttf", weight: "400", style: "normal" },
    { path: "../public/front/BM Khaijeaw Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/front/BM Khaijeaw Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-khaijeaw",
  display: "swap",
});

export const metadata: Metadata = {
  title: "renty — Peer-to-Peer Rental Marketplace",
  description: "เช่าอะไรก็ได้จากคนใกล้ตัวคุณ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${prompt.variable} ${khaijeaw.variable}`}>
      <body>{children}</body>
    </html>
  );
}
