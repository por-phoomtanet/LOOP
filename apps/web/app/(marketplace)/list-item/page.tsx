import { ListItemForm } from "@/modules/products/components/ListItemForm";
import { Header } from "@/shared/components/Header";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default function Page() {
  return (
    <>
      <Header />
      <AuthGuard>
        <ListItemForm />
      </AuthGuard>
    </>
  );
}
