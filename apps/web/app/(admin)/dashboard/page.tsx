import { DashboardStats } from "@/modules/admin/components/DashboardStats";
import { PermissionGuard } from "@/shared/guards/PermissionGuard";

export default function Page() {
  return (
    <PermissionGuard menuKey="dashboard">
      <DashboardStats />
    </PermissionGuard>
  );
}
