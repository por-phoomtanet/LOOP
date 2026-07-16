"use client";

import { useEffect, useState } from "react";
import { Page403 } from "@/shared/components/Page403";
import { usePermissionStore } from "@/store/permissionStore";

export function PermissionGuard({
  children,
  menuKey,
}: {
  children: React.ReactNode;
  menuKey: string;
}) {
  const canView = usePermissionStore((s) => s.canView(menuKey));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!canView) return <Page403 />;
  return <>{children}</>;
}
