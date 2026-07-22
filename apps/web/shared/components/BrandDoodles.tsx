/**
 * Hand-drawn brand elements จาก CI ของ renty (LOVE / FREEDOM / TOGETHER / FUN / HAPPY)
 * ใช้ currentColor เพื่อ tint ได้ตามที่วาง
 */
import type { CSSProperties } from "react";

type IconProps = { className?: string; size?: number };

export function HeartDoodle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function SkateboardDoodle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 10.5c3 1.6 14 1.6 17 0" />
      <path d="M4 10.5c-.7.5-.9 1.2-.3 1.7M20 10.5c.7.5.9 1.2.3 1.7" />
      <circle cx="8" cy="15.5" r="1.6" />
      <circle cx="16" cy="15.5" r="1.6" />
    </svg>
  );
}

export function PawDoodle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <ellipse cx="12" cy="15.5" rx="4.2" ry="3.4" />
      <circle cx="6.5" cy="11" r="1.7" />
      <circle cx="10" cy="8.2" r="1.8" />
      <circle cx="14" cy="8.2" r="1.8" />
      <circle cx="17.5" cy="11" r="1.7" />
    </svg>
  );
}

export function StarDoodle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.5 6.9 19.1l1-5.6-4.1-4 5.7-.8z" />
    </svg>
  );
}

/** motion / sparkle lines — สื่อ FUN / HAPPY */
export function SparkleDoodle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M6 6l2 1.5M4.5 11h2.5M6 16l2-1.5M18 6l-2 1.5M19.5 11H17M18 16l-2-1.5" />
    </svg>
  );
}

export function BoneDoodle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 9a2 2 0 1 0-1.7-3 2 2 0 1 0-.3 3.7L14 15.5a2 2 0 1 0 1.7 3 2 2 0 1 0 .3-3.7z" />
    </svg>
  );
}

/**
 * ชั้นตกแต่งลอย — วาง brand element กระจายแบบ CI (ตกแต่งอย่างเดียว, pointer-events-none)
 */
export function ScatterDoodles({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      <HeartDoodle className="text-brand-400/50 absolute left-[4%] top-[12%]" size={26} />
      <StarDoodle className="text-brand-yellow absolute right-[8%] top-[8%]" size={30} />
      <PawDoodle className="text-brand-200 absolute right-[3%] top-[42%]" size={34} />
      <SkateboardDoodle className="text-brand-400/40 absolute bottom-[12%] left-[7%]" size={40} />
      <SparkleDoodle className="text-brand-400/50 absolute bottom-[22%] right-[14%]" size={26} />
      <BoneDoodle className="text-brand-200 absolute left-[46%] top-[6%]" size={22} />
    </div>
  );
}

/** พื้นหลังลาย brand pattern แบบจางๆ (paw + heart + star) */
export const BRAND_PATTERN_STYLE: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%232D5DA8' stroke-opacity='0.08' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M20 22a3 3 0 0 0-4.2 0l-.8.8-.8-.8a3 3 0 1 0-4.2 4.2l5 5 5-5a3 3 0 0 0 0-4.2z'/%3E%3Cpath d='M92 20l1.4 2.9 3.2.5-2.3 2.2.5 3.2L92 29.5l-2.8 1.5.5-3.2-2.3-2.2 3.2-.5z'/%3E%3Cg fill='%232D5DA8' fill-opacity='0.06' stroke='none'%3E%3Cellipse cx='60' cy='86' rx='5' ry='4'/%3E%3Ccircle cx='53' cy='79' r='2'/%3E%3Ccircle cx='57' cy='75' r='2.1'/%3E%3Ccircle cx='63' cy='75' r='2.1'/%3E%3Ccircle cx='67' cy='79' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  backgroundSize: "120px 120px",
};
