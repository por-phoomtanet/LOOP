"use client";

import { useRouter } from "next/navigation";
import { formatShortLocation, resolveUploadUrl } from "@/shared/lib/utils";
import type { ProductCardData } from "../types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const shopInitial = product.ownerName.trim()[0]?.toUpperCase() ?? "?";
  const priceText = Number(product.pricePerDay).toLocaleString("th-TH");

  return (
    <div
      onClick={() => router.push(`/products/${product.id}`)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
    >
      <div className="bg-brand-100 relative aspect-square overflow-hidden">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line
          <img
            src={resolveUploadUrl(product.thumbnailUrl)}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 hover:scale-[1.03]"
          />
        ) : (
          <div className="from-brand-200 to-brand-400 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
            <span className="font-arch text-4xl font-extrabold text-white/80">{shopInitial}</span>
          </div>
        )}
        <button
          aria-label="บันทึก"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2.5 top-2.5 z-[2] flex h-[34px] w-[34px] items-center justify-center rounded-full border-0 bg-white/90 transition-transform hover:scale-110"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2D5DA8"
            strokeWidth="1.8"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-[12px] font-semibold leading-tight tracking-[-.01em] text-black sm:text-[15px]">
          {product.title}
        </h3>
        <div className="mt-1 text-[11.5px] text-black/50 sm:text-[13px]">
          {formatShortLocation(product.location)}
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="font-arch text-brand-600 text-[16px] font-extrabold tracking-[-.02em] sm:text-[19px]">
            ฿{priceText}
          </span>
          <span className="text-[11.5px] text-black/50 sm:text-[13px]">/ วัน</span>
        </div>
        {product.priceTiers.length > 0 && (
          <div className="mt-1 hidden text-[11.5px] text-black/45 sm:block">
            {product.priceTiers
              .map((t) => `${t.days} วัน ฿${Number(t.price).toLocaleString("th-TH")}`)
              .join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
