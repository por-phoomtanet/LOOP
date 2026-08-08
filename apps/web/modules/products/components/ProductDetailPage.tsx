"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { RentalRequestModal } from "@/modules/rentals/components/RentalRequestModal";
import { productsApi } from "../services/productsApi";
import type { ProductDetail } from "../types";
import { ProductCard } from "./ProductCard";

type Props = {
  productId: number;
};

export function ProductDetailPage({ productId }: Props) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [rentModalOpen, setRentModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    productsApi
      .getProduct(productId)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.data.data);
        setActiveImage(0);
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
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="bg-brand-100 aspect-square animate-pulse rounded-2xl" />
          <div className="flex flex-col gap-3">
            <div className="h-7 w-2/3 animate-pulse rounded bg-black/10" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-black/10" />
            <div className="h-24 w-full animate-pulse rounded bg-black/10" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 text-center md:px-8">
        <div className="font-arch mb-1.5 text-[22px] font-bold text-black">ไม่พบสินค้านี้</div>
        <p className="mb-6 text-[14px] text-black/50">สินค้านี้อาจถูกลบหรือหยุดให้เช่าไปแล้ว</p>
        <Link
          href="/shop"
          className="border-brand-600 text-brand-600 hover:bg-brand-600 inline-block rounded-full border-[1.5px] bg-white px-6 py-2.5 text-[14px] font-semibold transition-colors hover:text-white"
        >
          กลับไปหน้าสินค้าทั้งหมด
        </Link>
      </div>
    );
  }

  const priceText = Number(product.pricePerDay).toLocaleString("th-TH");

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8">
        <Link
          href="/shop"
          className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-black/50 hover:text-black"
        >
          ← กลับไปหน้าสินค้าทั้งหมด
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* gallery */}
          <div>
            <div className="bg-brand-100 relative aspect-square overflow-hidden rounded-2xl">
              {product.images.length > 0 ? (
                // eslint-disable-next-line
                <img
                  src={resolveUploadUrl(product.images[activeImage])}
                  alt={product.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="from-brand-200 to-brand-400 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
                  <span className="font-arch text-6xl font-extrabold text-white/80">
                    {product.title.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 flex-none overflow-hidden rounded-lg border-2 transition-colors ${
                      i === activeImage ? "border-brand-600" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line */}
                    <img
                      src={resolveUploadUrl(url)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* info */}
          <div>
            <div className="text-brand-600 mb-1.5 text-[12.5px] font-medium">
              {product.categoryName}
            </div>
            <h1 className="font-arch mb-2 text-[24px] font-extrabold tracking-[-.02em] text-black sm:text-[28px]">
              {product.title}
            </h1>
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-black/55">
              <span>
                {product.reviewCount > 0
                  ? `★ ${product.ratingAvg.toFixed(1)} (${product.reviewCount} รีวิว)`
                  : "ยังไม่มีรีวิว"}
              </span>
              <span>·</span>
              <span>{product.location}</span>
            </div>

            <div className="mb-5 flex items-baseline gap-1.5">
              <span className="font-arch text-brand-600 text-[28px] font-extrabold tracking-[-.02em]">
                ฿{priceText}
              </span>
              <span className="text-[14px] text-black/50">/ วัน</span>
            </div>
            {product.priceTiers.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {product.priceTiers.map((t) => (
                  <span
                    key={t.days}
                    className="rounded-full border border-black/10 bg-black/[.03] px-3 py-1.5 text-[12.5px] font-medium text-black/65"
                  >
                    {t.days} วัน ฿{Number(t.price).toLocaleString("th-TH")}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setRentModalOpen(true)}
              className="bg-brand-600 mb-6 w-full rounded-full py-3.5 text-[15px] font-bold text-white sm:w-auto sm:px-10"
            >
              เช่าสินค้านี้
            </button>

            <div className="mb-6 border-t border-black/10 pt-5">
              <h2 className="mb-2 text-[14px] font-semibold text-black">รายละเอียด</h2>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-black/65">
                {product.description}
              </p>
            </div>

            {product.pickupOptions.length > 0 && (
              <div className="mb-6 border-t border-black/10 pt-5">
                <h2 className="mb-2 text-[14px] font-semibold text-black">การรับสินค้า</h2>
                <div className="flex flex-col gap-1.5">
                  {product.pickupOptions.map((o, i) => (
                    <div key={i} className="text-[13.5px] text-black/65">
                      • {o.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-black/10 pt-5">
              <h2 className="mb-2 text-[14px] font-semibold text-black">ผู้ให้เช่า</h2>
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-600 flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white">
                  {product.ownerName.trim()[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="text-[14px] font-semibold text-black">{product.ownerName}</span>
              </div>
            </div>
          </div>
        </div>

        {product.similar.length > 0 && (
          <div className="mt-14">
            <h2 className="font-arch mb-5 text-[20px] font-extrabold tracking-[-.02em] text-black">
              สินค้าคล้ายกัน
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {product.similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {rentModalOpen && (
        <RentalRequestModal
          productId={product.id}
          productTitle={product.title}
          onClose={() => setRentModalOpen(false)}
        />
      )}
    </div>
  );
}
