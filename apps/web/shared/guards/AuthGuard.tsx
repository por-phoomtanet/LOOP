"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-[40vh]" />;
  }

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center px-6 py-24 text-center">
        <h1 className="font-arch mb-2 text-[24px] font-extrabold">กรุณาเข้าสู่ระบบ</h1>
        <p className="mb-8 text-[14px] text-black/60">
          คุณต้องเข้าสู่ระบบก่อนจึงจะลงประกาศให้เช่าได้
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-[#0a0a0a] px-8 py-3 text-[14px] font-semibold text-white"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/signup"
            className="rounded-full border-[1.5px] border-black/15 px-8 py-3 text-[14px] font-semibold text-[#0a0a0a]"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
