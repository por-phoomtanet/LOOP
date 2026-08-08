"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { productsApi } from "@/modules/products/services/productsApi";
import type { ProductDetail } from "@/modules/products/types";
import { RentalRequestForm } from "./RentalRequestForm";

type Props = {
  productId: number;
};

export function CheckoutPage({ productId }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .getProduct(productId)
      .then((res) => {
        if (!cancelled) setProduct(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[460px] px-6 py-24 text-center text-[14px] text-black/50">
        กำลังโหลด…
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto flex max-w-[460px] flex-col items-center px-6 py-24 text-center">
        <p className="mb-5 text-[14px] text-black/50">ไม่พบสินค้านี้</p>
        <Link
          href="/shop"
          className="rounded-full bg-[#0a0a0a] px-6 py-3 text-[14px] font-semibold text-white"
        >
          กลับไปหน้าสินค้าทั้งหมด
        </Link>
      </div>
    );
  }

  const priceText = Number(product.pricePerDay).toLocaleString("th-TH");

  return (
    <div className="mx-auto w-full max-w-[460px] px-6 py-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        เช่าสินค้า
      </div>
      <h1 className="font-arch mb-5 text-[24px] font-extrabold tracking-[-.02em]">
        {product.title}
      </h1>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[.02] p-3">
        <div className="bg-brand-100 relative h-16 w-16 flex-none overflow-hidden rounded-xl">
          {product.images[0] ? (
            // eslint-disable-next-line
            <img
              src={resolveUploadUrl(product.images[0])}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="from-brand-200 to-brand-400 absolute inset-0 bg-gradient-to-br" />
          )}
        </div>
        <div className="min-w-0 flex-1 truncate text-[13px] text-black/55">{product.location}</div>
        <div className="flex-none text-right">
          <span className="font-arch text-brand-600 text-[17px] font-extrabold">฿{priceText}</span>
          <span className="text-[12px] text-black/50"> / วัน</span>
        </div>
      </div>

      <RentalRequestForm productId={product.id} onCancel={() => router.push("/shop")} />
    </div>
  );
}
