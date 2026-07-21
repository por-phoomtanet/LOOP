"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "../services/authApi";
import type { RegisterResult } from "../types";
import { OtpStep } from "./OtpStep";
import { SignupForm } from "./SignupForm";

type Stage = "form" | "otp" | "done";

export function SignupPage() {
  const [stage, setStage] = useState<Stage>("form");
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleRegistered(
    result: RegisterResult,
    idCardFile: File | null,
    faceVerifiedMock: boolean,
  ) {
    // login เข้า authStore ทันที (ยังไม่ APPROVED จนกว่าจะผ่าน OTP) เพื่อให้ request ถัดไปแนบ token อัตโนมัติ
    setAuth(result.user, result.token);

    if (idCardFile) {
      try {
        await authApi.uploadIdCard(result.user.id, idCardFile);
      } catch {
        // ไม่ block signup flow ถ้าอัปโหลดบัตรไม่สำเร็จ — ผู้ใช้แก้ไขทีหลังได้
      }
    }
    if (faceVerifiedMock) {
      try {
        await authApi.faceVerify(result.user.id);
      } catch {
        // เช่นเดียวกัน — ไม่ block flow
      }
    }

    setStage("otp");
  }

  if (stage === "done") {
    return (
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center px-6 py-24 text-center">
        <div className="bg-brand-600 mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white">
          ✓
        </div>
        <h1 className="font-arch mb-2 text-[24px] font-extrabold">สร้างบัญชีสำเร็จ!</h1>
        <p className="mb-8 text-[14px] text-black/60">
          ยินดีต้อนรับสู่ renty — เริ่มเช่าหรือปล่อยเช่าสินค้าได้ทันที
        </p>
        <Link
          href="/"
          className="bg-brand-600 rounded-full px-8 py-3 text-[14px] font-semibold text-white"
        >
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  if (stage === "otp") {
    return <OtpStep onVerified={() => setStage("done")} />;
  }

  return <SignupForm onRegistered={handleRegistered} />;
}
