import { Suspense } from "react";
import { MyListingsTable } from "@/modules/products/components/MyListingsTable";
import { Header } from "@/shared/components/Header";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default function Page() {
  return (
    <>
      <Header />
      <AuthGuard>
        {/* MyListingsTable ใช้ useSearchParams() (อ่าน ?tab=create) — ต้องมี Suspense ครอบ */}
        <Suspense fallback={null}>
          <MyListingsTable />
        </Suspense>
      </AuthGuard>
    </>
  );
}
