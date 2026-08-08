"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentProfileForm } from "@/modules/auth/components/PaymentProfileForm";
import { authApi } from "@/modules/auth/services/authApi";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { productsApi } from "../services/productsApi";
import type { MyListing } from "../types";
import { ListItemForm } from "./ListItemForm";

const PAYMENT_PROFILE_NOTICE =
  "ต้องตั้งค่าการรับเงิน (ชื่อ-นามสกุลจริง + รูป QR พร้อมเพย์) ให้ครบก่อน ถึงจะลงประกาศให้เช่าได้";

type Tab = "listings" | "create" | "settings";

function initialTab(tabParam: string | null): Tab {
  if (tabParam === "create") return "create";
  if (tabParam === "settings") return "settings";
  return "listings";
}

const STATUS_BADGE: Record<MyListing["status"], { bg: string; color: string; label: string }> = {
  ACTIVE: { bg: "rgba(23,138,90,.1)", color: "#178a5a", label: "ใช้งาน" },
  UNDER_REVIEW: { bg: "rgba(201,152,66,.12)", color: "#a8752f", label: "รอตรวจสอบ" },
  PAUSED: { bg: "rgba(10,10,10,.07)", color: "rgba(10,10,10,.55)", label: "หยุดชั่วคราว" },
};

