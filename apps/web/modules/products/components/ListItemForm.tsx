"use client";

// ต้อง import ก่อน antd/antd-img-crop เพื่อให้ crop modal ใช้ createRoot ของ React 19
import "@ant-design/v5-patch-for-react-19";
import { Upload } from "antd";
import type { UploadFile } from "antd";
import ImgCrop from "antd-img-crop";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { LocationField } from "./LocationField";
import { productsApi } from "../services/productsApi";
import type { Category, MyListing, PickupMethod } from "../types";

type Props = {
  listing?: MyListing;
  onSaved?: () => void;
  // true = ฝังอยู่ในหน้าอื่น (แท็บใน /my-listings) — ตัดคอลัมน์กลาง/ระยะขอบของหน้าเดี่ยวออก
  // และไม่แสดง kicker ซ้ำ เพราะหัวข้อหน้ากับชื่อแท็บบอกอยู่แล้วว่ากำลังลงประกาศ
  embedded?: boolean;
};

type PendingPickupOption = { id?: number; type: PickupMethod; label: string };
type TierRow = { days: string; price: string };

const FIXED_PICKUP_LABELS: Record<"GRAB" | "POST", string> = {
  GRAB: "จัดส่งผ่าน Grab",
  POST: "จัดส่งทางไปรษณีย์",
};

const MAX_IMAGES = 10; // ตรงกับ limit ฝั่ง API (.array("files", 10))

// pre-fill ด้วยจำนวนวันที่นิยม (3/7/15/30) ไว้ให้ก่อน — เจ้าของแก้จำนวนวัน/ราคาเอง
// หรือลบ/เพิ่มแถวได้อิสระ ไม่ได้บังคับใช้ 4 ค่านี้อีกต่อไป
const DEFAULT_TIER_DAYS = ["3", "7", "15", "30"];

function initialTierRows(listing?: MyListing): TierRow[] {
  if (listing && listing.priceTiers.length > 0) {
    return listing.priceTiers.map((t) => ({ days: String(t.days), price: t.price }));
  }
  return DEFAULT_TIER_DAYS.map((days) => ({ days, price: "" }));
}

