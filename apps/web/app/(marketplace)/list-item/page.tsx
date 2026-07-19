import { ListItemPage } from "@/modules/products/components/ListItemPage";
import { Header } from "@/shared/components/Header";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default function Page() {
  return (
    <Header>
      <AuthGuard>
        <ListItemPage />
      </AuthGuard>
    </Header>
  );
}
