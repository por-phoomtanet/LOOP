import { ShopPage } from "@/modules/products/components/ShopPage";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return (
    <>
      <Header />
      <ShopPage initialCategory={category ?? null} />
      <Footer />
    </>
  );
}
