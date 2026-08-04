"use client";

import axios from "axios";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "../services/authApi";

export function PaymentProfileForm() {
  const user = useAuthStore((s) => s.user);
  const [legalName, setLegalName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      if (legalName.trim()) {
        await authApi.updatePaymentProfile(user.id, legalName.trim());
      }
      if (file) {
        await authApi.uploadPromptPayQr(user.id, file);
      }
      setSuccess(true);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[460px] px-6 py-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        ตั้งค่าการรับเงิน
      </div>
      <h1 className="font-arch mb-2 text-[24px] font-extrabold tracking-[-.02em]">
        ข้อมูลรับเงินสำหรับผู้ปล่อยเช่า
      </h1>
      <p className="mb-8 text-[14px] text-black/60">
        ใช้ตรวจสอบสลิปโอนเงินอัตโนมัติเมื่อมีคนจ่ายค่าเช่า ต้องกรอกให้ครบก่อนจะรับเงินผ่านระบบได้
      </p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          บันทึกข้อมูลสำเร็จ
        </div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">
          ชื่อ-นามสกุลจริง (ตามบัญชีธนาคาร)
        </label>
        <input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="เช่น ภูมิธเนศ อินทยุง"
          className="focus:border-brand-400 w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors"
        />
        <p className="mt-1.5 text-[12px] text-black/40">
          ใช้เทียบกับชื่อผู้รับเงินในสลิปโอนเงิน ไม่แสดงต่อผู้ใช้อื่น
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-medium text-black/70">รูป QR พร้อมเพย์</label>
        <label className="flex h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-black/[.02] text-black/40 transition-colors hover:border-black/35">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-[13px]">{file ? file.name : "อัปโหลดรูป QR พร้อมเพย์"}</span>
        </label>
        <p className="mt-1.5 text-[12px] text-black/40">
          เปิดแอปธนาคาร ไปที่หน้า QR พร้อมเพย์ของคุณ บันทึกภาพแล้วอัปโหลดที่นี่
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || (!legalName.trim() && !file)}
        className="bg-brand-600 w-full rounded-full py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
      </button>
    </form>
  );
}
