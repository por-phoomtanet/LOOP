"use client";

import "@ant-design/v5-patch-for-react-19";
import { Image, Upload } from "antd";
import type { UploadFile } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/shared/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "../services/authApi";

type Props = {
  // true = ฝังอยู่ในแท็บ "ตั้งค่าการให้เช่า" ของ /my-listings — ตัดคอลัมน์กลาง/ระยะขอบ
  // ของหน้าเดี่ยวออก (ตาม pattern เดียวกับ ListItemForm)
  embedded?: boolean;
  // เรียกหลังบันทึกสำเร็จ — ให้ผู้เรียก (เช่น MyListingsTable) refetch ว่าข้อมูลครบหรือยัง
  onSaved?: () => void;
  // ข้อความเตือนแสดงเหนือฟอร์ม (เช่น ตอนถูก redirect มาเพราะยังลงประกาศไม่ได้)
  notice?: string;
};

export function PaymentProfileForm({ embedded = false, onSaved, notice }: Props) {
  const user = useAuthStore((s) => s.user);
  const [legalName, setLegalName] = useState("");
  // ใช้ antd Upload + ImgCrop แบบเดียวกับหน้าลงประกาศให้เช่า (ListItemForm) แทน input ธรรมดา
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ดึงค่าที่เคยบันทึกไว้มาโชว์ (เดิมเป็น write-only เพราะยังไม่มี endpoint GET —
  // ตอนนี้มีแล้ว) กันความสับสนว่าฟอร์มว่างแปลว่ายังไม่เคยตั้งค่าจริงๆ หรือแค่ไม่โชว์ค่าเดิม
  useEffect(() => {
    if (!user) return;
    authApi
      .getPaymentProfile(user.id)
      .then((res) => {
        setLegalName(res.data.data.legalName ?? "");
        const qrUrl = res.data.data.promptPayQrUrl;
        if (qrUrl) {
          setFileList([
            {
              uid: "existing-qr",
              name: qrUrl,
              status: "done",
              url: resolveUploadUrl(qrUrl),
            },
          ]);
        }
      })
      .catch(() => {});
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      if (legalName.trim()) {
        await authApi.updatePaymentProfile(user.id, legalName.trim());
      }
      // ไฟล์ที่ครอปแล้วอยู่ใน originFileObj (antd-img-crop แทนที่ให้หลังครอป) — รูปเดิม
      // (uid: existing-qr) ไม่มี originFileObj จึงไม่ถูกอัปโหลดซ้ำถ้าไม่ได้เลือกรูปใหม่
      const newFile = fileList[0]?.originFileObj as File | undefined;
      if (newFile) {
        const res = await authApi.uploadPromptPayQr(user.id, newFile);
        setFileList([
          {
            uid: "existing-qr",
            name: res.data.data.promptPayQrUrl,
            status: "done",
            url: resolveUploadUrl(res.data.data.promptPayQrUrl),
          },
        ]);
      }
      setSuccess(true);
      onSaved?.();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  const hasNewFile = !!fileList[0]?.originFileObj;

  return (
    <form
      onSubmit={handleSubmit}
      className={embedded ? "w-full px-5 py-6 sm:px-6" : "mx-auto w-full max-w-[460px] px-6 py-12"}
    >
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        ตั้งค่าการรับเงิน
      </div>
      <h1 className="font-arch mb-2 text-[24px] font-extrabold tracking-[-.02em]">
        ข้อมูลรับเงินสำหรับผู้ปล่อยเช่า
      </h1>
      <p className="mb-8 text-[14px] text-black/60">
        ใช้ตรวจสอบสลิปโอนเงินอัตโนมัติเมื่อมีคนจ่ายค่าเช่า ต้องกรอกให้ครบก่อนจะรับเงินผ่านระบบได้
      </p>

      {notice && !success && (
        <div className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">{notice}</div>
      )}
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          บันทึกข้อมูลสำเร็จ
        </div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">
          ชื่อ-นามสกุลจริง (ตามบัญชีธนาคาร)
        </label>
        <input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="เช่น สมชาย ใจดี"
          className="focus:border-brand-400 w-full rounded-lg border border-black/[.14] px-3.5 py-2.5 text-[14px] outline-none transition-colors"
        />
        <p className="mt-1.5 text-[12px] text-black/40">
          ใช้เทียบกับชื่อผู้รับเงินในสลิปโอนเงิน ไม่แสดงต่อผู้ใช้อื่น
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-medium text-black/70">รูป QR พร้อมเพย์</label>
        {/* ไม่ครอบด้วย ImgCrop เหมือนรูปสินค้า/รูปโปรไฟล์ — QR ครอปแล้วอาจตัดขอบขาด
            สแกนไม่ได้ ต้องอัปโหลดเต็มรูปตามที่เซฟมาจากแอปธนาคารเสมอ */}
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={({ fileList: fl }) => {
            // gen thumbUrl ใหม่เองจาก originFileObj ทันทีที่เลือกไฟล์ ให้พรีวิวไม่ต้องรอ
            // antd อ่านไฟล์เสร็จเอง (เหตุผลเดียวกับ ListItemForm/SignupForm)
            const withFreshThumb = fl.map((f) =>
              f.originFileObj
                ? { ...f, thumbUrl: URL.createObjectURL(f.originFileObj as File) }
                : f,
            );
            setFileList(withFreshThumb);
          }}
          // ไม่ให้ antd Upload ยิงอัปโหลดเอง — อัปโหลดจริงเกิดตอนกด "บันทึกข้อมูล" ผ่าน
          // authApi.uploadPromptPayQr แทน
          customRequest={({ onSuccess }) => onSuccess?.("ok")}
          accept="image/png,image/jpeg,image/jpg"
          maxCount={1}
          onPreview={async (file) => {
            const src = file.url ?? URL.createObjectURL(file.originFileObj as File);
            setPreviewSrc(src);
          }}
        >
          {fileList.length >= 1 ? null : (
            <div className="text-black/55">
              <div className="text-[20px] leading-none">+</div>
              <div className="mt-1.5 text-[13px]">อัปโหลด</div>
            </div>
          )}
        </Upload>
        <p className="mt-1.5 text-[12px] text-black/40">
          เปิดแอปธนาคาร ไปที่หน้า QR พร้อมเพย์ของคุณ บันทึกภาพแล้วอัปโหลดที่นี่
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || (!legalName.trim() && !hasNewFile)}
        className="bg-brand-600 w-full rounded-full py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
      </button>

      {previewSrc && (
        <Image
          style={{ display: "none" }}
          src={previewSrc}
          preview={{
            visible: true,
            src: previewSrc,
            onVisibleChange: (visible) => {
              if (!visible) setPreviewSrc(null);
            },
          }}
        />
      )}
    </form>
  );
}
