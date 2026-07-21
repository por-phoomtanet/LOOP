"use client";

import { App, Button, Form, Input, Modal, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { adminApi } from "../services/adminApi";
import type { Role } from "../types";

type ModalState = { open: boolean; editing: Role | null };

export function RoleTable({ onChanged }: { onChanged?: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null });

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getRoles();
      setRoles(res.data.data);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "โหลดรายการ role ไม่สำเร็จ");
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
        await adminApi.updateRole(modal.editing.id, values);
        message.success("แก้ไข role สำเร็จ");
      } else {
        await adminApi.createRole(values);
        message.success("เพิ่ม role สำเร็จ");
      }
      setModal({ open: false, editing: null });
      await load();
      onChanged?.();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: Role) {
    setDeletingId(role.id);
    try {
      await adminApi.deleteRole(role.id);
      message.success("ลบ role สำเร็จ");
      await load();
      onChanged?.();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "เกิดข้อผิดพลาด");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-8">
      <PageHeader
        title="บทบาทและสิทธิ์"
        subtitle="จัดการ role และกำหนดสิทธิ์การเข้าถึงเมนูของ Admin panel"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, editing: null })}
          >
            เพิ่ม Role
          </Button>
        }
      />

      <Table<Role>
        rowKey="id"
        loading={loading}
        dataSource={roles}
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
          { title: "ชื่อ (name)", dataIndex: "name", key: "name" },
          { title: "ป้ายชื่อ", dataIndex: "label", key: "label" },
          { title: "จำนวนผู้ใช้", dataIndex: "userCount", key: "userCount", align: "center" },
          {
            title: "จัดการ",
            key: "actions",
            render: (_, role) => (
              <>
                <Button type="text" onClick={() => setModal({ open: true, editing: role })}>
                  แก้ไข
                </Button>
                <Button
                  type="text"
                  danger
                  disabled={role.userCount > 0}
                  loading={deletingId === role.id}
                  onClick={() => handleDelete(role)}
                >
                  ลบ
                </Button>
              </>
            ),
          },
        ]}
      />

      <Modal
        title={modal.editing ? "แก้ไข Role" : "เพิ่ม Role"}
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
            label="ชื่อ (name)"
            rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
          >
            <Input placeholder="เช่น support" />
          </Form.Item>
          <Form.Item
            name="label"
            label="ป้ายชื่อ"
            rules={[{ required: true, message: "กรุณากรอกป้ายชื่อ" }]}
          >
            <Input placeholder="เช่น ฝ่ายสนับสนุน" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
