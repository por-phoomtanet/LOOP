"use client";

import { useRouter } from "next/navigation";
import { ProductDetailView } from "./ProductDetailView";

type Props = {
  productId: number;
};

// เปิดผ่าน intercepting route (app/@modal/(.)products/[id]/page.tsx) — คลิกสินค้าจากในเว็บ
// เห็นเป็น modal ทับหน้าเดิม แต่ URL /products/:id ยังอยู่ (แชร์ลิงก์/รีเฟรชได้ค่า) เพราะ Next
// จะข้าม interceptor แล้ว render เต็มหน้า (ProductDetailPage) แทนเมื่อโหลด URL ตรงๆ
export function ProductDetailModal({ productId }: Props) {
  const router = useRouter();

  function close() {
    router.back();
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={close} />
      <div className="relative my-6 w-full max-w-[900px] rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(10,10,10,.3)] sm:p-8">
        <button
          type="button"
          aria-label="ปิด"
          onClick={close}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
        <ProductDetailView productId={productId} />
      </div>
    </div>
  );
}
