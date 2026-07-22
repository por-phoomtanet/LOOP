import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { BRAND_PATTERN_STYLE, HeartDoodle, PawDoodle, SkateboardDoodle } from "./BrandDoodles";

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
    <footer className="bg-brand-50 relative mt-20 overflow-hidden">
      <div className="absolute inset-0" style={BRAND_PATTERN_STYLE} aria-hidden />

      <div className="relative mx-auto w-full max-w-[1280px] px-8 py-14">
        {/* values band */}
        <div className="border-brand-200 mb-12 grid gap-4 border-b pb-12 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, label, th }) => (
            <div key={label} className="flex items-center gap-3.5">
              <span className="bg-brand-200 text-brand-600 flex h-11 w-11 flex-none items-center justify-center rounded-full">
                <Icon size={22} />
              </span>
              <div>
                <div className="text-brand-600 font-arch text-[15px] font-extrabold tracking-[.06em]">
                  {label}
                </div>
                <div className="text-[13px] text-black/55">{th}</div>
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
            />
            <p className="text-brand-600 mt-3 text-[13.5px] font-semibold italic">
              ride together, stay happy 🐾
            </p>
            <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-black/55">
              แพลตฟอร์มให้เช่าสินค้าระหว่างบุคคล เช่าอะไรก็ได้จากคนใกล้ตัว — ปลอดภัย ยืนยันตัวตน
              คุ้มครองทุกการเช่า
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINK_COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-3 text-[13px] font-bold text-black/80">{col.title}</div>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="hover:text-brand-600 text-[13.5px] text-black/55 transition-colors"
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

        <div className="border-brand-200 mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12.5px] text-black/45">
          <span>© 2026 renty · สงวนลิขสิทธิ์</span>
          <span>ทำด้วย 💙 เพื่อชุมชนคนชอบเช่า</span>
        </div>
      </div>
    </footer>
  );
}
