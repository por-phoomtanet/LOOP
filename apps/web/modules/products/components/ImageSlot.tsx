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
const MAX_ZOOM = 3;

export const ImageSlot = forwardRef<ImageSlotHandle, Props>(function ImageSlot(
  { file, onChange },
  ref,
) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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

  // clamp ตำแหน่งไม่ให้เห็นขอบว่าง (รูปต้องคลุมกรอบเสมอ)
  const clamp = useCallback((x: number, y: number, scale: number) => {
    const { w: fw, h: fh } = frameSize();
    const dispW = natRef.current.w * scale;
    const dispH = natRef.current.h * scale;
    const minX = Math.min(0, fw - dispW);
    const minY = Math.min(0, fh - dispH);
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  }, []);

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    natRef.current = { w: img.naturalWidth, h: img.naturalHeight };
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
        // พื้นที่ของรูปต้นฉบับที่มองเห็นในกรอบ
        const sx = -offset.x / scale;
        const sy = -offset.y / scale;
        const sW = fw / scale;
        const sH = fh / scale;

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(img, sx, sy, sW, sH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.9),
        );
        if (!blob) return file;
        const name = file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg";
        return new File([blob], name, { type: "image/jpeg" });
      },
    }),
    [file, zoom, offset],
  );

  if (!preview) {
    return (
      <label className="relative flex aspect-square w-full max-w-[440px] cursor-pointer items-center justify-center overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-black/20 bg-black/[.03] transition-colors hover:border-black/35">
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
        className="relative aspect-square w-full max-w-[440px] touch-none select-none overflow-hidden rounded-[14px] border-[1.5px] border-black/15 bg-black/[.04]"
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
      >
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
        <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
          ลากเพื่อจัดตำแหน่ง
        </div>
      </div>

      <div className="mt-3 flex max-w-[440px] items-center gap-3">
        <span className="text-[12px] font-medium text-black/45">ซูม</span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer accent-[#0a0a0a]"
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
