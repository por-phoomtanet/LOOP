"use client";

import {
  AppstoreOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  LeftOutlined,
  RightOutlined,
  SafetyOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePermissionStore } from "@/store/permissionStore";

const COLLAPSE_KEY = "loop-admin-sidebar-collapsed";

type NavItem = {
  menuKey: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  ready: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    menuKey: "dashboard",
    label: "แดชบอร์ด",
    href: "/dashboard",
    icon: <DashboardOutlined />,
    ready: true,
  },
];

const MASTER_DATA_ITEMS: NavItem[] = [
  {
    menuKey: "categories",
    label: "ประเภทสินค้า",
    href: "/categories",
    icon: <AppstoreOutlined />,
    ready: true,
  },
  { menuKey: "users", label: "ผู้ใช้", href: "/users", icon: <TeamOutlined />, ready: true },
  {
    menuKey: "roles",
    label: "บทบาทและสิทธิ์",
    href: "/roles",
    icon: <SafetyOutlined />,
    ready: true,
  },
  { menuKey: "products", label: "สินค้า", href: "/products", icon: <ShopOutlined />, ready: true },
  {
    menuKey: "payments",
    label: "การชำระเงิน",
    href: "/payments",
    icon: <CreditCardOutlined />,
    ready: false,
  },
  {
    menuKey: "settings",
    label: "ตั้งค่า",
    href: "/settings",
    icon: <SettingOutlined />,
    ready: false,
  },
];

function NavLink({
  item,
  collapsed,
  active,
  mounted,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  mounted: boolean;
}) {
  const canView = usePermissionStore((s) => s.canView(item.menuKey));

  // ก่อน mounted (SSR + first client paint) permissionStore ยังไม่ rehydrate จาก localStorage
  // ต้องซ่อนไว้ก่อนเสมอเพื่อให้ server/client render ตรงกัน (กัน hydration mismatch)
  if (item.ready && (!mounted || !canView)) return null;

  const content = (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors"
      style={{
        background: active ? "#3b5bfd" : "transparent",
        color: item.ready ? (active ? "#fff" : "rgba(255,255,255,.75)") : "rgba(255,255,255,.3)",
        cursor: item.ready ? "pointer" : "default",
      }}
    >
      <span className="flex-none text-[16px]">{item.icon}</span>
      {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
      {!collapsed && !item.ready && (
        <span className="flex-none rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
          เร็วๆ นี้
        </span>
      )}
    </div>
  );

  const wrapped = collapsed ? (
    <Tooltip
      title={item.ready ? item.label : `${item.label} (เร็วๆ นี้)`}
      placement="right"
      mouseEnterDelay={0.1}
    >
      {content}
    </Tooltip>
  ) : (
    content
  );

  if (!item.ready) return wrapped;
  return (
    <Link href={item.href} className="block">
      {wrapped}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  // เริ่มต้นเป็นพับเสมอ ยกเว้นผู้ใช้เคยกดขยายไว้ (จำค่าผ่าน localStorage)
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) !== "0");
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className="flex h-screen flex-none flex-col bg-[#0a0e27] transition-[width] duration-150"
      style={{ width: collapsed ? 64 : 232 }}
    >
      <div className="flex h-14 flex-none items-center justify-center px-4">
        {collapsed ? (
          <Image
            src="/icon.png"
            alt="renty admin"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-contain"
          />
        ) : (
          <Image
            src="/brand/renty-logo.png"
            alt="renty admin"
            width={140}
            height={136}
            className="h-9 w-auto rounded-md object-contain"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.menuKey}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
            mounted={mounted}
          />
        ))}

        {!collapsed && (
          <div className="mb-1.5 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/30">
            ข้อมูลหลัก
          </div>
        )}

        {MASTER_DATA_ITEMS.map((item) => (
          <NavLink
            key={item.menuKey}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
            mounted={mounted}
          />
        ))}
      </nav>

      <button
        onClick={toggleCollapsed}
        className="flex h-11 flex-none items-center justify-center border-0 border-t border-white/10 bg-transparent text-white/50 hover:text-white"
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>
    </aside>
  );
}
