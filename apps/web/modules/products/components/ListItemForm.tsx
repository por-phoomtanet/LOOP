"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { ImageSlot, type ImageSlotHandle } from "./ImageSlot";
import { LocationField } from "./LocationField";
import { productsApi } from "../services/productsApi";
import type { Category, MyListing } from "../types";

type Props = {
  listing?: MyListing;
  onSaved?: () => void;
};

type PendingPickupOption = { id?: number; label: string };

export function ListItemForm({ listing, onSaved }: Props) {
  const router = useRouter();
  const isEdit = !!listing;

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(listing?.categoryId ?? "");
  const [pricePerDay, setPricePerDay] = useState(listing?.pricePerDay ?? "");
  const [location, setLocation] = useState(listing?.location ?? "");
  const [lat, setLat] = useState<number | null>(listing?.lat ?? null);
  const [lng, setLng] = useState<number | null>(listing?.lng ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageSlotRef = useRef<ImageSlotHandle>(null);
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
    setLat(null);
    setLng(null);
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
        ...(lat != null && lng != null ? { lat, lng } : {}),
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
        const cropped = (await imageSlotRef.current?.getCroppedFile()) ?? imageFile;
        await productsApi.uploadImages(productId, [cropped]);
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
      {!isEdit && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="ย้อนกลับ"
          className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/[.15] bg-white text-black/60 transition-colors hover:border-black/30 hover:text-black"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
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
        <div className="flex justify-center">
          <ImageSlot ref={imageSlotRef} file={imageFile} onChange={setImageFile} />
        </div>
      </div>

      <div className="flex flex-col gap-[18px]">
        <Field label="ชื่อสินค้า" value={title} onChange={setTitle} />

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-black/60">หมวดหมู่</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="focus:border-brand-400 w-full appearance-none rounded-[10px] border border-black/[.15] bg-white py-3 pl-3.5 pr-10 text-[14.5px] text-black outline-none transition-colors"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
            }}
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
          <LocationField
            value={{ address: location, lat, lng }}
            onChange={(v) => {
              setLocation(v.address);
              setLat(v.lat);
              setLng(v.lng);
            }}
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
