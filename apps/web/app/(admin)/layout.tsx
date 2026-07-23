"use client";

import { App as AntdApp, ConfigProvider } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/shared/components/AdminSidebar";
import { useAuthStore } from "@/store/authStore";

const ROLE_LABELS: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  user: "ผู้ใช้ทั่วไป",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleExit() {
    clearAuth();
    router.push("/");
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#3b5bfd", borderRadius: 8 } }}>
      <AntdApp>
        <div className="flex h-screen overflow-hidden bg-[#f7f7f7]">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-14 flex-none items-center justify-end gap-4 border-b border-black/10 bg-white px-6">
              <button
                onClick={handleExit}
                className="border-0 bg-transparent text-[13.5px] text-black/60 hover:text-black"
              >
                ออกจากแอดมิน
              </button>
              <div className="h-8 w-8 flex-none rounded-full bg-black/10" />
              {mounted && user && (
                <span className="whitespace-nowrap text-[13.5px] text-black/70">
                  {user.name}{" "}
                  <span className="text-black/40">({ROLE_LABELS[user.role] ?? user.role})</span>
                </span>
              )}
            </header>
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">{children}</main>
          </div>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
