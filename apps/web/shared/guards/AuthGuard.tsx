"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="mx-auto flex max-w-[460px] flex-col items-center px-6 py-28 text-center">
        <p className="mb-5 text-[15px] text-black/60">กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้</p>
        <Link
          href="/"
          className="rounded-full bg-[#0a0a0a] px-6 py-3 text-[14px] font-semibold text-white"
        >
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
