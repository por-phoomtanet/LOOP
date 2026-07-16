"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePermissionStore } from "@/store/permissionStore";
import { authApi } from "../services/authApi";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setPermissions = usePermissionStore((s) => s.setPermissions);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.login(email, password);
      const { user, token } = res.data.data;
      setAuth(user, token);

      if (user.role === "admin") {
        const perms = await authApi.getRolePermissions(user.role);
        setPermissions(perms.data.data);
        router.push("/users");
      } else {
        router.push("/");
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[420px] px-6 py-20">
      <h1 className="font-arch mb-6 text-[26px] font-extrabold tracking-[-.02em]">
        เข้าสู่ระบบ LOOP
      </h1>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">อีเมล</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none focus:border-black/40"
        />
      </div>
      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-medium text-black/70">รหัสผ่าน</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none focus:border-black/40"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#0a0a0a] py-3.5 text-[14.5px] font-semibold text-white disabled:opacity-40"
      >
        {submitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
