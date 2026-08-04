"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rentalsApi } from "../services/rentalsApi";

type Props = {
  productId: number;
  productTitle: string;
  onClose: () => void;
};

export function RentalRequestModal({ productId, productTitle, onClose }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await rentalsApi.createRental(productId, { startDate, endDate });
      router.push(`/rentals/${res.data.data.id}/payment`);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "สร้างคำขอเช่าไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(10,10,10,.25)]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-black/40 hover:bg-black/5 hover:text-black"
        >
          ✕
        </button>
        <h2 className="font-arch mb-1 text-[18px] font-extrabold tracking-[-.02em]">
          เช่าสินค้านี้
        </h2>
        <p className="mb-4 truncate text-[13px] text-black/55">{productTitle}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="mb-1.5 block text-[13px] font-medium text-black/70">
              วันที่เริ่มเช่า
            </label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="focus:border-brand-400 w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors"
            />
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-[13px] font-medium text-black/70">วันที่คืน</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="focus:border-brand-400 w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 w-full rounded-full py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            {submitting ? "กำลังสร้างคำขอ…" : "ดำเนินการชำระเงิน"}
          </button>
        </form>
      </div>
    </div>
  );
}
