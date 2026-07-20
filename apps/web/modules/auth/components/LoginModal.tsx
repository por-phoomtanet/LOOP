"use client";

import { LoginForm } from "./LoginForm";

type Props = {
  open: boolean;
  onClose: () => void;
  /** เรียกแทน onClose เมื่อ login สำเร็จ (เช่น ให้ไปต่อหน้าที่ตั้งใจไว้แทนแค่ปิด modal) */
  onSuccess?: () => void;
};

export function LoginModal({ open, onClose, onSuccess }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(10,10,10,.25)]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-black/40 hover:bg-black/5 hover:text-black"
        >
          ✕
        </button>
        <h2 className="font-arch mb-6 text-[22px] font-extrabold tracking-[-.02em]">
          เข้าสู่ระบบ renty
        </h2>
        <LoginForm compact onSuccess={onSuccess ?? onClose} />
      </div>
    </div>
  );
}
