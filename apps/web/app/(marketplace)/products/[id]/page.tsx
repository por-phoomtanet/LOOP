import { ProductDetailPage } from "@/modules/products/components/ProductDetailPage";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <ProductDetailPage productId={Number(id)} />
      <Footer />
    </>
  );
}
