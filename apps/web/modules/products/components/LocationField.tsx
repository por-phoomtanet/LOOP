"use client";

import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { productsApi } from "../services/productsApi";
import type { SavedLocation } from "../types";

const LeafletMap = dynamic(() => import("./LeafletMap").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-[13px] text-black/40">กำลังโหลดแผนที่…</div>
  ),
});

export type SelectedLocation = {
  address: string;
  lat: number | null;
  lng: number | null;
};

type Props = {
  value: SelectedLocation;
  onChange: (value: SelectedLocation) => void;
};

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th`,
    );
    const data = await res.json();
    return typeof data.display_name === "string" ? data.display_name : "";
  } catch {
    return "";
  }
}

export function LocationField({ value, onChange }: Props) {
  const [saved, setSaved] = useState<SavedLocation[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // draft state ภายใน modal ปักหมุด
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLng, setDraftLng] = useState<number | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productsApi
      .getSavedLocations()
      .then((res) => setSaved(res.data.data))
      .catch(() => setSaved([]));
  }, []);

  const selectedId = saved.find((l) => l.lat === value.lat && l.lng === value.lng)?.id ?? null;

  function selectSaved(loc: SavedLocation) {
    onChange({ address: loc.address, lat: loc.lat, lng: loc.lng });
  }

  async function handleDelete(id: number) {
    if (!confirm("ลบสถานที่นี้?")) return;
    const loc = saved.find((l) => l.id === id);
    try {
      await productsApi.deleteSavedLocation(id);
      setSaved((prev) => prev.filter((l) => l.id !== id));
      // ถ้าลบอันที่กำลังเลือกอยู่ ให้เคลียร์ค่าในฟอร์ม
      if (loc && loc.lat === value.lat && loc.lng === value.lng) {
        onChange({ address: "", lat: null, lng: null });
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "ลบไม่สำเร็จ");
    }
  }

  function openModal() {
    setDraftLat(null);
    setDraftLng(null);
    setDraftLabel("");
    setDraftAddress("");
    setError(null);
    setModalOpen(true);
  }

  async function handlePick(lat: number, lng: number) {
    setDraftLat(lat);
    setDraftLng(lng);
    setGeocoding(true);
    const address = await reverseGeocode(lat, lng);
    setGeocoding(false);
    if (address) setDraftAddress(address);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => void handlePick(pos.coords.latitude, pos.coords.longitude),
      () => setError("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้"),
    );
  }

  async function saveDraft() {
    if (draftLat == null || draftLng == null || !draftLabel.trim() || !draftAddress.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await productsApi.createSavedLocation({
        label: draftLabel.trim(),
        address: draftAddress.trim(),
        lat: draftLat,
        lng: draftLng,
      });
      const created = res.data.data;
      setSaved((prev) => [created, ...prev]);
      selectSaved(created);
      setModalOpen(false);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "บันทึกสถานที่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const canSaveDraft =
    draftLat != null && draftLng != null && draftLabel.trim() !== "" && draftAddress.trim() !== "";

  return (
    <div>
      {error && !modalOpen && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      )}

      {saved.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-2">
          {saved.map((loc) => {
            const active = loc.id === selectedId;
            return (
              <div
                key={loc.id}
                className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-colors ${
                  active ? "border-brand-600 bg-brand-100" : "border-black/[.14]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectSaved(loc)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span
                    className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full ${
                      active ? "bg-brand-600" : "bg-black/10"
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? "#fff" : "#666"}>
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" />
                      <circle cx="12" cy="10" r="3" fill={active ? "#2D5DA8" : "#fff"} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-black">{loc.label}</span>
                    <span className="block truncate text-[12.5px] text-black/50">
                      {loc.address}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(loc.id)}
                  aria-label="ลบสถานที่"
                  className="flex-none border-0 bg-transparent p-1 text-black/30 hover:text-[#c96442]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={openModal}
        className="border-brand-600 text-brand-600 hover:bg-brand-100 flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed py-2.5 text-[13.5px] font-semibold transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        เพิ่มสถานที่จากแผนที่
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(10,10,10,.25)]">
            <h3 className="font-arch mb-1 text-[20px] font-extrabold tracking-[-.02em]">
              ปักหมุดสถานที่
            </h3>
            <p className="mb-4 text-[13px] text-black/55">แตะบนแผนที่เพื่อปักหมุดจุดนัดรับสินค้า</p>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="h-[280px] w-full overflow-hidden rounded-xl border border-black/15">
              <LeafletMap
                lat={draftLat}
                lng={draftLng}
                onPick={handlePick}
                className="h-full w-full"
              />
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-brand-600"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              ใช้ตำแหน่งปัจจุบัน
            </button>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-black/60">
                  ชื่อเรียกสถานที่
                </label>
                <input
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder="เช่น บ้าน, ที่ทำงาน, BTS อโศก"
                  className="focus:border-brand-400 w-full rounded-[10px] border border-black/[.15] px-3 py-2.5 text-[14px] text-black outline-none transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-black/60">
                  ที่อยู่ {geocoding && <span className="text-black/35">(กำลังค้นหา…)</span>}
                </label>
                <textarea
                  value={draftAddress}
                  onChange={(e) => setDraftAddress(e.target.value)}
                  rows={2}
                  placeholder="ปักหมุดบนแผนที่แล้วที่อยู่จะเติมให้อัตโนมัติ (แก้ไขได้)"
                  className="focus:border-brand-400 w-full resize-y rounded-[10px] border border-black/[.15] px-3 py-2.5 text-[14px] text-black outline-none transition-colors"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-black/15 px-5 py-2.5 text-[14px] font-semibold text-black/60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={!canSaveDraft || saving}
                className="bg-brand-600 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
              >
                {saving ? "กำลังบันทึก…" : "บันทึกสถานที่"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