export function ListItemForm({ listing, onSaved, embedded = false }: Props) {
  const isEdit = !!listing;

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(listing?.categoryId ?? "");
  const [pricePerDay, setPricePerDay] = useState(listing?.pricePerDay ?? "");
  const [priceTiers, setPriceTiers] = useState<TierRow[]>(() => initialTierRows(listing));
  const [location, setLocation] = useState(listing?.location ?? "");
  const [lat, setLat] = useState<number | null>(listing?.lat ?? null);
  const [lng, setLng] = useState<number | null>(listing?.lng ?? null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [pickupOptions, setPickupOptions] = useState<PendingPickupOption[]>(
    listing?.pickupOptions ?? [],
  );
  const [meetupEnabled, setMeetupEnabled] = useState(
    () => listing?.pickupOptions?.some((o) => o.type === "MEETUP") ?? false,
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

  const meetupOptions = pickupOptions.filter((o) => o.type === "MEETUP");
  const grabOption = pickupOptions.find((o) => o.type === "GRAB");
  const postOption = pickupOptions.find((o) => o.type === "POST");

  function addMeetupLocation() {
    const label = newOptionLabel.trim();
    if (!label) return;
    setPickupOptions((prev) => [...prev, { type: "MEETUP", label }]);
    setNewOptionLabel("");
  }

  function removeOption(target: PendingPickupOption) {
    if (target.id) setRemovedOptionIds((prev) => [...prev, target.id!]);
    setPickupOptions((prev) => prev.filter((o) => o !== target));
  }

  function toggleFixedMethod(type: "GRAB" | "POST") {
    const existing = pickupOptions.find((o) => o.type === type);
    if (existing) {
      removeOption(existing);
    } else {
      setPickupOptions((prev) => [...prev, { type, label: FIXED_PICKUP_LABELS[type] }]);
    }
  }

  function toggleMeetup() {
    if (meetupEnabled) {
      meetupOptions.forEach(removeOption);
      setMeetupEnabled(false);
    } else {
      setMeetupEnabled(true);
    }
  }

  function updateTierDays(index: number, value: string) {
    setPriceTiers((prev) => prev.map((row, i) => (i === index ? { ...row, days: value } : row)));
  }

  function updateTierPrice(index: number, value: string) {
    setPriceTiers((prev) => prev.map((row, i) => (i === index ? { ...row, price: value } : row)));
  }

  function addTierRow() {
    setPriceTiers((prev) => [...prev, { days: "", price: "" }]);
  }

  function removeTierRow(index: number) {
    setPriceTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setPricePerDay("");
    setPriceTiers(initialTierRows());
    setLocation("");
    setLat(null);
    setLng(null);
    setFileList([]);
    setPickupOptions([]);
    setMeetupEnabled(false);
    setRemovedOptionIds([]);
    setNewOptionLabel("");
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    const filledTiers = priceTiers
      .filter((t) => t.days.trim() !== "" && t.price.trim() !== "")
      .map((t) => ({ days: Number(t.days), price: Number(t.price) }));
    const tierDays = filledTiers.map((t) => t.days);
    if (new Set(tierDays).size !== tierDays.length) {
      setError("จำนวนวันในตารางราคาห้ามซ้ำกัน");
      return;
    }
    if (filledTiers.some((t) => t.days <= 1)) {
      setError("จำนวนวันของแต่ละระดับราคาต้องมากกว่า 1 วัน");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const input = {
        title,
        description,
        categoryId: Number(categoryId),
        pricePerDay: Number(pricePerDay),
        priceTiers: filledTiers,
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

      // ไฟล์ที่ครอปแล้วอยู่ใน originFileObj (antd-img-crop แทนที่ให้หลังครอป)
      const files = fileList
        .map((f) => f.originFileObj as File | undefined)
        .filter((f): f is File => !!f);
      if (files.length > 0) {
        await productsApi.uploadImages(productId, files);
      }
      for (const optionId of removedOptionIds) {
        await productsApi.removePickupOption(productId, optionId);
      }
      for (const opt of pickupOptions) {
        if (!opt.id) {
          await productsApi.addPickupOption(productId, {
            type: opt.type,
            ...(opt.type === "MEETUP" ? { label: opt.label } : {}),
          });
        }
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
          ลงประกาศสำเร็จ!
        </h2>
        <p className="mx-auto mb-7 max-w-[420px] text-[14.5px] leading-relaxed text-black/60">
          สินค้าของคุณขึ้นแสดงบน rently แล้ว พร้อมให้คนอื่นเช่าได้ทันที
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
    <form
      onSubmit={handleSubmit}
      className={embedded ? "w-full px-5 py-6 sm:px-6" : "mx-auto w-full max-w-[640px] px-8 py-12"}
    >
      {/* ในแท็บ "ลงประกาศให้เช่า" ไม่ต้องมี kicker ซ้ำ (ชื่อแท็บบอกอยู่แล้ว) แต่ใน modal แก้ไข
          ยังต้องมี เพราะไม่มีหัวข้ออื่นบอกว่ากำลังแก้ไขประกาศอยู่ */}
      {(!embedded || isEdit) && (
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
          {isEdit ? "แก้ไขประกาศ" : "ลงประกาศใหม่"}
        </div>
      )}

      {error && (
        <div className="mb-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5 mt-8">
        <div className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-black/60">
          รูปภาพ
          <span className="font-normal text-black/40">
            ({fileList.length}/{MAX_IMAGES}) — เพิ่มได้หลายรูป
          </span>
        </div>
        {listing && listing.images.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2">
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
        <ImgCrop
          rotationSlider
          aspect={1}
          modalTitle="ครอปรูปภาพ"
          modalOk="ตกลง"
          modalCancel="ยกเลิก"
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: fl }) => {
              // antd cache thumbUrl ตาม uid เดิม ไม่รู้ว่า antd-img-crop แทนที่ originFileObj
              // ด้วยรูปที่ครอป/หมุนแล้ว (lib ไม่ set thumbUrl ใหม่ให้เอง) — gen เองจาก
              // originFileObj ล่าสุดเสมอ ไม่งั้น preview จะค้างเป็นรูปก่อนครอป
              const withFreshThumb = fl.map((f) =>
                f.originFileObj
                  ? { ...f, thumbUrl: URL.createObjectURL(f.originFileObj as File) }
                  : f,
              );
              setFileList(withFreshThumb);
            }}
            // antd-img-crop มีบั๊กเก่า (เปิดมาตั้งแต่ปี 2021 ยังไม่แก้): ถ้า beforeUpload คืนค่า
            // false ตรงๆ ตัว runBeforeUpload ภายในจะทิ้งไฟล์ที่ครอปแล้วไปเลย ใช้ไฟล์เดิมก่อนครอปแทน
            // (github.com/nanxiaobei/antd-img-crop/issues/123) — ห้ามใช้ beforeUpload={() => false}
            // แก้ด้วยการกันอัปโหลดจริงผ่าน customRequest แบบ no-op แทน
            customRequest={({ onSuccess }) => onSuccess?.("ok")}
            accept="image/png,image/jpeg,image/jpg"
            maxCount={MAX_IMAGES}
            onPreview={async (file) => {
              const src = file.url ?? URL.createObjectURL(file.originFileObj as File);
              window.open(src);
            }}
          >
            {fileList.length >= MAX_IMAGES ? null : (
              <div className="text-black/55">
                <div className="text-[20px] leading-none">+</div>
                <div className="mt-1.5 text-[13px]">อัปโหลด</div>
              </div>
            )}
          </Upload>
        </ImgCrop>
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
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] font-semibold text-black/60">
              ราคาตามจำนวนวันเช่า <span className="font-normal text-black/40">(ไม่บังคับ)</span>
            </label>
            <button
              type="button"
              onClick={addTierRow}
              className="text-brand-600 text-[13px] font-semibold"
            >
              + เพิ่มระดับราคา
            </button>
          </div>
          {priceTiers.length === 0 ? (
            <p className="text-[12.5px] text-black/40">
              ยังไม่มีระดับราคา — กด &quot;+ เพิ่มระดับราคา&quot; เพื่อเพิ่ม
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {priceTiers.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex w-[108px] flex-none items-center gap-1.5 rounded-[10px] border border-black/[.15] px-3 py-2.5">
                    <input
                      type="number"
                      min={2}
                      value={row.days}
                      onChange={(e) => updateTierDays(i, e.target.value)}
                      placeholder="จำนวนวัน"
                      className="w-full border-0 text-[14px] text-black outline-none [appearance:textfield]"
                    />
                    <span className="flex-none text-[12.5px] text-black/45">วัน</span>
                  </div>
                  <div className="focus-within:border-brand-400 flex flex-1 items-center gap-2 rounded-[10px] border border-black/[.15] px-3.5 transition-colors">
                    <span className="flex-none text-[14.5px] text-black/45">฿</span>
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => updateTierPrice(i, e.target.value)}
                      placeholder="ราคา"
                      className="w-full border-0 py-2.5 text-[14.5px] text-black outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTierRow(i)}
                    aria-label="ลบระดับราคานี้"
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
          )}
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
          <label className="mb-2 block text-[13px] font-semibold text-black/60">การรับสินค้า</label>
          <div className="flex flex-col gap-2">
            <div className="rounded-[10px] border border-black/[.14]">
              <ToggleRow checked={meetupEnabled} label="นัดรับ" onToggle={toggleMeetup} bare />
              {meetupEnabled && (
                <div className="flex flex-col gap-2 border-t border-black/[.1] p-3">
                  {meetupOptions.map((opt, i) => (
                    <div
                      key={opt.id ?? `new-${i}`}
                      className="flex items-center gap-2.5 rounded-[10px] border border-black/[.14] px-3 py-2.5"
                    >
                      <div className="flex-1 text-[14px] text-black">{opt.label}</div>
                      <button
                        type="button"
                        onClick={() => removeOption(opt)}
                        aria-label="ลบจุดนัดรับ"
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
                  <div className="flex gap-2">
                    <input
                      value={newOptionLabel}
                      onChange={(e) => setNewOptionLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMeetupLocation();
                        }
                      }}
                      placeholder="เช่น BTS อโศก"
                      className="focus:border-brand-400 flex-1 rounded-[10px] border border-black/[.15] px-3 py-2.5 text-[14px] text-black outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addMeetupLocation}
                      className="bg-brand-600 flex-none rounded-[10px] px-[18px] text-[13.5px] font-semibold text-white"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ToggleRow
              checked={!!grabOption}
              label="Grab"
              onToggle={() => toggleFixedMethod("GRAB")}
            />
            <ToggleRow
              checked={!!postOption}
              label="ไปรษณีย์"
              onToggle={() => toggleFixedMethod("POST")}
            />
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

function ToggleRow({
  checked,
  label,
  onToggle,
  bare = false,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  bare?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
        bare ? "" : "rounded-[10px] border border-black/[.14] hover:border-black/25"
      }`}
    >
      <span
        className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] border transition-colors ${
          checked ? "bg-brand-600 border-brand-600" : "border-black/20 bg-white"
        }`}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-[14px] text-black">{label}</span>
    </button>
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
