"use client";

import { useState } from "react";

export type PickupOption = {
  id: string;
  label: string;
  selected: boolean;
};

type Props = {
  options: PickupOption[];
  onChange: (options: PickupOption[]) => void;
};

export function PickupOptionsEditor({ options, onChange }: Props) {
  const [newLabel, setNewLabel] = useState("");

  function toggle(id: string) {
    onChange(options.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o)));
  }

  function remove(id: string) {
    onChange(options.filter((o) => o.id !== id));
  }

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    onChange([...options, { id: `p-${Date.now()}`, label, selected: true }]);
    setNewLabel("");
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((pk) => (
        <div
          key={pk.id}
          className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-black/[.14] px-3 py-2.5"
        >
          <button
            type="button"
            onClick={() => toggle(pk.id)}
            aria-label="เลือกจุดรับสินค้า"
            className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border-[1.5px] border-[#0a0a0a] p-0"
            style={{ background: pk.selected ? "#0a0a0a" : "transparent" }}
          >
            {pk.selected && (
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
            )}
          </button>
          <div className="flex-1 text-[14px] text-[#0a0a0a]">{pk.label}</div>
          <button
            type="button"
            onClick={() => remove(pk.id)}
            aria-label="ลบจุดรับสินค้า"
            className="flex-none border-0 bg-transparent p-1 text-black/35 hover:text-black/60"
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

      <div className="mt-1 flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="เพิ่มสถานที่อื่น…"
          className="flex-1 rounded-[10px] border-[1.5px] border-black/15 px-3 py-2.5 text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
        />
        <button
          type="button"
          onClick={add}
          className="flex-none rounded-[10px] bg-[#0a0a0a] px-[18px] text-[13.5px] font-semibold text-white"
        >
          เพิ่ม
        </button>
      </div>
    </div>
  );
}
