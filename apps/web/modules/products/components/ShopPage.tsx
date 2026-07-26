"use client";

import { useEffect, useState } from "react";
import { SkateboardDoodle } from "@/shared/components/BrandDoodles";
import { useMasterStore } from "@/store/masterStore";
import { productsApi } from "../services/productsApi";
import type { ProductCardData } from "../types";
import { ProductCard } from "./ProductCard";

const PAGE_SIZE = 24;

type Props = {
  initialCategory?: string | null;
};

export function ShopPage({ initialCategory = null }: Props) {
  const { categories, loaded, fetchCategories } = useMasterStore();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);

  useEffect(() => {
    if (!loaded) void fetchCategories();
  }, [loaded, fetchCategories]);

  // debounce ช่องค้นหา — ไม่ยิง API ทุก keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // โหลดหน้า 1 ใหม่ทุกครั้งที่ตัวกรอง (ค้นหา/หมวด) เปลี่ยน — server-side filter
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsApi
      .getProducts({
        q: debouncedQuery || undefined,
        category: activeCategory || undefined,
        page: 1,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.data);
        setTotal(res.data.total);
        setPage(1);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, activeCategory]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await productsApi.getProducts({
        q: debouncedQuery || undefined,
        category: activeCategory || undefined,
        page: next,
        pageSize: PAGE_SIZE,
      });
      setProducts((prev) => [...prev, ...res.data.data]);
      setPage(next);
    } catch {
      // เงียบไว้ — ปุ่มยังกดใหม่ได้
    } finally {
      setLoadingMore(false);
    }
  }

  const hasMore = products.length < total;
  const activeCategoryName = activeCategory
    ? (categories.find((c) => c.slug === activeCategory)?.name ?? null)
    : null;
  const title = debouncedQuery
    ? `ผลการค้นหา "${debouncedQuery}"`
    : (activeCategoryName ?? "สินค้าทั้งหมด");

  return (
    <div className="bg-white">
      {/* search + category strip */}
      <div className="border-b border-black/10 bg-black/[.02]">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 overflow-x-auto px-4 py-3.5 md:px-8">
          <div className="focus-within:border-brand-600 flex h-[37px] w-[190px] flex-none items-center gap-2.5 rounded-full border-[1.5px] border-black/[.14] bg-white px-4 transition-colors sm:w-[280px]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(10,10,10,.5)"
              strokeWidth="2"
              className="flex-none"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา กล้อง เต็นท์ ชุด สว่าน…"
              className="w-full border-0 bg-transparent text-[13.5px] text-black outline-none"
            />
          </div>
          <div className="h-6 w-px flex-none bg-black/10" />
          <div className="flex flex-none gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex-none whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors"
              style={
                !activeCategory
                  ? { borderColor: "#2D5DA8", background: "#2D5DA8", color: "#fff" }
                  : { borderColor: "rgba(10,10,10,.15)", background: "#fff", color: "#0a0a0a" }
              }
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className="flex-none whitespace-nowrap rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors"
                style={
                  activeCategory === c.slug
                    ? { borderColor: "#2D5DA8", background: "#2D5DA8", color: "#fff" }
                    : { borderColor: "rgba(10,10,10,.15)", background: "#fff", color: "#0a0a0a" }
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* product grid */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-9 md:px-8">
        <div className="mb-6">
          <h1 className="font-arch flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-.025em] text-black">
            <SkateboardDoodle className="text-brand-400" size={28} />
            {title}
          </h1>
          <p className="mt-1.5 text-[14px] text-black/50">มีให้เช่าตอนนี้ {total} รายการ</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-brand-100 aspect-square animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-9 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="border-brand-600 text-brand-600 hover:bg-brand-600 rounded-full border-[1.5px] bg-white px-8 py-3 text-[15px] font-semibold transition-colors hover:text-white disabled:opacity-50"
                >
                  {loadingMore ? "กำลังโหลด…" : "โหลดเพิ่ม"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-black/50">
            <div className="font-arch mb-1.5 text-[20px] font-bold text-black">ไม่พบรายการ</div>
            <div className="text-[14px]">ลองค้นหาหรือเลือกหมวดอื่น</div>
          </div>
        )}
      </section>
    </div>
  );
}
