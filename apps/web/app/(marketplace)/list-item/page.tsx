import { ListItemForm } from "@/modules/products/components/ListItemForm";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default function Page() {
  return (
    <AuthGuard>
      <ListItemForm />
    </AuthGuard>
  );
}
