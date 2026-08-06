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

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-14">
        <div className="grid gap-6 md:grid-cols-[1.4fr_2fr] md:gap-10">
          <div>
            <div className="grid grid-cols-3 gap-3 md:flex md:flex-col md:gap-3.5">
              {VALUES.map(({ icon: Icon, label, th }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 text-center md:flex-row md:items-center md:gap-2.5 md:text-left"
                >
                  <span
                    className="bg-brand-50 flex h-8 w-8 flex-none items-center justify-center rounded-full"
                    style={{ color: ORANGE }}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <div className="font-arch text-[11px] font-extrabold tracking-[.04em] text-white md:text-[12.5px]">
                      {label}
                    </div>
                    <div className="text-[10.5px] text-white/60 md:text-[12px]">{th}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center sm:gap-8 md:text-left">
            {LINK_COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-2 text-[13px] font-bold text-white md:mb-3">{col.title}</div>
                <ul className="flex flex-col gap-1.5 md:gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[12.5px] text-white/60 transition-colors hover:text-white md:text-[13.5px]"
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

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-[12.5px] text-white/50 md:mt-8 md:pt-6">
          <span>© 2026 rently · สงวนลิขสิทธิ์</span>
          <span>
            ทำด้วย <span style={{ color: ORANGE }}>♥</span> เพื่อชุมชนคนชอบเช่า
          </span>
        </div>
      </div>
    </footer>
  );
}
