"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { authApi } from "../services/authApi";
import type { AccountType, OcrMockResult, RegisterResult } from "../types";

const MOCK_OCR_RESULT: OcrMockResult = {
  name: "SOMCHAI JAIDEE",
  idNumber: "1-2345-67890-12-3",
  dob: "1995-05-12",
  expiry: "2030-05-12",
};

type Props = {
  onRegistered: (
    result: RegisterResult,
    idCardFile: File | null,
    faceVerifiedMock: boolean,
  ) => void;
};

export function SignupForm({ onRegistered }: Props) {
  const [accountType, setAccountType] = useState<AccountType>("INDIVIDUAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [ocrShown, setOcrShown] = useState(false);
  const [faceVerifiedMock, setFaceVerifiedMock] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && email.trim() && phone.trim() && password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.register({ accountType, name, email, phone, password });
      onRegistered(res.data.data, idCardFile, faceVerifiedMock);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[460px] px-6 py-12">
      <Link
        href="/"
        aria-label="กลับหน้าแรก"
        className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/[.15] bg-white text-black/60 transition-colors hover:border-black/30 hover:text-black"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Link>
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        สร้างบัญชี
      </div>
      <h1 className="font-arch mb-2 text-[28px] font-extrabold tracking-[-.02em]">
        สมัครใช้งาน renty
      </h1>
      <p className="mb-8 text-[14px] text-black/60">
        สมัครสมาชิกเพื่อเริ่มเช่าและปล่อยเช่าสินค้าใกล้คุณ
      </p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">ประเภทบัญชี</label>
        <div className="inline-flex overflow-hidden rounded-full border border-black/[.14]">
          {(
            [
              { value: "INDIVIDUAL" as const, label: "บุคคล" },
              { value: "SHOP" as const, label: "ร้านค้า" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccountType(opt.value)}
              className="px-5 py-2 text-[13.5px] font-semibold transition-colors"
              style={{
                background: accountType === opt.value ? "#2D5DA8" : "transparent",
                color: accountType === opt.value ? "#fff" : "rgba(45,93,168,.6)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="ชื่อผู้ใช้" value={name} onChange={setName} placeholder="" />
      <Field label="อีเมล" value={email} onChange={setEmail} type="email" />
      <Field label="เบอร์โทร" value={phone} onChange={setPhone} type="tel" />
      <Field label="รหัสผ่าน" value={password} onChange={setPassword} type="password" />

      <div className="mb-5">
        <label className="mb-1 block text-[13px] font-medium text-black/70">รูปบัตรประชาชน</label>
        <p className="mb-2.5 text-[12.5px] text-sky-600">
          ใช้เพื่อยืนยันตัวตนสำหรับการเช่าที่ปลอดภัย ไม่เปิดเผยต่อผู้ใช้อื่น
        </p>

        <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-black/[.02] text-black/40 transition-colors hover:border-black/35">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setIdCardFile(e.target.files?.[0] ?? null)}
          />
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 16l-4.5-4.5a2 2 0 0 0-2.8 0L7 18" />
          </svg>
          <span className="text-[13px]">{idCardFile ? idCardFile.name : "ID card photo"}</span>
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setOcrShown(true)}
          className="rounded-full border border-black/[.16] px-4 py-2 text-[12.5px] font-semibold text-black/70 hover:border-black/35"
        >
          ดึงข้อมูลจากรูปภาพ (จำลอง)
        </button>
        <button
          type="button"
          onClick={() => setFaceModalOpen(true)}
          className="rounded-full border border-black/[.16] px-4 py-2 text-[12.5px] font-semibold text-black/70 hover:border-black/35"
        >
          📱 ยืนยันใบหน้าผ่านโทรศัพท์{faceVerifiedMock ? " ✓" : ""}
        </button>
      </div>

      {ocrShown && (
        <div className="mb-6 rounded-xl border border-black/10 bg-black/[.02] p-4 text-[13px]">
          <div className="mb-2 font-semibold text-black/70">ผลลัพธ์จากรูปภาพ (จำลอง)</div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-black/60">
            <dt>ชื่อ</dt>
            <dd className="text-right text-black">{MOCK_OCR_RESULT.name}</dd>
            <dt>เลขบัตรประชาชน</dt>
            <dd className="text-right text-black">{MOCK_OCR_RESULT.idNumber}</dd>
            <dt>วันเกิด</dt>
            <dd className="text-right text-black">{MOCK_OCR_RESULT.dob}</dd>
            <dt>วันหมดอายุ</dt>
            <dd className="text-right text-black">{MOCK_OCR_RESULT.expiry}</dd>
          </dl>
        </div>
      )}

      {faceModalOpen && (
        <div className="mb-6 rounded-xl border border-black/10 bg-black/[.02] p-4 text-center text-[13px]">
          {faceVerifiedMock ? (
            <p className="font-semibold text-emerald-600">ยืนยันใบหน้าสำเร็จ ✓</p>
          ) : (
            <>
              <p className="mb-3 text-black/60">สแกนใบหน้าผ่านมือถือเพื่อยืนยันตัวตน (จำลอง)</p>
              <button
                type="button"
                onClick={() => setFaceVerifiedMock(true)}
                className="rounded-full bg-black px-4 py-2 text-[12.5px] font-semibold text-white"
              >
                จำลองสแกนสำเร็จ
              </button>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="bg-brand-600 w-full rounded-full py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "กำลังสร้างบัญชี…" : "สร้างบัญชี"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[13px] font-medium text-black/70">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand-400"
      />
    </div>
  );
}
