import { CategoryTable } from "@/modules/admin/components/CategoryTable";
import { PermissionGuard } from "@/shared/guards/PermissionGuard";

export default function Page() {
  return (
    <PermissionGuard menuKey="categories">
      <CategoryTable />
    </PermissionGuard>
  );
}
