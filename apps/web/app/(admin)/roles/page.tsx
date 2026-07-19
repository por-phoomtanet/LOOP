import { RolesPage } from "@/modules/admin/components/RolesPage";
import { PermissionGuard } from "@/shared/guards/PermissionGuard";

export default function Page() {
  return (
    <PermissionGuard menuKey="roles">
      <RolesPage />
    </PermissionGuard>
  );
}
