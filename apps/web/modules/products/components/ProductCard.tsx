"use client";

import { resolveUploadUrl } from "@/shared/lib/utils";
import type { ProductCardData } from "../types";

const SHOP_COLORS = ["#2D5DA8", "#6FA3D8", "#c96442", "#178a5a", "#a8752f"];

export function ProductCard({ product }: { product: ProductCardData }) {
  const shopColor = SHOP_COLORS[product.id % SHOP_COLORS.length];
  const shopInitial = product.ownerName.trim()[0]?.toUpperCase() ?? "?";
  const priceText = Number(product.pricePerDay).toLocaleString("th-TH");

  return (
    <div className="flex cursor-pointer flex-col">
      <div className="bg-brand-100 relative aspect-square overflow-hidden rounded-2xl">
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

      <div className="px-0.5 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-semibold leading-tight tracking-[-.01em] text-black">
            {product.title}
          </h3>
          <span className="whitespace-nowrap text-[12.5px] font-medium text-black/55">
            ★ {product.ratingAvg.toFixed(1)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9.5px] font-bold text-white"
            style={{ background: shopColor }}
          >
            {shopInitial}
          </span>
          <span className="text-[12.5px] font-semibold text-black/65">{product.ownerName}</span>
        </div>
        <div className="mt-0.5 text-[13px] text-black/50">
          {product.categoryName} · {product.location}
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="font-arch text-brand-600 text-[19px] font-extrabold tracking-[-.02em]">
            ฿{priceText}
          </span>
          <span className="text-[13px] text-black/50">/ วัน</span>
        </div>
      </div>
    </div>
  );
}
