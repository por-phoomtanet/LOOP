import { UserTable } from "@/modules/admin/components/UserTable";
import { PermissionGuard } from "@/shared/guards/PermissionGuard";

export default function Page() {
  return (
    <PermissionGuard menuKey="users">
      <UserTable />
    </PermissionGuard>
  );
}
