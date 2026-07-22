import { MyListingsTable } from "@/modules/products/components/MyListingsTable";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default function Page() {
  return (
    <>
      <Header />
      <AuthGuard>
        <MyListingsTable />
      </AuthGuard>
      <Footer />
    </>
  );
}
