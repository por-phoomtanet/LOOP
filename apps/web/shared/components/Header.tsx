"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginModal } from "@/modules/auth/components/LoginModal";
import { ROUTES } from "@/constants";
import { useAuthStore } from "@/store/authStore";

type Lang = "th" | "en";

const dict = {
  th: {
    announce: "ทุกการเช่ายืนยันตัวตนและคุ้มครองความเสียหาย — เช่าได้อย่างมั่นใจ",
    navHome: "หน้าแรก",
    navShop: "ช้อป",
    adminNavLabel: "แผงแอดมิน",
    listItem: "ลงประกาศให้เช่า",
    myRentals: "รายการเช่าของฉัน",
    myListings: "รายการปล่อยเช่าของฉัน",
    howItWorks: "วิธีใช้งาน",
    helpCenter: "ศูนย์ช่วยเหลือ",
    signup: "สมัครสมาชิก",
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    goAdmin: "ไปหน้าแอดมิน",
  },
  en: {
    announce: "Every rental is ID-verified and damage-protected — borrow with confidence.",
    navHome: "Home",
    navShop: "Shop",
    adminNavLabel: "Admin panel",
    listItem: "List your item",
    myRentals: "My rentals",
    myListings: "My listings",
    howItWorks: "How it works",
    helpCenter: "Help center",
    signup: "Sign up",
    login: "Log in",
    logout: "Log out",
    goAdmin: "Go to admin panel",
  },
} as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>("th");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null);
  const favCount = 0;

  useEffect(() => setMounted(true), []);

  const t = dict[lang];
  const isHome = pathname === "/";
  const isLoggedIn = mounted && !!user;
  const isAdmin = mounted && user?.role === "admin";
  const avatarLetter = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  function goToAdmin() {
    setMenuOpen(false);
    router.push("/users");
  }

  function goToListItem() {
    setMenuOpen(false);
    if (isLoggedIn) {
      router.push(ROUTES.listItem);
    } else {
      setPostLoginRedirect(ROUTES.listItem);
      setLoginModalOpen(true);
    }
  }

  function goToMyListings() {
    setMenuOpen(false);
    router.push(ROUTES.myListings);
  }

  function handleLogout() {
    clearAuth();
    setMenuOpen(false);
    router.push("/");
  }

  function closeLoginModal() {
    setLoginModalOpen(false);
    setPostLoginRedirect(null);
  }

  function handleLoginSuccess() {
    setLoginModalOpen(false);
    if (postLoginRedirect) {
      router.push(postLoginRedirect);
      setPostLoginRedirect(null);
    }
    // ไม่ redirect ไปแอดมินอัตโนมัติแม้ role จะเป็น admin — อยู่หน้าเดิม (home)
    // สลับไปแอดมินทีหลังผ่านปุ่ม "แผงแอดมิน"/"ไปหน้าแอดมิน" เอง
  }

  return (
    <>
      <div className="bg-brand-600 px-4 py-[9px] text-center text-[12px] font-medium tracking-[.04em] text-white">
        {t.announce}
      </div>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/[.92] backdrop-blur-md">
        <div className="flex h-[72px] w-full items-center justify-between gap-5 px-8">
          <div className="flex min-w-0 items-center gap-[26px]">
            <Link href="/" className="flex flex-none items-center">
              <Image
                src="/brand/renty-logo.png"
                alt="renty"
                width={220}
                height={150}
                priority
                className="h-[46px] w-auto object-contain"
              />
            </Link>

            <nav className="flex flex-none items-center gap-[26px]">
              <Link
                href="/"
                className="py-1 text-[17px] tracking-[-.01em]"
                style={{
                  fontWeight: isHome ? 700 : 500,
                  color: isHome ? "#2D5DA8" : "rgba(45,93,168,.5)",
                }}
              >
                {t.navHome}
              </Link>
              <Link
                href="/shop"
                className="py-1 text-[17px] tracking-[-.01em]"
                style={{
                  fontWeight: !isHome ? 700 : 500,
                  color: !isHome ? "#2D5DA8" : "rgba(45,93,168,.5)",
                }}
              >
                {t.navShop}
              </Link>
            </nav>
          </div>

          <nav className="flex flex-none items-center gap-3.5">
            {isAdmin && (
              <button
                onClick={goToAdmin}
                className="whitespace-nowrap border-0 bg-transparent p-0 text-[13.5px] font-semibold text-[#c96442]"
              >
                {t.adminNavLabel}
              </button>
            )}

            <div className="border-brand-600/25 flex flex-none overflow-hidden rounded-full border-[1.5px]">
              <button
                onClick={() => setLang("en")}
                className="px-3 py-[7px] text-[12px] font-bold tracking-[.03em] transition-colors"
                style={{
                  background: lang === "en" ? "#2D5DA8" : "transparent",
                  color: lang === "en" ? "#fff" : "rgba(45,93,168,.6)",
                }}
              >
                EN
              </button>
              <button
                onClick={() => setLang("th")}
                className="px-3 py-[7px] text-[12px] font-bold tracking-[.03em] transition-colors"
                style={{
                  background: lang === "th" ? "#2D5DA8" : "transparent",
                  color: lang === "th" ? "#fff" : "rgba(45,93,168,.6)",
                }}
              >
                TH
              </button>
            </div>

            <button
              onClick={goToListItem}
              className="border-brand-600 text-brand-600 hover:bg-brand-600 whitespace-nowrap rounded-full border-[1.5px] bg-white px-[18px] py-[9px] text-[13.5px] font-semibold transition-colors hover:text-white"
            >
              {t.listItem}
            </button>

            <button aria-label="Saved" className="relative flex border-0 bg-transparent p-1">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D5DA8"
                strokeWidth="1.8"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              {favCount > 0 && (
                <span className="bg-brand-600 absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
                  {favCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Account menu"
                className="relative flex h-[34px] w-[34px] rounded-full border-0 bg-none p-0"
              >
                <div className="bg-brand-600 flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-[13px] font-bold text-white">
                  {avatarLetter}
                </div>
                {isAdmin && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#c96442]" />
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-[44px] z-50 min-w-[180px] rounded-[14px] border border-black/10 bg-white p-2 shadow-[0_12px_32px_rgba(10,10,10,.14)]">
                    {isLoggedIn && (
                      <>
                        <button className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#0a0a0a] hover:bg-black/5">
                          {t.myRentals}
                        </button>
                        <button
                          onClick={goToMyListings}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                        >
                          {t.myListings}
                        </button>
                      </>
                    )}
                    <a
                      href="#"
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                    >
                      {t.howItWorks}
                    </a>
                    <a
                      href="#"
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                    >
                      {t.helpCenter}
                    </a>
                    <div className="mx-1 my-1.5 h-px bg-black/[.08]" />

                    {isLoggedIn ? (
                      <>
                        {isAdmin && (
                          <button
                            onClick={goToAdmin}
                            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                          >
                            {t.goAdmin}
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                        >
                          {t.logout}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setLoginModalOpen(true);
                          }}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                        >
                          {t.login}
                        </button>
                        <Link
                          href="/signup"
                          onClick={() => setMenuOpen(false)}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#0a0a0a] hover:bg-black/5"
                        >
                          {t.signup}
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <LoginModal open={loginModalOpen} onClose={closeLoginModal} onSuccess={handleLoginSuccess} />
    </>
  );
}
