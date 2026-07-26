"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/constants";
import {
  HeartDoodle,
  PawDoodle,
  ScatterDoodles,
  SkateboardDoodle,
  StarDoodle,
} from "@/shared/components/BrandDoodles";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { useMasterStore } from "@/store/masterStore";
import { productsApi } from "../services/productsApi";
import type { Category, ProductCardData } from "../types";
import { ProductCard } from "./ProductCard";

const CATEGORY_GRADIENTS = [
  "linear-gradient(135deg,#2D5DA8,#6FA3D8)",
  "linear-gradient(135deg,#c96442,#e0a58f)",
  "linear-gradient(135deg,#178a5a,#7bcca6)",
  "linear-gradient(135deg,#a8752f,#d8b483)",
  "linear-gradient(135deg,#5b3fa8,#a08fd8)",
];

const STEPS = [
  {
    no: "01",
    title: "ค้นหา",
    body: "ค้นตามหมวดหรือทำเล เทียบเจ้าของจากคะแนนรีวิว และเช็ควันว่างจริงบนปฏิทิน",
  },
  {
    no: "02",
    title: "จองวันเช่า",
    body: "เลือกวันที่ต้องการ จ่ายอย่างปลอดภัยพร้อมเงินมัดจำที่คืนได้เมื่อส่งของกลับ",
  },
  {
    no: "03",
    title: "รับและคืน",
    body: "นัดรับกับเจ้าของหรือให้จัดส่ง ทุกการเช่ายืนยันตัวตนและคุ้มครองความเสียหาย",
  },
];

const REVIEWS = [
  {
    quote: "เช่าชุดกล้องครบเซ็ตไปถ่ายงานสุดสัปดาห์ — ถูกกว่าร้านเช่าและเจ้าของน่ารักมาก",
    name: "ณภัทร ต.",
    role: "เช่า Sony A7 IV",
  },
  {
    quote: "เอาโดรนเก่ามาปล่อยเช่า แทบจะคืนทุนแล้ว ระบบมัดจำทำให้ไม่ต้องกังวลเลย",
    name: "พลอย ส.",
    role: "เจ้าของ · เช่าไปแล้ว 60+ ครั้ง",
  },
  {
    quote: "ต้องใช้เต็นท์แค่ทริปเดียว ไม่คุ้มที่จะซื้อ จองห้านาที รับใกล้บ้าน เพอร์เฟกต์",
    name: "กฤต ป.",
    role: "เช่าเต็นท์โดม",
  },
];

const PAGE_SIZE = 12;

