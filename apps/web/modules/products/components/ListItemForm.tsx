"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { productsApi } from "../services/productsApi";
import type { Category, MyListing } from "../types";

type Props = {
  listing?: MyListing;
  onSaved?: () => void;
};

type PendingPickupOption = { id?: number; label: string };

export function ListItemForm({ listing, onSaved }: Props) {
  const isEdit = !!listing;

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(listing?.categoryId ?? "");
  const [pricePerDay, setPricePerDay] = useState(listing?.pricePerDay ?? "");
  const [location, setLocation] = useState(listing?.location ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pickupOptions, setPickupOptions] = useState<PendingPickupOption[]>(
    listing?.pickupOptions ?? [],
  );
  const [removedOptionIds, setRemovedOptionIds] = useState<number[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    productsApi
      .getCategories()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  const canSubmit =
    title.trim() &&
    description.trim() &&
    categoryId !== "" &&
    pricePerDay !== "" &&
    location.trim();

  function addPickupChip() {
    const label = newOptionLabel.trim();
    if (!label) return;
    setPickupOptions((prev) => [...prev, { label }]);
    setNewOptionLabel("");
  }

  function removePickupChip(index: number) {
    const opt = pickupOptions[index];
    if (opt.id) setRemovedOptionIds((prev) => [...prev, opt.id!]);
    setPickupOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setPricePerDay("");
    setLocation("");
    setImageFile(null);
    setPickupOptions([]);
    setRemovedOptionIds([]);
    setNewOptionLabel("");
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const input = {
        title,
        description,
        categoryId: Number(categoryId),
        pricePerDay: Number(pricePerDay),
        location,
      };

      let productId: number;
      if (isEdit) {
        await productsApi.updateProduct(listing!.id, input);
        productId = listing!.id;
      } else {
        const res = await productsApi.createProduct(input);
        productId = res.data.data.id;
      }

      if (imageFile) {
        await productsApi.uploadImages(productId, [imageFile]);
      }
      for (const optionId of removedOptionIds) {
        await productsApi.removePickupOption(productId, optionId);
      }
      for (const opt of pickupOptions) {
        if (!opt.id) await productsApi.addPickupOption(productId, opt.label);
      }

      if (isEdit) {
        onSaved?.();
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center px-8 py-16 text-center">
        <div className="bg-brand-600 mb-[22px] flex h-14 w-14 items-center justify-center rounded-full">
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
          สินค้าของคุณกำลังรอตรวจสอบ เราจะแจ้งเตือนเมื่อประกาศพร้อมใช้งานบน renty
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <Link
            href="/"
            className="rounded-full border-[1.5px] border-black/[.15] bg-white px-[26px] py-[13px] text-[14.5px] font-semibold text-black"
          >
            กลับหน้าแรก
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="bg-brand-600 rounded-full px-[26px] py-[13px] text-[14.5px] font-semibold text-white"
          >
            ลงประกาศเพิ่ม
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[640px] px-8 py-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        {isEdit ? "แก้ไขประกาศ" : "ลงประกาศใหม่"}
      </div>
      <h1 className="font-arch text-[30px] font-extrabold tracking-[-.025em] text-black">
        {isEdit ? "แก้ไขประกาศให้เช่า" : "ลงขายสินค้าของคุณ"}
      </h1>
      {!isEdit && (
        <p className="mt-2.5 text-[14.5px] text-black/55">
          ใส่รายละเอียดสั้นๆ แล้วเริ่มสร้างรายได้จากของที่คุณมีอยู่แล้ว
        </p>
      )}

      {error && (
        <div className="mb-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5 mt-8">
        <div className="mb-2.5 text-[13px] font-semibold text-black/60">รูปภาพ</div>
        {listing && listing.images.length > 0 && (
          <div className="mb-2.5 flex gap-2">
            {listing.images.map((img) => (
              // eslint-disable-next-line
              <img
                key={img.id}
                src={resolveUploadUrl(img.url)}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        <label className="flex h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-black/[.03] text-black/40 transition-colors hover:border-black/35">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 16l-4.5-4.5a2 2 0 0 0-2.8 0L7 18" />
          </svg>
          <span className="text-[13.5px]">{imageFile ? imageFile.name : "Add a photo"}</span>
        </label>
      </div>

      <div className="flex flex-col gap-[18px]">
        <Field label="ชื่อสินค้า" value={title} onChange={setTitle} />

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">หมวดหมู่</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="focus:border-brand-400 w-full rounded-[10px] border border-black/[.15] bg-white px-3.5 py-3 text-[14.5px] text-black outline-none transition-colors"
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
          <div className="focus-within:border-brand-400 flex items-center gap-2 rounded-[10px] border border-black/[.15] px-3.5 transition-colors">
            <span className="flex-none text-[14.5px] text-black/45">฿</span>
            <input
              type="number"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              className="w-full border-0 py-3 text-[14.5px] text-black outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">รายละเอียด</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="focus:border-brand-400 w-full resize-y rounded-[10px] border border-black/[.15] px-3.5 py-3 text-[14.5px] text-black outline-none transition-colors"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">
            สถานที่นัดรับ
          </label>
          <div className="flex flex-col gap-2">
            {pickupOptions.map((opt, i) => (
              <div
                key={opt.id ?? `new-${i}`}
                className="flex items-center gap-2.5 rounded-[10px] border border-black/[.14] px-3 py-2.5"
              >
                <span className="bg-brand-600 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div className="flex-1 text-[14px] text-black">{opt.label}</div>
                <button
                  type="button"
                  onClick={() => removePickupChip(i)}
                  aria-label="ลบสถานที่นัดรับ"
                  className="flex-none border-0 bg-transparent p-1 text-black/35 hover:text-black"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPickupChip();
                }
              }}
              placeholder="เพิ่มสถานที่อื่น…"
              className="focus:border-brand-400 flex-1 rounded-[10px] border border-black/[.15] px-3 py-2.5 text-[14px] text-black outline-none transition-colors"
            />
            <button
              type="button"
              onClick={addPickupChip}
              className="bg-brand-600 flex-none rounded-[10px] px-[18px] text-[13.5px] font-semibold text-white"
            >
              เพิ่ม
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">
            ที่ตั้งสินค้า
          </label>
          <div
            className="relative h-40 w-full overflow-hidden rounded-2xl border border-black/[.15]"
            style={{
              background:
                "linear-gradient(#e3e1db 1px,transparent 1px) 0 0/28px 28px, linear-gradient(90deg,#e3e1db 1px,transparent 1px) 0 0/28px 28px, #efeeeb",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at 50% 45%,rgba(10,10,10,.05),transparent 60%)",
              }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#2D5DA8">
                <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" />
                <circle cx="12" cy="10" r="3" fill="#fff" />
              </svg>
            </div>
            <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-white px-2.5 py-[5px] text-[11.5px] font-semibold text-black/55 shadow-[0_2px_8px_rgba(10,10,10,.1)]">
              ตัวอย่างแผนที่
            </div>
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="เช่น สุขุมวิท ซอย 24 กรุงเทพฯ"
            className="focus:border-brand-400 mt-2 w-full rounded-[10px] border border-black/[.15] px-3 py-2.5 text-[14px] text-black outline-none transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="bg-brand-600 mt-7 w-full rounded-full py-[15px] text-[15px] font-bold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "ส่งประกาศ"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-black/60">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus:border-brand-400 w-full rounded-[10px] border border-black/[.15] px-3.5 py-3 text-[14.5px] text-black outline-none transition-colors"
      />
    </div>
  );
}
