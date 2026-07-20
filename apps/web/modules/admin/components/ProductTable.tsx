"use client";

import { App, Table } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { adminApi } from "../services/adminApi";
import type { AdminProduct } from "../types";

const STATUS_LABEL: Record<AdminProduct["status"], string> = {
  UNDER_REVIEW: "รอตรวจสอบ",
  ACTIVE: "ใช้งานได้",
  PAUSED: "พักไว้",
};

const STATUS_COLOR: Record<AdminProduct["status"], string> = {
  UNDER_REVIEW: "#9a9a9a",
  ACTIVE: "#1a9c5c",
  PAUSED: "#c96442",
};

export function ProductTable() {
  const { message } = App.useApp();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    adminApi
      .getAdminProducts()
      .then((res) => setProducts(res.data.data))
      .catch((err) => {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
        message.error(msg ?? "โหลดรายการสินค้าไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <PageHeader
        title="สินค้า"
        subtitle={`สินค้าทั้งหมดในระบบ (${products.length} รายการ) — ดูอย่างเดียว`}
      />

      <Table<AdminProduct>
        rowKey="id"
        loading={loading}
        dataSource={products}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `ทั้งหมด ${total} รายการ`,
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
          {
            title: "รูป",
            key: "thumbnail",
            width: 64,
            render: (_, p) =>
              p.thumbnailUrl ? (
                // eslint-disable-next-line
                <img
                  src={p.thumbnailUrl}
                  alt={p.title}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-black/5" />
              ),
          },
          { title: "ชื่อสินค้า", dataIndex: "title", key: "title" },
          { title: "หมวดหมู่", dataIndex: "categoryName", key: "categoryName" },
          { title: "ผู้ขาย", dataIndex: "ownerName", key: "ownerName" },
          {
            title: "ราคา/วัน",
            dataIndex: "pricePerDay",
            key: "pricePerDay",
            render: (v: string) => `฿${v}`,
          },
          { title: "คะแนน", dataIndex: "ratingAvg", key: "ratingAvg" },
          { title: "ที่ตั้ง", dataIndex: "location", key: "location" },
          {
            title: "สถานะ",
            dataIndex: "status",
            key: "status",
            render: (v: AdminProduct["status"]) => (
              <span style={{ color: STATUS_COLOR[v], fontWeight: 600 }}>{STATUS_LABEL[v]}</span>
            ),
          },
        ]}
      />
    </div>
  );
}