export function HomePage() {
  const router = useRouter();
  const { categories, loaded, fetchCategories } = useMasterStore();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [stepsVisible, setStepsVisible] = useState(false);
  const stepsSectionRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  // แยกการ "ปัดเลื่อน" ออกจาก "แตะ/คลิก" ของการ์ดหมวดหมู่ — กันปัดแล้วดันไปเปิดหน้า shop โดยไม่ตั้งใจ
  const categoryDragRef = useRef({ startX: 0, dragged: false });

  // เล่น animation ของ "สามขั้นตอน" ครั้งเดียวตอนเลื่อนเข้ามาในจอ
  useEffect(() => {
    const el = stepsSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStepsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
  }, [debouncedQuery]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await productsApi.getProducts({
        q: debouncedQuery || undefined,
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

  function renderCategoryTile(cat: Category, i: number) {
    return (
      <button
        key={cat.id}
        onClick={(e) => {
          if (categoryDragRef.current.dragged) {
            e.preventDefault();
            return;
          }
          router.push(`${ROUTES.shop}?category=${encodeURIComponent(cat.slug)}`);
        }}
        className="relative aspect-[3/4] w-full snap-start overflow-hidden rounded-2xl text-left transition-transform hover:-translate-y-1"
        style={
          cat.imageUrl
            ? undefined
            : { background: CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length] }
        }
      >
        {cat.imageUrl && (
          // eslint-disable-next-line
          <img
            src={resolveUploadUrl(cat.imageUrl)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-x-4 bottom-4">
          <div className="font-arch text-[19px] font-bold tracking-[-.01em] text-white">
            {cat.name}
          </div>
          <div className="mt-0.5 text-[12.5px] text-white/80">{cat.productCount ?? 0} รายการ</div>
        </div>
      </button>
    );
  }

  function scrollCategories(direction: "left" | "right") {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth : el.clientWidth,
      behavior: "smooth",
    });
  }

  function prevReview() {
    setReviewIndex((i) => (i - 1 + REVIEWS.length) % REVIEWS.length);
  }

  function nextReview() {
    setReviewIndex((i) => (i + 1) % REVIEWS.length);
  }

  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 px-4 pb-8 pt-10 md:grid-cols-2 md:px-8 md:pb-10 md:pt-14">
        <ScatterDoodles />
        <div className="relative z-10">
          <div className="bg-brand-50 border-brand-200 mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold text-brand-600 sm:mb-5">
            🐾 ride together, stay happy
          </div>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[.14em] text-black/45 sm:mb-4 sm:text-[12px]">
            เช่าต่อกันแบบ P2P
          </div>
          <h1 className="font-arch text-[32px] font-extrabold tracking-[-0.02em] text-black leading-[1] sm:text-[44px] sm:tracking-[-0.04em] sm:leading-[0.95] md:text-[50px]">
            <span className="block">เช่าอะไรก็ได้</span>
            <span className="block mt-1">จากผู้คน</span>
            <span className="block mt-1 text-brand-600">ใกล้ตัวคุณ</span>
          </h1>
          <p className="mt-4 max-w-[460px] text-[14.5px] leading-relaxed text-black/60 sm:mt-5 sm:text-[16px]">
            ยืมอุปกรณ์ที่ต้องใช้เป็นวัน สุดสัปดาห์ หรือทั้งทริป —
            และสร้างรายได้จากของที่คุณมีอยู่แล้ว
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            <a
              href="#browse"
              className="bg-brand-600 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 sm:px-[30px] sm:py-[15px] sm:text-[15px]"
            >
              เริ่มเลือกดู
            </a>
            <Link
              href={ROUTES.listItem}
              className="rounded-full border-[1.5px] border-black/15 bg-white px-5 py-3 text-[14px] font-semibold text-black transition-colors hover:border-black/40 sm:px-[26px] sm:py-[15px] sm:text-[15px]"
            >
              ลงประกาศ →
            </Link>
          </div>
        </div>
        <div className="relative z-10 hidden grid-cols-2 grid-rows-2 gap-3.5 md:grid md:h-[420px]">
          <div
            className="row-span-2 rounded-2xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=700&h=900&fit=crop&crop=entropy&q=80&auto=format)",
            }}
          />
          <div
            className="rounded-2xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&h=400&fit=crop&crop=entropy&q=80&auto=format)",
            }}
          />
          <div
            className="rounded-2xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=400&fit=crop&crop=entropy&q=80&auto=format)",
            }}
          />
        </div>
      </section>

      {/* search */}
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 md:px-8">
        <div className="focus-within:border-brand-600 flex h-11 max-w-[480px] items-center gap-2.5 rounded-full border-[1.5px] border-black/[.14] bg-white px-[18px] transition-colors">
          <svg
            width="16"
            height="16"
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
            className="w-full border-0 bg-transparent text-[14px] text-black outline-none"
          />
        </div>
      </div>

      {/* product grid */}
      <section id="browse" className="mx-auto w-full max-w-[1280px] px-4 pb-2 pt-9 md:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-arch flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-.025em] text-black">
              <SkateboardDoodle className="text-brand-400" size={28} />
              สินค้าแนะนำ
            </h2>
            <p className="mt-1.5 text-[14px] text-black/50">มีให้เช่าตอนนี้ {total} รายการ</p>
          </div>
          <Link
            href={ROUTES.shop}
            className="text-brand-600 border-brand-600 border-b-[1.5px] pb-0.5 text-[14px] font-semibold"
          >
            ดูทั้งหมด →
          </Link>
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

      {/* browse by category */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-2 pt-16 md:px-8">
        <h2 className="font-arch mb-6 flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-.025em] text-black">
          <StarDoodle className="text-brand-yellow" size={28} />
          เลือกตามหมวดหมู่
        </h2>
        {/* มือถือ: แบ่งเป็นหน้าๆ ละ 4 กล่อง (2x2) เลื่อนทีละหน้าเต็มจอ — เลี่ยง grid-auto-columns
            แบบ % เพราะ WebKit/Safari จริงคำนวณผิดจนกล่องหาย ใช้ grid-cols-2 ธรรมดาในแต่ละหน้าแทน */}
        <div className="relative sm:hidden">
          <div
            ref={categoryScrollRef}
            onPointerDown={(e) => {
              categoryDragRef.current = { startX: e.clientX, dragged: false };
            }}
            onPointerMove={(e) => {
              if (Math.abs(e.clientX - categoryDragRef.current.startX) > 8) {
                categoryDragRef.current.dragged = true;
              }
            }}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: Math.ceil(categories.length / 4) }, (_, pageIndex) => (
              <div key={pageIndex} className="grid w-full flex-none snap-start grid-cols-2 gap-3">
                {categories
                  .slice(pageIndex * 4, pageIndex * 4 + 4)
                  .map((cat, i) => renderCategoryTile(cat, pageIndex * 4 + i))}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollCategories("left")}
            aria-label="เลื่อนหมวดหมู่ไปทางซ้าย"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/70 text-black/50 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            aria-label="เลื่อนหมวดหมู่ไปทางขวา"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/70 text-black/50 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/90"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="hidden gap-5 sm:grid sm:grid-cols-5">
          {categories.map((cat, i) => renderCategoryTile(cat, i))}
        </div>
      </section>

      {/* how it works */}
      <section
        ref={stepsSectionRef}
        className="bg-brand-600 relative mt-16 overflow-hidden text-white"
      >
        <PawDoodle className="absolute -right-4 top-8 text-white/10" size={120} />
        <SkateboardDoodle className="absolute -left-6 bottom-6 text-white/10" size={130} />
        <StarDoodle className="absolute right-[22%] top-10 text-white/10" size={40} />
        <div className="relative mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-8 sm:py-16">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[.14em] text-white/50 sm:mb-4 sm:text-[12px]">
            วิธีใช้งาน
          </div>
          <h2 className="font-arch mb-8 max-w-[640px] text-[34px] font-extrabold leading-[1.15] tracking-[-.02em] sm:mb-12 sm:text-[34px] sm:leading-[1.05] sm:tracking-[-.03em] md:text-[38px]">
            สามขั้นตอน
          </h2>

          {/* มือถือ: ไทม์ไลน์แนวตั้ง (เลขวงกลม + เส้นเชื่อม) เล่น animation ทีละสเต็ปตอนเลื่อนเข้าจอ */}
          <div className="flex flex-col sm:hidden">
            {STEPS.map((s, i) => (
              <div key={s.no} className="flex gap-4">
                <div className="flex flex-none flex-col items-center">
                  <span
                    className="font-arch bg-brand-50 text-brand-600 flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-extrabold transition-all duration-500 ease-out"
                    style={{
                      opacity: stepsVisible ? 1 : 0,
                      transform: stepsVisible ? "scale(1)" : "scale(.4)",
                      transitionDelay: `${i * 220}ms`,
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className="my-1 w-px flex-1 bg-white/25 transition-transform duration-500 ease-out"
                      style={{
                        transform: stepsVisible ? "scaleY(1)" : "scaleY(0)",
                        transformOrigin: "top",
                        transitionDelay: `${i * 220 + 150}ms`,
                      }}
                      aria-hidden
                    />
                  )}
                </div>
                <div
                  className={`transition-all duration-500 ease-out ${i < STEPS.length - 1 ? "pb-7" : ""}`}
                  style={{
                    opacity: stepsVisible ? 1 : 0,
                    transform: stepsVisible ? "translateY(0)" : "translateY(10px)",
                    transitionDelay: `${i * 220 + 100}ms`,
                  }}
                >
                  <h3 className="font-arch mb-1.5 text-[17px] font-bold tracking-[-.02em]">
                    {s.title}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed text-white/70">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden gap-5 sm:grid sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.no}
                className="border-t-[1.5px] border-white/25 pt-5 transition-all duration-500 ease-out"
                style={{
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: `${i * 150}ms`,
                }}
              >
                <div className="font-arch mb-4 text-[14px] font-bold text-white/50">{s.no}</div>
                <h3 className="font-arch mb-2.5 text-[22px] font-bold tracking-[-.02em]">
                  {s.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* reviews */}
      <section className="mx-auto w-full max-w-[1280px] px-8 py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <h2 className="font-arch flex items-center gap-2 whitespace-nowrap text-[20px] font-extrabold tracking-[-.02em] text-black sm:gap-2.5 sm:text-[30px] sm:tracking-[-.025em]">
            <HeartDoodle className="text-brand-600 h-5 w-5 flex-none sm:h-7 sm:w-7" size={28} />
            ได้รับความไว้วางใจจากชุมชน
          </h2>
          <div className="flex items-center gap-2 text-[14px] text-black/55">
            <span className="font-arch text-brand-600 text-[20px] font-extrabold">4.9</span>{" "}
            คะแนนเฉลี่ยจาก 8,200 การเช่า
          </div>
        </div>
        {/* มือถือ: การ์ดเดียว เลื่อนด้วยลูกศรซ้าย/ขวา */}
        <div className="md:hidden">
          <div className="relative rounded-2xl border border-black/10 p-5">
            <div className="text-brand-600 mb-3 text-[13px] tracking-[.1em]">★★★★★</div>
            <p className="mb-4 text-[14px] leading-relaxed text-black">
              {REVIEWS[reviewIndex].quote}
            </p>
            <div className="text-[13px] font-semibold text-black">{REVIEWS[reviewIndex].name}</div>
            <div className="text-[12px] text-black/50">{REVIEWS[reviewIndex].role}</div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={prevReview}
              aria-label="รีวิวก่อนหน้า"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-black/15 text-black/60 transition-colors hover:border-black/35 hover:text-black"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex gap-1.5">
              {REVIEWS.map((r, i) => (
                <span
                  key={r.name}
                  className="h-1.5 w-1.5 rounded-full transition-colors"
                  style={{ background: i === reviewIndex ? "#2D5DA8" : "rgba(10,10,10,.15)" }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={nextReview}
              aria-label="รีวิวถัดไป"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-black/15 text-black/60 transition-colors hover:border-black/35 hover:text-black"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="hidden gap-5 md:grid md:grid-cols-3">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-2xl border border-black/10 p-6">
              <div className="text-brand-600 mb-3.5 text-[14px] tracking-[.1em]">★★★★★</div>
              <p className="mb-5 text-[15px] leading-relaxed text-black">{r.quote}</p>
              <div className="text-[14px] font-semibold text-black">{r.name}</div>
              <div className="text-[12.5px] text-black/50">{r.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 md:px-8">
        <div className="border-brand-600 flex flex-wrap items-center justify-between gap-6 rounded-[22px] border-[1.5px] p-6 sm:gap-10 sm:p-10 md:p-14">
          <div>
            <h2 className="font-arch mb-2.5 whitespace-nowrap text-[18px] font-extrabold leading-[1.05] tracking-[-.02em] text-black sm:text-[30px] sm:tracking-[-.03em] md:text-[34px]">
              มีของที่วางทิ้งไว้เฉยๆ ไหม?
            </h2>
            <p className="max-w-[480px] text-[16px] text-black/60">
              ลงประกาศในไม่กี่นาทีแล้วสร้างรายได้ คุณกำหนดราคา วันที่ และเงินมัดจำเองได้
            </p>
          </div>
          <Link
            href={ROUTES.listItem}
            className="bg-brand-600 flex-none whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 sm:px-9 sm:py-[17px] sm:text-[16px]"
          >
            ลงประกาศชิ้นแรก
          </Link>
        </div>
      </section>
    </div>
  );
}
