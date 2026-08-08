import { CheckoutPage } from "@/modules/rentals/components/CheckoutPage";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return (
    <>
      <Header />
      <AuthGuard>
        <CheckoutPage productId={Number(productId)} />
      </AuthGuard>
      <Footer />
    </>
  );
}
