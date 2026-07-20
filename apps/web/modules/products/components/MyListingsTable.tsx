"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { productsApi } from "../services/productsApi";
import type { MyListing } from "../types";
import { ListItemForm } from "./ListItemForm";

const STATUS_BADGE: Record<MyListing["status"], { bg: string; color: string; label: string }> = {
  ACTIVE: { bg: "rgba(23,138,90,.1)", color: "#178a5a", label: "ใช้งาน" },
  UNDER_REVIEW: { bg: "rgba(201,152,66,.12)", color: "#a8752f", label: "รอตรวจสอบ" },
  PAUSED: { bg: "rgba(10,10,10,.07)", color: "rgba(10,10,10,.55)", label: "หยุดชั่วคราว" },
};

export function MyListingsTable() {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MyListing | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    productsApi
      .getMyListings()
      .then((res) => setListings(res.data.data))
      .catch(() => setError("โหลดรายการไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div className="mx-auto w-full max-w-[1000px] px-8 py-12">
      <div className="mb-2 flex items-end justify-between gap-5">
        <div>
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
            รายการของคุณ
          </div>
          <h1 className="font-arch text-[30px] font-extrabold tracking-[-.025em] text-black">
            รายการปล่อยเช่าของฉัน
          </h1>
          <p className="mt-2.5 max-w-[560px] text-[14.5px] text-black/55">
            จัดการสินค้าที่คุณลงประกาศให้เช่า
          </p>
        </div>
        <Link
          href="/list-item"
          className="bg-brand-600 flex-none whitespace-nowrap rounded-[10px] px-5 py-[11px] text-[14px] font-semibold text-white"
        >
          ลงประกาศให้เช่า
        </Link>
      </div>

      <div className="mb-1 mt-6 inline-flex gap-1 rounded-full bg-black/5 p-1">
        <button
          type="button"
          className="bg-brand-600 whitespace-nowrap rounded-full px-[18px] py-2.5 text-[13.5px] font-semibold text-white transition-all"
        >
          รายการสินค้า
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

      {error && (
        <div className="mb-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="mt-6 text-black/50">กำลังโหลด…</p>
      ) : listings.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-black/50">คุณยังไม่มีสินค้าที่ลงประกาศ</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[14px] border border-black/10">
          {listings.map((listing) => {
            const badge = STATUS_BADGE[listing.status];
            return (
              <div
                key={listing.id}
                className="flex items-center gap-4 border-t border-black/[.08] px-5 py-4 first:border-t-0"
              >
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
                  <p className="truncate text-[14.5px] font-bold text-black">{listing.title}</p>
                  <p className="mt-[3px] text-[13px] text-black/55">฿{listing.pricePerDay} / วัน</p>
                </div>
                <span
                  className="flex-none whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
                <div className="flex flex-none items-center gap-2">
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
                    onClick={() => setEditing(listing)}
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

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-[500px] rounded-2xl bg-white shadow-[0_20px_60px_rgba(10,10,10,.25)]">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setEditing(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-black/40 hover:bg-black/5 hover:text-black"
            >
              ✕
            </button>
            <ListItemForm
              listing={editing}
              onSaved={() => {
                setEditing(null);
                load();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
