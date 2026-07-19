"use client";

import { App, Checkbox, Select, Table } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { adminApi } from "../services/adminApi";
import type { Role, RolePermission } from "../types";

const MENUS: { key: string; label: string }[] = [
  { key: "dashboard", label: "แดชบอร์ด" },
  { key: "users", label: "ผู้ใช้" },
  { key: "roles", label: "บทบาทและสิทธิ์" },
];

type PermissionField = "canView" | "canCreate" | "canUpdate" | "canDelete";

export function RolePermissionMatrix({ refreshKey }: { refreshKey: number }) {
  const { message } = App.useApp();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getRoles()
      .then((res) => {
        setRoles(res.data.data);
        setSelectedRole((prev) => prev ?? res.data.data[0]?.name ?? null);
      })
      .catch(() => message.error("โหลดรายการ role ไม่สำเร็จ"));
    // eslint-disable-next-line
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedRole) return;
    setLoading(true);
    adminApi
      .getRolePermissions(selectedRole)
      .then((res) => setPermissions(res.data.data))
      .catch(() => message.error("โหลด permission ไม่สำเร็จ"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [selectedRole]);

  function permissionFor(menuKey: string): RolePermission {
    return (
      permissions.find((p) => p.menuKey === menuKey) ?? {
        menuKey,
        canView: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }
    );
  }

  async function toggle(menuKey: string, field: PermissionField, checked: boolean) {
    if (!selectedRole) return;
    const current = permissionFor(menuKey);
    const next = { ...current, [field]: checked };
    const savingId = `${menuKey}-${field}`;
    setSavingKey(savingId);

    // อัปเดต UI ทันที (optimistic) แล้วค่อยยืนยันกับ server
    setPermissions((prev) => {
      const rest = prev.filter((p) => p.menuKey !== menuKey);
      return [...rest, next];
    });

    try {
      await adminApi.updateRolePermission(selectedRole, menuKey, {
        canView: next.canView,
        canCreate: next.canCreate,
        canUpdate: next.canUpdate,
        canDelete: next.canDelete,
      });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      message.error(msg ?? "บันทึก permission ไม่สำเร็จ");
      setPermissions((prev) => {
        const rest = prev.filter((p) => p.menuKey !== menuKey);
        return [...rest, current];
      });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="สิทธิ์การเข้าถึงเมนู"
        subtitle="เลือก role แล้วติ๊กสิทธิ์ต่อเมนู — บันทึกทันทีที่เปลี่ยน"
      />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-[13px] text-black/60">Role:</span>
        <Select
          value={selectedRole}
          onChange={setSelectedRole}
          style={{ width: 220 }}
          options={roles.map((r) => ({ value: r.name, label: `${r.label} (${r.name})` }))}
        />
      </div>

      <Table
        rowKey="key"
        loading={loading}
        dataSource={MENUS}
        pagination={false}
        scroll={{ x: "max-content" }}
        columns={[
          { title: "เมนู", dataIndex: "label", key: "label" },
          ...(
            [
              { field: "canView" as const, title: "ดู" },
              { field: "canCreate" as const, title: "เพิ่ม" },
              { field: "canUpdate" as const, title: "แก้ไข" },
              { field: "canDelete" as const, title: "ลบ" },
            ] as const
          ).map(({ field, title }) => ({
            title,
            key: field,
            align: "center" as const,
            render: (_: unknown, menu: { key: string }) => (
              <Checkbox
                checked={permissionFor(menu.key)[field]}
                disabled={savingKey === `${menu.key}-${field}`}
                onChange={(e) => toggle(menu.key, field, e.target.checked)}
              />
            ),
          })),
        ]}
      />
    </div>
  );
}
