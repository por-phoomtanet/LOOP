"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { productsApi } from "../services/productsApi";
import type { MyListing } from "../types";
import { ListItemForm } from "./ListItemForm";

const STATUS_LABEL: Record<MyListing["status"], string> = {
  UNDER_REVIEW: "รอตรวจสอบ",
  ACTIVE: "ใช้งานได้",
  PAUSED: "พักไว้",
};

const STATUS_COLOR: Record<MyListing["status"], string> = {
  UNDER_REVIEW: "#9a9a9a",
  ACTIVE: "#1a9c5c",
  PAUSED: "#c96442",
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
    <div className="mx-auto w-full max-w-[880px] px-6 py-12">
      <h1 className="font-arch mb-8 text-[26px] font-extrabold tracking-[-.02em]">
        รายการปล่อยเช่าของฉัน
      </h1>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-black/50">กำลังโหลด…</p>
      ) : listings.length === 0 ? (
        <p className="text-black/50">ยังไม่มีประกาศ</p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border border-black/10 p-4"
            >
              {listing.images[0] ? (
                // eslint-disable-next-line
                <img
                  src={resolveUploadUrl(listing.images[0].url)}
                  alt=""
                  className="h-16 w-16 flex-none rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 flex-none rounded-lg bg-black/5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{listing.title}</p>
                <p className="text-[13px] text-black/50">
                  {listing.categoryName} · ฿{listing.pricePerDay}/วัน
                </p>
                <span
                  className="mt-1 inline-block text-[12px] font-semibold"
                  style={{ color: STATUS_COLOR[listing.status] }}
                >
                  {STATUS_LABEL[listing.status]}
                </span>
              </div>
              <div className="flex flex-none gap-2">
                {listing.status !== "UNDER_REVIEW" && (
                  <button
                    type="button"
                    disabled={busyId === listing.id}
                    onClick={() => toggleStatus(listing)}
                    className="rounded-full border border-black/[.16] px-4 py-2 text-[12.5px] font-semibold text-black/70 hover:border-black/35 disabled:opacity-40"
                  >
                    {listing.status === "ACTIVE" ? "พัก" : "เริ่มใหม่"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(listing)}
                  className="rounded-full border border-black/[.16] px-4 py-2 text-[12.5px] font-semibold text-black/70 hover:border-black/35"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  disabled={busyId === listing.id}
                  onClick={() => handleDelete(listing)}
                  className="rounded-full border border-red-200 px-4 py-2 text-[12.5px] font-semibold text-red-600 hover:border-red-400 disabled:opacity-40"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
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
