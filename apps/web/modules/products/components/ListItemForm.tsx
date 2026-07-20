"use client";

import axios from "axios";
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
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center px-6 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[28px]">
          ✓
        </div>
        <h2 className="font-arch mb-2 text-[22px] font-extrabold tracking-[-.02em]">
          ส่งประกาศสำเร็จ! รอตรวจสอบ
        </h2>
        <p className="mb-8 text-[14px] text-black/60">
          ทีมงานจะตรวจสอบประกาศของคุณก่อนเผยแพร่ ใช้เวลาไม่นาน
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-full bg-[#0a0a0a] px-6 py-3 text-[14px] font-semibold text-white"
        >
          ลงประกาศเพิ่ม
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[460px] px-6 py-12">
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        {isEdit ? "แก้ไขประกาศ" : "ลงประกาศ"}
      </div>
      <h1 className="font-arch mb-8 text-[28px] font-extrabold tracking-[-.02em]">
        {isEdit ? "แก้ไขประกาศให้เช่า" : "ลงประกาศให้เช่าสินค้าใหม่"}
      </h1>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">รูปสินค้า</label>
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
        <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-black/[.02] text-black/40 transition-colors hover:border-black/35">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 16l-4.5-4.5a2 2 0 0 0-2.8 0L7 18" />
          </svg>
          <span className="text-[13px]">{imageFile ? imageFile.name : "เพิ่มรูปสินค้า"}</span>
        </label>
      </div>

      <Field label="ชื่อสินค้า" value={title} onChange={setTitle} />

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">หมวดหมู่</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
          className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-black/40"
        >
          <option value="">เลือกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="ราคา/วัน (บาท)"
        value={String(pricePerDay)}
        onChange={setPricePerDay}
        type="number"
      />

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">รายละเอียด</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-black/40"
        />
      </div>

      <Field label="ที่ตั้งสินค้า" value={location} onChange={setLocation} />

      <div className="mb-8">
        <label className="mb-2 block text-[13px] font-medium text-black/70">จุดรับสินค้า</label>
        <div className="mb-2.5 flex flex-wrap gap-2">
          {pickupOptions.map((opt, i) => (
            <span
              key={opt.id ?? `new-${i}`}
              className="flex items-center gap-1.5 rounded-full border border-black/[.14] px-3 py-1.5 text-[12.5px] font-medium text-black/70"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removePickupChip(i)}
                aria-label="ลบจุดรับสินค้า"
                className="border-0 bg-transparent p-0 text-black/40 hover:text-black"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPickupChip();
              }
            }}
            placeholder="เช่น BTS อโศก"
            className="flex-1 rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-black/40"
          />
          <button
            type="button"
            onClick={addPickupChip}
            className="rounded-lg border border-black/[.16] px-4 text-[13px] font-semibold text-black/70 hover:border-black/35"
          >
            เพิ่ม
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="w-full rounded-full bg-[#0a0a0a] py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[13px] font-medium text-black/70">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-black/40"
      />
    </div>
  );
}
