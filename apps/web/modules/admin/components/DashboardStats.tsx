"use client";

import { App } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { adminApi } from "../services/adminApi";
import type { DashboardStats as DashboardStatsType } from "../types";

function StatCard({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: React.ReactNode;
  subLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-2 text-[13px] text-black/55">{label}</div>
      <div className="text-[26px] font-bold text-[#0a0a0a]">{value}</div>
      {subLabel && <div className="mt-1 text-[12px] font-medium text-[#c96442]">{subLabel}</div>}
    </div>
  );
}

export function DashboardStats() {
  const { message } = App.useApp();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then((res) => setStats(res.data.data))
      .catch((err) => {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
        message.error(msg ?? "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const placeholder = "—";

  return (
    <div>
      <PageHeader title="แดชบอร์ด" subtitle="ภาพรวมสิ่งที่เกิดขึ้นบน LOOP" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="ผู้ใช้ทั้งหมด"
          value={loading ? "…" : (stats?.users.total ?? placeholder)}
          subLabel={
            !loading && stats && stats.users.pending > 0
              ? `รอตรวจสอบ ${stats.users.pending} รายการ`
              : undefined
          }
        />
        <StatCard label="สินค้าทั้งหมด" value={placeholder} />
        <StatCard label="ออเดอร์ทั้งหมด" value={placeholder} />
        <StatCard label="มูลค่าการเช่ารวม" value={placeholder} />
        <StatCard label="หมวดหมู่" value={placeholder} />
        <StatCard label="รายการที่ปล่อยเช่า" value={placeholder} />
      </div>

      <p className="mt-4 text-[12.5px] text-black/40">
        การ์ดที่แสดง “—” ยังไม่เปิดใช้งาน เพราะยังไม่มีระบบสินค้า/การเช่าจริง (ดู Phase ถัดไปใน
        CLAUDE.md)
      </p>
    </div>
  );
}
