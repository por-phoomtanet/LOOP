import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants";
import {
  HeartDoodle,
  PawDoodle,
  SkateboardDoodle,
  SparkleDoodle,
  StarDoodle,
} from "./BrandDoodles";

// สีส้มของ CI — accent อุ่นแทรกในโทนเย็น
const ORANGE = "#e08a63";

// filter สำหรับย้อมโลโก้ (line-art น้ำเงิน) ให้เป็นครีม #FFF7EB บนพื้นน้ำเงิน
const CREAM_LOGO_FILTER =
  "brightness(0) saturate(100%) invert(96%) sepia(13%) saturate(220%) hue-rotate(314deg) brightness(104%) contrast(98%)";

const VALUES = [
  { icon: HeartDoodle, label: "LOVE", th: "ด้วยความรัก" },
  { icon: SkateboardDoodle, label: "FREEDOM", th: "อย่างอิสระ" },
  { icon: PawDoodle, label: "TOGETHER", th: "ไปด้วยกัน" },
];

const LINK_COLUMNS = [
  {
    title: "สำรวจ",
    links: [
      { label: "หน้าแรก", href: ROUTES.home },
      { label: "ช้อป", href: ROUTES.shop },
      { label: "ลงประกาศให้เช่า", href: ROUTES.listItem },
    ],
  },
  {
    title: "ช่วยเหลือ",
    links: [
      { label: "วิธีใช้งาน", href: "#" },
      { label: "ความปลอดภัย", href: "#" },
      { label: "ศูนย์ช่วยเหลือ", href: "#" },
    ],
  },
  {
    title: "เกี่ยวกับ",
    links: [
      { label: "เกี่ยวกับเรา", href: "#" },
      { label: "ความคุ้มครอง", href: "#" },
      { label: "ติดต่อเรา", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-brand-600 relative mt-20 overflow-hidden text-white">
      {/* ของตกแต่ง brand doodles จางๆ */}
      <PawDoodle className="absolute -right-5 top-10 text-white/10" size={130} />
      <SkateboardDoodle className="absolute -left-6 bottom-8 text-white/10" size={140} />
      <StarDoodle className="absolute right-[28%] top-12 text-white/10" size={40} />
      <HeartDoodle className="absolute left-[38%] top-8 text-white/10" size={30} />
      <SparkleDoodle className="absolute bottom-[26%] right-[16%] text-white/10" size={30} />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-8 py-14">
        {/* values band */}
        <div className="mb-12 grid gap-4 border-b border-white/15 pb-12 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, label, th }) => (
            <div key={label} className="flex items-center gap-3.5">
              <span
                className="bg-brand-50 flex h-11 w-11 flex-none items-center justify-center rounded-full"
                style={{ color: ORANGE }}
              >
                <Icon size={22} />
              </span>
              <div>
                <div className="font-arch text-[15px] font-extrabold tracking-[.06em] text-white">
                  {label}
                </div>
                <div className="text-[13px] text-white/60">{th}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Image
              src="/brand/renty-logo-full.png"
              alt="renty — ride together, stay happy"
              width={200}
              height={140}
              className="h-auto w-[168px] object-contain"
              style={{ filter: CREAM_LOGO_FILTER }}
            />
            <p className="mt-3 text-[13.5px] font-semibold italic" style={{ color: ORANGE }}>
              ride together, stay happy 🐾
            </p>
            <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-white/65">
              แพลตฟอร์มให้เช่าสินค้าระหว่างบุคคล เช่าอะไรก็ได้จากคนใกล้ตัว — ปลอดภัย ยืนยันตัวตน
              คุ้มครองทุกการเช่า
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINK_COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-3 text-[13px] font-bold text-white">{col.title}</div>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-white/60 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-6 text-[12.5px] text-white/50">
          <span>© 2026 renty · สงวนลิขสิทธิ์</span>
          <span>
            ทำด้วย <span style={{ color: ORANGE }}>♥</span> เพื่อชุมชนคนชอบเช่า
          </span>
        </div>
      </div>
    </footer>
  );
}
