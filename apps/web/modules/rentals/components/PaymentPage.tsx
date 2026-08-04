"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { rentalsApi } from "../services/rentalsApi";
import type { PaymentInfo, SlipSubmitResult } from "../types";

export function PaymentPage({ rentalId }: { rentalId: number }) {
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SlipSubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    rentalsApi
      .getPaymentInfo(rentalId)
      .then((res) => setInfo(res.data.data))
      .catch((err) => {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
        setLoadError(typeof msg === "string" ? msg : "โหลดข้อมูลการชำระเงินไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, [rentalId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const res = await rentalsApi.submitSlip(rentalId, file);
      setResult(res.data.data);
      if (res.data.data.verified) {
        setInfo((prev) => (prev ? { ...prev, status: "PAID" } : prev));
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setSubmitError(typeof msg === "string" ? msg : "อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[460px] px-6 py-24 text-center text-[14px] text-black/50">
        กำลังโหลด…
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="mx-auto max-w-[460px] px-6 py-24 text-center text-[14px] text-red-600">
        {loadError ?? "ไม่พบคำขอเช่านี้"}
      </div>
    );
  }

  if (info.status === "PAID") {
    return (
      <div className="mx-auto flex max-w-[460px] flex-col items-center px-6 py-24 text-center">
        <div className="bg-brand-600 mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white">
          ✓
        </div>
        <h1 className="font-arch mb-2 text-[24px] font-extrabold">ชำระเงินสำเร็จ!</h1>
        <p className="text-[14px] text-black/60">
          ระบบตรวจสอบสลิปผ่านแล้ว เจ้าของสินค้าจะติดต่อกลับเร็วๆ นี้
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px] px-6 py-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        ชำระเงิน
      </div>
      <h1 className="font-arch mb-2 text-[24px] font-extrabold tracking-[-.02em]">
        {info.productTitle}
      </h1>
      <p className="mb-6 text-[14px] text-black/60">
        โอนเงินให้ {info.ownerName} ผ่าน PromptPay แล้วแนบสลิปด้านล่าง
      </p>

      <div className="mb-6 flex flex-col items-center rounded-2xl border border-black/10 bg-black/[.02] p-6">
        {info.promptPayQrUrl ? (
          // eslint-disable-next-line
          <img
            src={resolveUploadUrl(info.promptPayQrUrl)}
            alt="PromptPay QR"
            className="mb-4 h-56 w-56 rounded-xl object-contain"
          />
        ) : (
          <div className="mb-4 flex h-56 w-56 items-center justify-center rounded-xl bg-black/5 text-center text-[13px] text-black/40">
            เจ้าของยังไม่ได้ตั้งค่า QR พร้อมเพย์
          </div>
        )}
        <div className="font-arch text-brand-600 text-[28px] font-extrabold">
          ฿{Number(info.totalAmount).toLocaleString("th-TH")}
        </div>
      </div>

      {result && !result.verified && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          {result.reason}
        </div>
      )}
      {submitError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleUpload}>
        <label className="mb-4 flex h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-black/[.02] text-black/40 transition-colors hover:border-black/35">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-[13px]">{file ? file.name : "แนบรูปสลิปโอนเงิน"}</span>
        </label>
        <button
          type="submit"
          disabled={!file || submitting}
          className="bg-brand-600 w-full rounded-full py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {submitting ? "กำลังตรวจสอบ…" : "ยืนยันการชำระเงิน"}
        </button>
      </form>
    </div>
  );
}
