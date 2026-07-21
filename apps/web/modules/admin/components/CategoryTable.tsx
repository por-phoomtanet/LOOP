"use client";

import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Modal, Switch, Table } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { adminApi } from "../services/adminApi";
import type { Category } from "../types";

type ModalState = { open: boolean; editing: Category | null };

export function CategoryTable() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null });

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getCategories("all");
      setCategories(res.data.data);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "โหลดรายการหมวดหมู่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (modal.editing) {
        await adminApi.updateCategory(modal.editing.id, values);
        message.success("แก้ไขหมวดหมู่สำเร็จ");
      } else {
        await adminApi.createCategory(values);
        message.success("เพิ่มหมวดหมู่สำเร็จ");
      }
      setModal({ open: false, editing: null });
      await load();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: Category) {
    setBusyId(category.id);
    try {
      await adminApi.updateCategoryStatus(category.id, !category.isActive);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c)),
      );
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "เกิดข้อผิดพลาด");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(category: Category) {
    setBusyId(category.id);
    try {
      await adminApi.deleteCategory(category.id);
      message.success("ลบหมวดหมู่สำเร็จ");
      await load();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "เกิดข้อผิดพลาด");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="ประเภทสินค้า"
        subtitle="จัดการหมวดหมู่สินค้าในระบบ"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, editing: null })}
          >
            เพิ่มหมวดหมู่
          </Button>
        }
      />

      <Table<Category>
        rowKey="id"
        loading={loading}
        dataSource={categories}
        pagination={false}
        scroll={{ x: "max-content" }}
        columns={[
          {
            title: "ลำดับ",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1,
          },
          { title: "ชื่อ", dataIndex: "name", key: "name" },
          { title: "Slug", dataIndex: "slug", key: "slug" },
          { title: "จำนวนสินค้า", dataIndex: "productCount", key: "productCount", align: "center" },
          {
            title: "สถานะ",
            key: "isActive",
            render: (_, category) => (
              <Switch
                checked={category.isActive}
                loading={busyId === category.id}
                checkedChildren="ใช้งาน"
                unCheckedChildren="ปิด"
                onChange={() => toggleActive(category)}
              />
            ),
          },
          {
            title: "จัดการ",
            key: "actions",
            render: (_, category) => (
              <>
                <Button type="text" onClick={() => setModal({ open: true, editing: category })}>
                  แก้ไข
                </Button>
                <Button
                  type="text"
                  danger
                  disabled={category.productCount > 0}
                  loading={busyId === category.id}
                  onClick={() => handleDelete(category)}
                >
                  ลบ
                </Button>
              </>
            ),
          },
        ]}
      />

      <Modal
        title={modal.editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        open={modal.open}
        destroyOnHidden
        confirmLoading={saving}
        onOk={handleSave}
        onCancel={() => setModal({ open: false, editing: null })}
        afterOpenChange={(open) => {
          if (open) {
            form.resetFields();
            if (modal.editing) form.setFieldsValue({ ...modal.editing });
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="ชื่อหมวดหมู่"
            rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
          >
            <Input placeholder="เช่น กล้อง" />
          </Form.Item>
          <Form.Item name="slug" label="Slug (ถ้าไม่กรอกจะสร้างจากชื่อให้อัตโนมัติ)">
            <Input placeholder="เช่น cameras" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
