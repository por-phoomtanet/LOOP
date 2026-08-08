import { ProductDetailModal } from "@/modules/products/components/ProductDetailModal";

export default async function Modal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailModal productId={Number(id)} />;
}
