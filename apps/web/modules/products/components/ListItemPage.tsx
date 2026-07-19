"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMasterStore } from "@/store/masterStore";
import { productsApi } from "../services/productsApi";
import { ImageSlot, type ImageSlotHandle } from "./ImageSlot";
import { PickupOptionsEditor, type PickupOption } from "./PickupOptionsEditor";

const DEFAULT_PICKUP_OPTIONS: PickupOption[] = [
  { id: "p1", label: "BTS สยาม", selected: true },
  { id: "p2", label: "เซ็นทรัลเวิลด์", selected: true },
  { id: "p3", label: "ร้าน Camera House", selected: true },
  { id: "p4", label: "จัดส่งผ่าน Grab (มีค่าใช้จ่ายเพิ่ม)", selected: true },
];

export function ListItemPage() {
  const { categories, loaded, fetchCategories } = useMasterStore();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const imageSlotRef = useRef<ImageSlotHandle>(null);
  const [pickupOptions, setPickupOptions] = useState<PickupOption[]>(DEFAULT_PICKUP_OPTIONS);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loaded) void fetchCategories();
  }, [loaded, fetchCategories]);

  const canSubmit = title.trim() !== "" && categoryId !== "" && Number(price) > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await productsApi.createListing({
        title: title.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
        pricePerDay: Number(price),
        pickupOptions: pickupOptions.filter((o) => o.selected).map((o) => o.label),
      });

      if (photo) {
        try {
          const cropped = (await imageSlotRef.current?.getCroppedFile()) ?? photo;
          await productsApi.uploadImages(res.data.data.id, [cropped]);
        } catch {
          // ไม่ block flow ถ้าอัปโหลดรูปไม่สำเร็จ — แก้ไขทีหลังได้
        }
      }

      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setCategoryId("");
    setPrice("");
    setDescription("");
    setPhoto(null);
    setPickupOptions(DEFAULT_PICKUP_OPTIONS);
    setError(null);
    setSubmitted(false);
    window.scrollTo({ top: 0 });
  }

  if (submitted) {
    return (
      <section className="mx-auto w-full max-w-[640px] px-8 pb-24 pt-12">
        <div className="rounded-[20px] border-[1.5px] border-black/10 px-6 py-16 text-center">
          <div className="mx-auto mb-[22px] flex h-14 w-14 items-center justify-center rounded-full bg-[#0a0a0a] text-white">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="font-arch mb-2.5 text-[26px] font-extrabold tracking-[-.02em]">
            ส่งประกาศแล้ว!
          </h2>
          <p className="mx-auto mb-7 max-w-[420px] text-[14.5px] leading-relaxed text-black/60">
            สินค้าของคุณกำลังรอตรวจสอบ เราจะแจ้งเตือนเมื่อประกาศพร้อมใช้งานบน LOOP
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <Link
              href="/"
              className="rounded-full border-[1.5px] border-black/15 px-[26px] py-3 text-[14.5px] font-semibold text-[#0a0a0a]"
            >
              กลับหน้าแรก
            </Link>
            <button
              onClick={resetForm}
              className="rounded-full bg-[#0a0a0a] px-[26px] py-3 text-[14.5px] font-semibold text-white"
            >
              ลงประกาศเพิ่ม
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[640px] px-8 pb-24 pt-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        ลงประกาศใหม่
      </div>
      <h1 className="font-arch m-0 text-[30px] font-extrabold tracking-[-.025em] text-[#0a0a0a]">
        ลงประกาศให้เช่า
      </h1>
      <p className="mt-2.5 text-[14.5px] text-black/55">
        ใส่รายละเอียดสั้นๆ แล้วเริ่มสร้างรายได้จากของที่คุณมีอยู่แล้ว
      </p>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5 mt-8">
        <div className="mb-2.5 text-[13px] font-semibold text-black/60">รูปภาพ</div>
        <div className="flex justify-center">
          <ImageSlot ref={imageSlotRef} file={photo} onChange={setPhoto} />
        </div>
      </div>

      <div className="flex flex-col gap-[18px]">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">ชื่อสินค้า</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-[10px] border-[1.5px] border-black/15 px-3.5 py-3 text-[14.5px] text-[#0a0a0a] outline-none focus:border-black/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">หมวดหมู่</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-[10px] border-[1.5px] border-black/15 bg-white px-3.5 py-3 text-[14.5px] text-[#0a0a0a] outline-none focus:border-black/40"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">ราคาต่อวัน</label>
          <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-black/15 px-3.5 focus-within:border-black/40">
            <span className="flex-none text-[14.5px] text-black/45">฿</span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border-0 py-3 text-[14.5px] text-[#0a0a0a] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">รายละเอียด</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-[10px] border-[1.5px] border-black/15 px-3.5 py-3 text-[14.5px] text-[#0a0a0a] outline-none focus:border-black/40"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">
            สถานที่นัดรับ
          </label>
          <PickupOptionsEditor options={pickupOptions} onChange={setPickupOptions} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="mt-7 w-full rounded-full bg-[#0a0a0a] py-[15px] text-[15px] font-bold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "กำลังส่งประกาศ…" : "ส่งประกาศ"}
      </button>
    </section>
  );
}
