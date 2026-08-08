"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rentalsApi } from "../services/rentalsApi";

type Props = {
  productId: number;
  onCancel: () => void;
};

// ฟอร์มเลือกวันเช่าแบบ inline — ไม่ใช่ modal อีกต่อไป เพราะหน้ารายละเอียดสินค้า (ProductDetailView)
// เองก็แสดงผลได้ทั้งแบบเต็มหน้าและแบบ modal (intercepting route) อยู่แล้ว การซ้อน modal ในหน้า
// ที่อาจเป็น modal อยู่แล้วจะดูรก — ใช้ toggle ขยาย/ยุบแทนตาม pattern เดียวกับ ListItemForm
export function RentalRequestForm({ productId, onCancel }: Props) {
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
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-[14px] border border-black/10 bg-black/[.02] p-4"
    >
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className="mb-1.5 block text-[13px] font-semibold text-black/60">
          วันที่เริ่มเช่า
        </label>
        <input
          type="date"
          value={startDate}
          min={today}
          onChange={(e) => setStartDate(e.target.value)}
          className="focus:border-brand-400 w-full rounded-[10px] border border-black/[.15] bg-white px-3.5 py-3 text-[14.5px] text-black outline-none transition-colors"
        />
      </div>
      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-black/60">วันที่คืน</label>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="focus:border-brand-400 w-full rounded-[10px] border border-black/[.15] bg-white px-3.5 py-3 text-[14.5px] text-black outline-none transition-colors"
        />
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border-[1.5px] border-black/[.15] bg-white py-3 text-[14px] font-semibold text-black/60"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 flex-[2] rounded-full py-3 text-[14px] font-bold text-white transition-opacity disabled:opacity-40"
        >
          {submitting ? "กำลังสร้างคำขอ…" : "ดำเนินการชำระเงิน"}
        </button>
      </div>
    </form>
  );
}
