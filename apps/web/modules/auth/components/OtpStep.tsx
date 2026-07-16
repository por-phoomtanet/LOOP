"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { authApi } from "../services/authApi";

function maskDestination(method: "email" | "phone", destination: string) {
  if (method === "email") {
    const [user, domain] = destination.split("@");
    if (!domain) return destination;
    const visible = user.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
  }
  return destination.replace(/^(\d{2})\d+(\d{2})$/, "$1*****$2");
}

type Props = {
  onVerified: () => void;
};

export function OtpStep({ onVerified }: Props) {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [destination, setDestination] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function requestOtp(m: "email" | "phone") {
    setRequesting(true);
    setError(null);
    try {
      const res = await authApi.requestOtp(m);
      setDestination(res.data.data.destination);
      setCode("");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "ขอรหัส OTP ไม่สำเร็จ");
    } finally {
      setRequesting(false);
    }
  }

  useEffect(() => {
    requestOtp(method);
    // เรียกครั้งเดียวตอน mount ด้วย method เริ่มต้น (email) — สลับ method ทำผ่าน handleSwitchMethod แทน
    // eslint-disable-next-line
  }, []);

  function handleSwitchMethod(m: "email" | "phone") {
    setMethod(m);
    requestOtp(m);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || verifying) return;

    setVerifying(true);
    setError(null);
    try {
      await authApi.verifyOtp(code);
      onVerified();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "ยืนยัน OTP ไม่สำเร็จ");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="mx-auto w-full max-w-[460px] px-6 py-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        ยืนยันตัวตน
      </div>
      <h1 className="font-arch mb-2 text-[28px] font-extrabold tracking-[-.02em]">ยืนยัน OTP</h1>
      <p className="mb-8 text-[14px] text-black/60">
        ส่งรหัสยืนยันไปยัง {destination ? maskDestination(method, destination) : "..."}
      </p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 inline-flex overflow-hidden rounded-full border border-black/[.14]">
        {(
          [
            { value: "email" as const, label: "อีเมล" },
            { value: "phone" as const, label: "เบอร์โทร" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSwitchMethod(opt.value)}
            className="px-5 py-2 text-[13.5px] font-semibold transition-colors"
            style={{
              background: method === opt.value ? "#0a0a0a" : "transparent",
              color: method === opt.value ? "#fff" : "rgba(10,10,10,.55)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-medium text-black/70">รหัส 6 หลัก</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-center text-[20px] tracking-[.3em] outline-none transition-colors focus:border-black/40"
          placeholder="------"
        />
      </div>

      <button
        type="submit"
        disabled={code.length !== 6 || verifying}
        className="w-full rounded-full bg-[#0a0a0a] py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {verifying ? "กำลังยืนยัน…" : "ยืนยันและสร้างบัญชี"}
      </button>

      <button
        type="button"
        onClick={() => requestOtp(method)}
        disabled={requesting}
        className="mt-3 w-full text-[13px] text-black/50 hover:text-black/80 disabled:opacity-40"
      >
        {requesting ? "กำลังส่งรหัส…" : "ส่งรหัสอีกครั้ง"}
      </button>
    </form>
  );
}
