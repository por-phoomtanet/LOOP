"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export type ImageSlotHandle = {
  /** สร้างไฟล์รูปที่ครอปตามกรอบ/ตำแหน่งปัจจุบัน — null ถ้ายังไม่มีรูป */
  getCroppedFile: () => Promise<File | null>;
};

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
};

// ขนาดไฟล์ที่ครอปแล้ว (จตุรัส 1:1)
const OUTPUT_SIZE = 1080;
const MIN_ZOOM = 0.35; // ซูมออกได้เล็กกว่ากรอบ — เผยพื้นหลังรอบรูป
const MAX_ZOOM = 3;
const BG_COLOR = "#ffffff"; // สีพื้นหลังที่เติมเมื่อรูปเล็กกว่ากรอบ

export const ImageSlot = forwardRef<ImageSlotHandle, Props>(function ImageSlot(
  { file, onChange },
  ref,
) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bgColor, setBgColor] = useState(BG_COLOR); // สีพื้นหลังที่ auto-detect จากขอบรูป

  const baseScaleRef = useRef(1); // สเกล "cover" พอดีกรอบที่ zoom=1
  const natRef = useRef({ w: 0, h: 0 });
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const frameSize = () => {
    const el = frameRef.current;
    return { w: el?.clientWidth ?? 0, h: el?.clientHeight ?? 0 };
  };

  // clamp ตำแหน่งต่อแกน:
  // - รูปใหญ่กว่ากรอบ (range<0) → เลื่อนได้ในช่วง [range,0] ไม่เผยขอบว่าง (cover)
  // - รูปเล็กกว่ากรอบ (range>0) → เลื่อนได้ในช่วง [0,range] อยู่ในกรอบเสมอ เผยพื้นหลังรอบๆ
  const clampAxis = (v: number, frame: number, disp: number) => {
    const range = frame - disp;
    const lo = Math.min(0, range);
    const hi = Math.max(0, range);
    return Math.min(hi, Math.max(lo, v));
  };

  const clamp = useCallback((x: number, y: number, scale: number) => {
    const { w: fw, h: fh } = frameSize();
    return {
      x: clampAxis(x, fw, natRef.current.w * scale),
      y: clampAxis(y, fh, natRef.current.h * scale),
    };
  }, []);

  // หาสีพื้นหลังจากค่าเฉลี่ยของพิกเซลตามขอบทั้ง 4 ด้าน (ปกติคือพื้นหลังของรูป)
  function detectBgColor(img: HTMLImageElement): string {
    try {
      const s = 64;
      const scale = Math.min(1, s / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const cx = c.getContext("2d");
      if (!cx) return BG_COLOR;
      cx.drawImage(img, 0, 0, w, h);
      const { data } = cx.getImageData(0, 0, w, h);
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      const add = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 128) return; // ข้ามพิกเซลโปร่งใส
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      };
      for (let x = 0; x < w; x++) {
        add(x, 0);
        add(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        add(0, y);
        add(w - 1, y);
      }
      if (!n) return BG_COLOR;
      return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
    } catch {
      return BG_COLOR;
    }
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    natRef.current = { w: img.naturalWidth, h: img.naturalHeight };
    setBgColor(detectBgColor(img));
    const { w: fw, h: fh } = frameSize();
    const base = Math.max(fw / img.naturalWidth, fh / img.naturalHeight);
    baseScaleRef.current = base;
    setZoom(1);
    // จัดกึ่งกลาง
    const dispW = img.naturalWidth * base;
    const dispH = img.naturalHeight * base;
    setOffset({ x: (fw - dispW) / 2, y: (fh - dispH) / 2 });
  }

  function scaleFor(z: number) {
    return baseScaleRef.current * z;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!preview) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const nx = d.ox + (e.clientX - d.px);
    const ny = d.oy + (e.clientY - d.py);
    setOffset(clamp(nx, ny, scaleFor(zoom)));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }

  function onZoomChange(z: number) {
    const { w: fw, h: fh } = frameSize();
    const oldScale = scaleFor(zoom);
    const newScale = scaleFor(z);
    // คงจุดกึ่งกลางกรอบให้อยู่กับที่ระหว่างซูม
    const imgCx = (fw / 2 - offset.x) / oldScale;
    const imgCy = (fh / 2 - offset.y) / oldScale;
    const nx = fw / 2 - imgCx * newScale;
    const ny = fh / 2 - imgCy * newScale;
    setZoom(z);
    setOffset(clamp(nx, ny, newScale));
  }

  function clearImage() {
    onChange(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  useImperativeHandle(
    ref,
    () => ({
      async getCroppedFile() {
        const img = imgRef.current;
        if (!file || !img || !natRef.current.w) return file;

        const { w: fw, h: fh } = frameSize();
        const scale = scaleFor(zoom);

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;

        // เติมพื้นหลังก่อน — ใช้สีที่ detect จากขอบรูป ให้ padding กลืนกับพื้นหลังของรูป
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        // วาดทั้งรูปตามตำแหน่ง/สเกลปัจจุบัน map จากพิกัดกรอบ → พิกัด output
        const kx = OUTPUT_SIZE / fw;
        const ky = OUTPUT_SIZE / fh;
        ctx.drawImage(
          img,
          offset.x * kx,
          offset.y * ky,
          natRef.current.w * scale * kx,
          natRef.current.h * scale * ky,
        );

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.9),
        );
        if (!blob) return file;
        const name = file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg";
        return new File([blob], name, { type: "image/jpeg" });
      },
    }),
    [file, zoom, offset, bgColor],
  );

  if (!preview) {
    return (
      <label className="relative flex aspect-square w-full max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-black/20 bg-black/[.03] transition-colors hover:border-black/35">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col items-center gap-2 text-black/40">
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
          <span className="text-[14px] font-medium text-black/60">เพิ่มรูปภาพ</span>
          <span className="text-[12.5px] text-black/40">หรือเลือกไฟล์</span>
        </div>
      </label>
    );
  }

  return (
    <div>
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative aspect-square w-full max-w-[300px] touch-none select-none overflow-hidden rounded-2xl border border-black/15"
        style={{ cursor: dragRef.current ? "grabbing" : "grab", background: bgColor }}
      >
        {/* eslint-disable-next-line */}
        <img
          ref={imgRef}
          src={preview}
          alt="ตัวอย่างรูปสินค้า"
          onLoad={handleImageLoad}
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
          style={{
            width: natRef.current.w ? natRef.current.w * scaleFor(zoom) : "auto",
            height: natRef.current.h ? natRef.current.h * scaleFor(zoom) : "auto",
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        />
        <div className="bg-brand-600/85 pointer-events-none absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white">
          ลากเพื่อจัดตำแหน่ง
        </div>
      </div>

      <div className="mt-3 flex max-w-[300px] items-center gap-3">
        <span className="text-[12px] font-medium text-black/45">ซูม</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="accent-brand-600 h-1 flex-1 cursor-pointer"
        />
        <button
          type="button"
          onClick={clearImage}
          className="flex-none rounded-full border border-black/15 px-3 py-1 text-[12.5px] font-semibold text-black/60 hover:border-black/35"
        >
          เปลี่ยนรูป
        </button>
      </div>
    </div>
  );
});