export function MyListingsTable() {
  const searchParams = useSearchParams();
  // ลิงก์ "ลงประกาศให้เช่า"/"ตั้งค่าการให้เช่า" ทั่วเว็บ (Header/Footer/หน้าแรก) มาลง
  // ?tab=create หรือ ?tab=settings ให้เปิดแท็บนั้นทันที
  const [activeTab, setActiveTab] = useState<Tab>(() => initialTab(searchParams.get("tab")));
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MyListing | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const user = useAuthStore((s) => s.user);
  // null = ยังไม่รู้ (กำลังโหลด) — ต้องรอผลนี้ก่อนถึงจะฟันธงได้ว่าล็อกแท็บลงประกาศหรือไม่
  const [paymentProfileComplete, setPaymentProfileComplete] = useState<boolean | null>(null);

  function load() {
    setLoading(true);
    productsApi
      .getMyListings()
      .then((res) => setListings(res.data.data))
      .catch(() => setError("โหลดรายการไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }

  function refetchPaymentProfile() {
    if (!user) return;
    authApi
      .getPaymentProfile(user.id)
      .then((res) => {
        const { legalName, promptPayQrUrl } = res.data.data;
        setPaymentProfileComplete(!!legalName && !!promptPayQrUrl);
      })
      .catch(() => setPaymentProfileComplete(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    refetchPaymentProfile();
  }, [user]);

  // เผื่อเข้ามาตรงๆ ผ่านลิงก์ ?tab=create ทั่วเว็บ (Header/Footer) ทั้งที่ยังตั้งค่าการรับเงินไม่ครบ
  useEffect(() => {
    if (paymentProfileComplete === false && activeTab === "create") {
      setActiveTab("settings");
    }
  }, [paymentProfileComplete, activeTab]);

  function extractError(err: unknown) {
    const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
    return typeof msg === "string" ? msg : "เกิดข้อผิดพลาด";
  }

  async function toggleStatus(listing: MyListing) {
    setBusyId(listing.id);
    setError(null);
    try {
      const next = listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      await productsApi.setStatus(listing.id, next);
      load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(listing: MyListing) {
    if (!confirm(`ลบประกาศ "${listing.title}" ใช่หรือไม่`)) return;
    setBusyId(listing.id);
    setError(null);
    try {
      await productsApi.deleteProduct(listing.id);
      load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setBusyId(null);
    }
  }

  // แก้ไขและลงประกาศใหม่ใช้แท็บ+ฟอร์มเดียวกัน (ไม่แยกเป็น modal อีกต่อไป) — สลับกันด้วย editing
  function openCreateTab() {
    // ล็อกแท็บลงประกาศไว้จนกว่าจะตั้งค่าการรับเงินครบ (เช็คชื่อผู้รับตอนตรวจสลิปได้)
    if (paymentProfileComplete === false) {
      setActiveTab("settings");
      return;
    }
    setEditing(null);
    setActiveTab("create");
  }

  function openEditTab(listing: MyListing) {
    setEditing(listing);
    setActiveTab("create");
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 md:px-8 md:py-12">
      <div className="mb-2">
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
          รายการของคุณ
        </div>
        <h1 className="font-arch text-[24px] font-extrabold tracking-[-.02em] text-black sm:text-[30px] sm:tracking-[-.025em]">
          รายการปล่อยเช่าของฉัน
        </h1>
        <p className="mt-2.5 max-w-[560px] text-[14.5px] text-black/55">
          จัดการสินค้าที่คุณลงประกาศให้เช่า
        </p>
      </div>

      <div className="mb-1 mt-6 inline-flex flex-wrap gap-1 rounded-full bg-black/5 p-1">
        <button
          type="button"
          onClick={openCreateTab}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-[18px] py-2.5 text-[13.5px] font-semibold transition-all ${
            activeTab === "create" ? "bg-brand-600 text-white" : "text-black/55 hover:bg-white"
          }`}
        >
          + ลงประกาศให้เช่า
          {paymentProfileComplete === false && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === "create" ? "bg-white/20" : "bg-black/10"
              }`}
            >
              ตั้งค่าก่อน
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`whitespace-nowrap rounded-full px-[18px] py-2.5 text-[13.5px] font-semibold transition-all ${
            activeTab === "listings" ? "bg-brand-600 text-white" : "text-black/55 hover:bg-white"
          }`}
        >
          รายการสินค้า
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`whitespace-nowrap rounded-full px-[18px] py-2.5 text-[13.5px] font-semibold transition-all ${
            activeTab === "settings" ? "bg-brand-600 text-white" : "text-black/55 hover:bg-white"
          }`}
        >
          ตั้งค่าการให้เช่า
        </button>
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-[18px] py-2.5 text-[13.5px] font-semibold text-black/35"
        >
          ออเดอร์
          <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">เร็วๆ นี้</span>
        </button>
      </div>

      {activeTab === "create" ? (
        <div className="mt-6 rounded-[14px] border border-black/10 bg-white">
          <ListItemForm
            key={editing ? `edit-${editing.id}` : "create"}
            embedded
            listing={editing ?? undefined}
            onSaved={() => {
              setEditing(null);
              setActiveTab("listings");
              load();
            }}
          />
        </div>
      ) : activeTab === "settings" ? (
        <div className="mt-6 rounded-[14px] border border-black/10 bg-white">
          <PaymentProfileForm
            embedded
            onSaved={refetchPaymentProfile}
            notice={paymentProfileComplete === false ? PAYMENT_PROFILE_NOTICE : undefined}
          />
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="mt-6 text-black/50">กำลังโหลด…</p>
          ) : listings.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-black/50">
              คุณยังไม่มีสินค้าที่ลงประกาศ
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[14px] border border-black/10">
              {listings.map((listing) => {
                const badge = STATUS_BADGE[listing.status];
                return (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-3 border-t border-black/[.08] px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                  >
                    <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1 sm:gap-4">
                      {listing.images[0] ? (
                        // eslint-disable-next-line
                        <img
                          src={resolveUploadUrl(listing.images[0].url)}
                          alt=""
                          className="h-14 w-14 flex-none rounded-[10px] object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 flex-none rounded-[10px] bg-black/[.06]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-bold text-black">
                          {listing.title}
                        </p>
                        <p className="mt-[3px] text-[13px] text-black/55">
                          ฿{listing.pricePerDay} / วัน
                        </p>
                        {listing.priceTiers.length > 0 && (
                          <p className="mt-0.5 text-[11.5px] text-black/40">
                            {listing.priceTiers.map((t) => `${t.days} วัน ฿${t.price}`).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span
                        className="flex-none whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex flex-none flex-wrap items-center gap-2">
                      {listing.status !== "UNDER_REVIEW" && (
                        <button
                          type="button"
                          disabled={busyId === listing.id}
                          onClick={() => toggleStatus(listing)}
                          className="whitespace-nowrap rounded-[8px] border-[1.5px] border-black/[.15] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-black disabled:opacity-40"
                        >
                          {listing.status === "ACTIVE" ? "หยุดชั่วคราว" : "เปิดใช้งาน"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditTab(listing)}
                        className="whitespace-nowrap rounded-[8px] border-[1.5px] border-black/[.15] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-black"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        aria-label="ลบ"
                        disabled={busyId === listing.id}
                        onClick={() => handleDelete(listing)}
                        className="rounded-[8px] border-0 bg-transparent p-1.5 hover:bg-[rgba(201,100,66,.1)] disabled:opacity-40"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#c96442"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
