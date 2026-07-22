"use client";

import { App, Button, Table } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { adminApi } from "../services/adminApi";
import type { AdminUser, VerificationStatus } from "../types";

const STATUS_LABEL: Record<VerificationStatus, string> = {
  PENDING: "รอยืนยัน OTP",
  APPROVED: "ใช้งานได้",
  REJECTED: "ถูกระงับ",
};

const STATUS_COLOR: Record<VerificationStatus, string> = {
  PENDING: "#9a9a9a",
  APPROVED: "#1a9c5c",
  REJECTED: "#c0392b",
};

const ACCOUNT_TYPE_LABEL: Record<AdminUser["accountType"], string> = {
  INDIVIDUAL: "บุคคล",
  SHOP: "ร้านค้า",
};

export function UserTable() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminApi.getUsers({ page, pageSize });
        if (cancelled) return;
        setUsers(res.data.data);
        setTotal(res.data.total);
      } catch (err) {
        if (cancelled) return;
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
        message.error(msg ?? "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [page, pageSize]);

  async function toggleStatus(user: AdminUser) {
    const nextStatus: VerificationStatus =
      user.verificationStatus === "REJECTED" ? "APPROVED" : "REJECTED";

    setUpdatingId(user.id);
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, verificationStatus: nextStatus } : u)),
      );
      message.success(nextStatus === "REJECTED" ? "ระงับบัญชีแล้ว" : "ปลดระงับบัญชีแล้ว");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="ผู้ใช้งาน" subtitle="รายชื่อผู้ใช้ทั้งหมดในระบบ" />
      <Table<AdminUser>
        rowKey="id"
        loading={loading}
        dataSource={users}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (t) => `ทั้งหมด ${t} รายการ`,
          onChange: (p) => setPage(p),
          onShowSizeChange: (_, size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        columns={[
          {
            title: "ลำดับ",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => (page - 1) * pageSize + index + 1,
          },
          { title: "ชื่อ", dataIndex: "name", key: "name" },
          { title: "อีเมล", dataIndex: "email", key: "email" },
          {
            title: "วันที่สมัคร",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (v: string) => new Date(v).toLocaleDateString("th-TH"),
          },
          {
            title: "ประเภท",
            dataIndex: "accountType",
            key: "accountType",
            render: (v: AdminUser["accountType"]) => ACCOUNT_TYPE_LABEL[v],
          },
          {
            title: "สถานะ",
            dataIndex: "verificationStatus",
            key: "verificationStatus",
            render: (v: VerificationStatus) => (
              <span style={{ color: STATUS_COLOR[v], fontWeight: 600 }}>{STATUS_LABEL[v]}</span>
            ),
          },
          {
            title: "จัดการ",
            key: "actions",
            render: (_, user) => (
              <Button
                type="text"
                danger={user.verificationStatus !== "REJECTED"}
                loading={updatingId === user.id}
                onClick={() => toggleStatus(user)}
              >
                {user.verificationStatus === "REJECTED" ? "ปลดระงับ" : "ระงับ"}
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
