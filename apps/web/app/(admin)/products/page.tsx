import { ProductTable } from "@/modules/admin/components/ProductTable";
import { PermissionGuard } from "@/shared/guards/PermissionGuard";

export default function Page() {
  return (
    <PermissionGuard menuKey="products">
      <ProductTable />
    </PermissionGuard>
  );
}
