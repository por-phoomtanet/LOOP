"use client";

import Link from "next/link";
import { ProductDetailView } from "./ProductDetailView";

type Props = {
  productId: number;
};

export function ProductDetailPage({ productId }: Props) {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8">
        <Link
          href="/shop"
          className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-black/50 hover:text-black"
        >
          ← กลับไปหน้าสินค้าทั้งหมด
        </Link>
        <ProductDetailView productId={productId} />
      </div>
    </div>
  );
}
