"use client";

import { App, Descriptions, Modal, Spin, Table, Tag } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { adminApi } from "../services/adminApi";
import type { AdminProduct, AdminProductDetail } from "../types";

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

const PICKUP_LABEL: Record<AdminProductDetail["pickupOptions"][number]["type"], string> = {
  MEETUP: "นัดรับ",
  GRAB: "Grab",
  POST: "ไปรษณีย์",
};

export function ProductTable() {
  const { message } = App.useApp();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  function openDetail(id: number) {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    adminApi
      .getAdminProduct(id)
      .then((res) => setDetail(res.data.data))
      .catch((err) => {
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
        message.error(msg ?? "โหลดรายละเอียดสินค้าไม่สำเร็จ");
        setDetailId(null);
      })
      .finally(() => setDetailLoading(false));
  }

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
        onRow={(record) => ({
          onClick: () => openDetail(record.id),
          style: { cursor: "pointer" },
        })}
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
                  src={resolveUploadUrl(p.thumbnailUrl)}
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

      <Modal
        open={detailId !== null}
        onCancel={() => setDetailId(null)}
        footer={null}
        title={detail?.title ?? "รายละเอียดสินค้า"}
        width={640}
      >
        {detailLoading || !detail ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <div className="pt-2">
            {detail.images.length > 0 && (
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {detail.images.map((url) => (
                  // eslint-disable-next-line
                  <img
                    key={url}
                    src={resolveUploadUrl(url)}
                    alt={detail.title}
                    className="h-20 w-20 flex-none rounded object-cover"
                  />
                ))}
              </div>
            )}

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="หมวดหมู่">{detail.categoryName}</Descriptions.Item>
              <Descriptions.Item label="ผู้ขาย">
                {detail.ownerName} ({detail.ownerEmail}, {detail.ownerPhone})
              </Descriptions.Item>
              <Descriptions.Item label="ราคา/วัน">฿{detail.pricePerDay}</Descriptions.Item>
              <Descriptions.Item label="ที่ตั้ง">{detail.location}</Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                <span style={{ color: STATUS_COLOR[detail.status], fontWeight: 600 }}>
                  {STATUS_LABEL[detail.status]}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="คะแนน">
                {detail.reviewCount > 0
                  ? `★ ${detail.ratingAvg.toFixed(1)} (${detail.reviewCount} รีวิว)`
                  : "ยังไม่มีรีวิว"}
              </Descriptions.Item>
              <Descriptions.Item label="การรับสินค้า">
                {detail.pickupOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.pickupOptions.map((o, i) => (
                      <Tag key={i}>
                        {PICKUP_LABEL[o.type]}
                        {o.type === "MEETUP" ? `: ${o.label}` : ""}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="รายละเอียด">{detail.description}</Descriptions.Item>
              <Descriptions.Item label="ลงประกาศเมื่อ">
                {new Date(detail.createdAt).toLocaleDateString("th-TH")}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
