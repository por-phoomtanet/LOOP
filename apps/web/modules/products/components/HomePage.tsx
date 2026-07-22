"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants";
import {
  HeartDoodle,
  PawDoodle,
  ScatterDoodles,
  SkateboardDoodle,
  StarDoodle,
} from "@/shared/components/BrandDoodles";
import { useMasterStore } from "@/store/masterStore";
import { productsApi } from "../services/productsApi";
import type { ProductCardData } from "../types";
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
  const { categories, loaded, fetchCategories } = useMasterStore();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  return (
    <div className="bg-white">
      {/* hero */}
      <section className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 px-8 pb-10 pt-14 md:grid-cols-2">
        <ScatterDoodles />
        <div className="relative z-10">
          <div className="bg-brand-50 border-brand-200 mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold text-brand-600">
            🐾 ride together, stay happy
          </div>
          <div className="mb-4 font-mono text-[12px] uppercase tracking-[.14em] text-black/45">
            เช่าต่อกันแบบ P2P
          </div>
          <h1 className="font-arch text-[44px] font-extrabold leading-[1.02] tracking-[-.035em] text-black md:text-[60px]">
            เช่าอะไรก็ได้
            <br />
            จากผู้คน
            <br />
            <span className="text-brand-600">ใกล้ตัวคุณ</span>
          </h1>
          <p className="mt-5 max-w-[460px] text-[16px] leading-relaxed text-black/60">
            ยืมอุปกรณ์ที่ต้องใช้เป็นวัน สุดสัปดาห์ หรือทั้งทริป —
            และสร้างรายได้จากของที่คุณมีอยู่แล้ว
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#browse"
              className="bg-brand-600 rounded-full px-[30px] py-[15px] text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              เริ่มเลือกดู
            </a>
            <Link
              href={ROUTES.listItem}
              className="rounded-full border-[1.5px] border-black/15 bg-white px-[26px] py-[15px] text-[15px] font-semibold text-black transition-colors hover:border-black/40"
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
      <div className="mx-auto w-full max-w-[1280px] px-8 pt-4">
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
      <section id="browse" className="mx-auto w-full max-w-[1280px] px-8 pb-2 pt-9">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-arch flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-.025em] text-black">
              <SkateboardDoodle className="text-brand-400" size={28} />
              {activeCategory
                ? (categories.find((c) => c.slug === activeCategory)?.name ?? "สินค้าแนะนำ")
                : "สินค้าแนะนำ"}
            </h2>
            <p className="mt-1.5 text-[14px] text-black/50">มีให้เช่าตอนนี้ {total} รายการ</p>
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="text-brand-600 border-brand-600 border-b-[1.5px] pb-0.5 text-[14px] font-semibold"
            >
              ดูทั้งหมด →
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-brand-100 aspect-square animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
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
      <section className="mx-auto w-full max-w-[1280px] px-8 pb-2 pt-16">
        <h2 className="font-arch mb-6 flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-.025em] text-black">
          <StarDoodle className="text-brand-yellow" size={28} />
          เลือกตามหมวดหมู่
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.slug);
                document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl text-left transition-transform hover:-translate-y-1"
              style={{ background: CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length] }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-4 bottom-4">
                <div className="font-arch text-[19px] font-bold tracking-[-.01em] text-white">
                  {cat.name}
                </div>
                <div className="mt-0.5 text-[12.5px] text-white/80">
                  {cat.productCount ?? 0} รายการ
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="bg-brand-600 relative mt-16 overflow-hidden text-white">
        <PawDoodle className="absolute -right-4 top-8 text-white/10" size={120} />
        <SkateboardDoodle className="absolute -left-6 bottom-6 text-white/10" size={130} />
        <StarDoodle className="absolute right-[22%] top-10 text-white/10" size={40} />
        <div className="relative mx-auto w-full max-w-[1280px] px-8 py-16">
          <div className="mb-4 font-mono text-[12px] uppercase tracking-[.14em] text-white/50">
            วิธีใช้งาน
          </div>
          <h2 className="font-arch mb-12 max-w-[640px] text-[34px] font-extrabold leading-[1.05] tracking-[-.03em] md:text-[38px]">
            สามขั้นตอนระหว่างคุณกับเกือบทุกสิ่ง
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.no} className="border-t-[1.5px] border-white/25 pt-5">
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
          <h2 className="font-arch flex items-center gap-2.5 text-[30px] font-extrabold tracking-[-.025em] text-black">
            <HeartDoodle className="text-brand-600" size={28} />
            ได้รับความไว้วางใจจากชุมชน
          </h2>
          <div className="flex items-center gap-2 text-[14px] text-black/55">
            <span className="font-arch text-brand-600 text-[20px] font-extrabold">4.9</span>{" "}
            คะแนนเฉลี่ยจาก 8,200 การเช่า
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
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
      <section className="mx-auto w-full max-w-[1280px] px-8 pb-16">
        <div className="border-brand-600 flex flex-wrap items-center justify-between gap-10 rounded-[22px] border-[1.5px] p-10 md:p-14">
          <div>
            <h2 className="font-arch mb-2.5 text-[30px] font-extrabold leading-[1.05] tracking-[-.03em] text-black md:text-[34px]">
              มีของที่วางทิ้งไว้เฉยๆ ไหม?
            </h2>
            <p className="max-w-[480px] text-[16px] text-black/60">
              ลงประกาศในไม่กี่นาทีแล้วสร้างรายได้ คุณกำหนดราคา วันที่ และเงินมัดจำเองได้
            </p>
          </div>
          <Link
            href={ROUTES.listItem}
            className="bg-brand-600 flex-none whitespace-nowrap rounded-full px-9 py-[17px] text-[16px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            ลงประกาศชิ้นแรก
          </Link>
        </div>
      </section>
    </div>
  );
}
