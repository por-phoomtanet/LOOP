"use client";

// ต้อง import ก่อน antd/antd-img-crop เพื่อให้ crop modal ใช้ createRoot ของ React 19
import "@ant-design/v5-patch-for-react-19";
import { Upload } from "antd";
import type { UploadFile } from "antd";
import ImgCrop from "antd-img-crop";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EyeIcon } from "@/shared/components/EyeIcon";
import { authApi } from "../services/authApi";
import type { AccountType, RegisterResult } from "../types";
import { PdpaModal } from "./PdpaModal";

// map ชื่อ field ที่ backend คืนมาใน missingFields → ชื่อภาษาไทยที่ผู้ใช้เข้าใจ
const OCR_FIELD_LABELS: Record<string, string> = {
  idNumber: "เลขบัตรประชาชน",
  nameTh: "ชื่อ-นามสกุล (ไทย)",
  nameEn: "ชื่อ-นามสกุล (อังกฤษ)",
  address: "ที่อยู่",
  dob: "วันเกิด",
};

type Props = {
  onRegistered: (
    result: RegisterResult,
    idCardFile: File | null,
    faceVerifiedMock: boolean,
    profileFile: File | null,
  ) => void;
};

export function SignupForm({ onRegistered }: Props) {
  const [accountType, setAccountType] = useState<AccountType>("INDIVIDUAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [profileFileList, setProfileFileList] = useState<UploadFile[]>([]);
  const [idCardFileList, setIdCardFileList] = useState<UploadFile[]>([]);
  const [faceVerifiedMock, setFaceVerifiedMock] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const [pdpaModalOpen, setPdpaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrMissingFields, setOcrMissingFields] = useState<string[]>([]);
  const [ocrDone, setOcrDone] = useState(false);
  const [idCardNumber, setIdCardNumber] = useState("");
  const [idCardNameTh, setIdCardNameTh] = useState("");
  const [idCardNameEn, setIdCardNameEn] = useState("");
  const [idCardAddress, setIdCardAddress] = useState("");
  const [idCardDob, setIdCardDob] = useState("");

  // อัปโหลดบัตรแล้วต้องให้ OCR อ่านครบทุกฟิลด์ก่อนถึงจะสมัครได้ — ไม่มีให้กรอกเอง
  // ต้องอัปโหลดรูปใหม่จนกว่าจะผ่าน (ยังไม่อัปโหลดเลยก็สมัครได้ตามเดิม บัตรไม่บังคับ)
  const idCardChecked =
    !idCardFileList.length || (ocrDone && !ocrError && ocrMissingFields.length === 0);

  const canSubmit =
    name.trim() &&
    email.trim() &&
    emailVerified &&
    phone.trim() &&
    password.length >= 8 &&
    pdpaAccepted &&
    !ocrLoading &&
    idCardChecked;

  async function handleSendEmailOtp() {
    if (!email.trim() || emailOtpSending) return;
    setEmailOtpSending(true);
    setEmailOtpError(null);
    try {
      await authApi.requestSignupOtp(email.trim());
      setEmailOtpSent(true);
      setEmailOtpCode("");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setEmailOtpError(typeof msg === "string" ? msg : "ส่งรหัสยืนยันไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setEmailOtpSending(false);
    }
  }

  async function handleVerifyEmailOtp() {
    if (emailOtpCode.length !== 6 || emailOtpVerifying) return;
    setEmailOtpVerifying(true);
    setEmailOtpError(null);
    try {
      await authApi.verifySignupOtp(email.trim(), emailOtpCode);
      setEmailVerified(true);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setEmailOtpError(typeof msg === "string" ? msg : "ยืนยันรหัสไม่สำเร็จ");
    } finally {
      setEmailOtpVerifying(false);
    }
  }

  // พอครอปรูปบัตรเสร็จ (originFileObj เปลี่ยน) ให้ OCR อัตโนมัติทันที — ไม่ต้องรอผู้ใช้กดปุ่ม
  const idCardOriginFile = idCardFileList[0]?.originFileObj as File | undefined;
  useEffect(() => {
    if (!idCardOriginFile) return;
    let cancelled = false;
    setOcrLoading(true);
    setOcrError(null);
    setOcrMissingFields([]);
    setOcrDone(false);
    authApi
      .ocrIdCard(idCardOriginFile)
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data;
        setIdCardNumber(data.idNumber ?? "");
        setIdCardNameTh(data.nameTh ?? "");
        setIdCardNameEn(data.nameEn ?? "");
        setIdCardAddress(data.address ?? "");
        setIdCardDob(data.dob ?? "");
        setOcrMissingFields(data.missingFields ?? []);
        setOcrDone(true);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
        setOcrError(typeof msg === "string" ? msg : "อ่านข้อมูลจากบัตรไม่สำเร็จ กรุณากรอกเอง");
      })
      .finally(() => {
        if (!cancelled) setOcrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idCardOriginFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.register({
        accountType,
        name,
        email,
        phone,
        password,
        pdpaConsent: true,
        ...(idCardNumber.trim() ? { idCardNumber: idCardNumber.trim() } : {}),
        ...(idCardNameTh.trim() ? { idCardNameTh: idCardNameTh.trim() } : {}),
        ...(idCardNameEn.trim() ? { idCardNameEn: idCardNameEn.trim() } : {}),
        ...(idCardAddress.trim() ? { idCardAddress: idCardAddress.trim() } : {}),
        ...(idCardDob.trim() ? { idCardDob: idCardDob.trim() } : {}),
      });
      // ไฟล์ที่ครอปแล้วอยู่ใน originFileObj (antd-img-crop แทนที่ให้หลังครอป)
      const idCardFile = idCardOriginFile ?? null;
      const profileFile = (profileFileList[0]?.originFileObj as File | undefined) ?? null;
      onRegistered(res.data.data, idCardFile, faceVerifiedMock, profileFile);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(typeof msg === "string" ? msg : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[460px] px-6 py-12">
      <Link
        href="/"
        aria-label="กลับหน้าแรก"
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
      </Link>
      <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.12em] text-black/40">
        สร้างบัญชี
      </div>
      <h1 className="font-arch mb-2 text-[28px] font-extrabold tracking-[-.02em]">
        สมัครใช้งาน rently
      </h1>
      <p className="mb-8 text-[14px] text-black/60">
        สมัครสมาชิกเพื่อเริ่มเช่าและปล่อยเช่าสินค้าใกล้คุณ
      </p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">ประเภทบัญชี</label>
        <div className="inline-flex overflow-hidden rounded-full border border-black/[.14]">
          {(
            [
              { value: "INDIVIDUAL" as const, label: "บุคคล" },
              { value: "SHOP" as const, label: "ร้านค้า" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccountType(opt.value)}
              className="px-5 py-2 text-[13.5px] font-semibold transition-colors"
              style={{
                background: accountType === opt.value ? "#2D5DA8" : "transparent",
                color: accountType === opt.value ? "#fff" : "rgba(45,93,168,.6)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-1 block text-[13px] font-medium text-black/70">
          รูปโปรไฟล์ <span className="font-normal text-black/40">(ไม่บังคับ)</span>
        </label>
        <p className="mb-2.5 text-[12.5px] text-black/50">
          รูปนี้จะแสดงให้ผู้ใช้อื่นเห็นเวลาเช่า/ปล่อยเช่าสินค้า
        </p>

        <ImgCrop
          rotationSlider
          cropShape="round"
          aspect={1}
          modalTitle="ครอปรูปโปรไฟล์"
          modalOk="ตกลง"
          modalCancel="ยกเลิก"
        >
          <Upload
            listType="picture-card"
            fileList={profileFileList}
            onChange={({ fileList: fl }) => {
              // gen thumbUrl ใหม่เองทุกครั้ง — เหตุผลเดียวกับช่องรูปบัตรด้านล่าง
              const withFreshThumb = fl.map((f) =>
                f.originFileObj
                  ? { ...f, thumbUrl: URL.createObjectURL(f.originFileObj as File) }
                  : f,
              );
              setProfileFileList(withFreshThumb);
            }}
            customRequest={({ onSuccess }) => onSuccess?.("ok")}
            accept="image/png,image/jpeg,image/jpg"
            maxCount={1}
            onPreview={async (file) => {
              const src = file.url ?? URL.createObjectURL(file.originFileObj as File);
              window.open(src);
            }}
          >
            {profileFileList.length >= 1 ? null : (
              <div className="text-black/55">
                <div className="text-[20px] leading-none">+</div>
                <div className="mt-1.5 text-[13px]">อัปโหลด</div>
              </div>
            )}
          </Upload>
        </ImgCrop>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-black/70">อีเมล</label>
        <div className="focus-within:border-brand-400 flex items-center rounded-lg border border-black/[.14] transition-colors">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailVerified(false);
              setEmailOtpSent(false);
              setEmailOtpError(null);
            }}
            disabled={emailVerified}
            className="w-full border-0 px-3.5 py-2.5 text-[14px] outline-none disabled:bg-black/[.02] disabled:text-black/50"
          />
          <button
            type="button"
            onClick={handleSendEmailOtp}
            disabled={!email.trim() || emailOtpSending || emailVerified}
            className={`flex-none whitespace-nowrap border-0 bg-transparent px-3.5 text-[12.5px] font-semibold ${
              emailVerified
                ? "text-emerald-600 disabled:text-emerald-600"
                : "text-brand-600 disabled:text-black/30"
            }`}
          >
            {emailVerified
              ? "ยืนยันแล้ว ✓"
              : emailOtpSending
                ? "กำลังส่ง…"
                : emailOtpSent
                  ? "ส่งอีกครั้ง"
                  : "ส่ง OTP"}
          </button>
        </div>

        {emailOtpSent && !emailVerified && (
          <div className="mt-2.5 flex items-center gap-2">
            <input
              value={emailOtpCode}
              onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="รหัส 6 หลักจากอีเมล"
              className="focus:border-brand-400 w-full rounded-lg border border-black/[.14] px-3.5 py-2 text-[14px] tracking-[.2em] outline-none"
            />
            <button
              type="button"
              onClick={handleVerifyEmailOtp}
              disabled={emailOtpCode.length !== 6 || emailOtpVerifying}
              className="flex-none rounded-lg bg-black px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {emailOtpVerifying ? "กำลังยืนยัน…" : "ยืนยัน"}
            </button>
          </div>
        )}
        {emailOtpError && <p className="mt-1.5 text-[12px] text-red-600">{emailOtpError}</p>}
      </div>

      <Field label="รหัสผ่าน" value={password} onChange={setPassword} type="password" />
      <Field
        label="ชื่อผู้ใช้ (ชื่อที่จะแสดงในระบบ)"
        value={name}
        onChange={setName}
        placeholder=""
      />
      <Field label="เบอร์โทร" value={phone} onChange={setPhone} type="tel" />

      <div className="mb-5">
        <label className="mb-1 block text-[13px] font-medium text-black/70">รูปบัตรประชาชน</label>
        <p className="mb-2.5 text-[12.5px] text-sky-600">
          ใช้เพื่อยืนยันตัวตนสำหรับการเช่าที่ปลอดภัย ไม่เปิดเผยต่อผู้ใช้อื่น
        </p>

        <ImgCrop
          rotationSlider
          aspect={1.586}
          modalTitle="ครอปรูปบัตรประชาชน"
          modalOk="ตกลง"
          modalCancel="ยกเลิก"
        >
          <Upload
            listType="picture-card"
            fileList={idCardFileList}
            onChange={({ fileList: fl }) => {
              // antd cache thumbUrl ตาม uid เดิม ไม่รู้ว่า antd-img-crop แทนที่ originFileObj
              // ด้วยรูปที่ครอป/หมุนแล้ว (lib ไม่ set thumbUrl ใหม่ให้เอง) — gen เองจาก
              // originFileObj ล่าสุดเสมอ ไม่งั้น preview จะค้างเป็นรูปก่อนครอป
              const withFreshThumb = fl.map((f) =>
                f.originFileObj
                  ? { ...f, thumbUrl: URL.createObjectURL(f.originFileObj as File) }
                  : f,
              );
              setIdCardFileList(withFreshThumb);
            }}
            // antd-img-crop มีบั๊กเก่า (เปิดมาตั้งแต่ปี 2021 ยังไม่แก้): ถ้า beforeUpload คืนค่า
            // false ตรงๆ ตัว runBeforeUpload ภายในจะทิ้งไฟล์ที่ครอปแล้วไปเลย ใช้ไฟล์เดิมก่อนครอปแทน
            // (github.com/nanxiaobei/antd-img-crop/issues/123) — ห้ามใช้ beforeUpload={() => false}
            // แก้ด้วยการกันอัปโหลดจริงผ่าน customRequest แบบ no-op แทน
            customRequest={({ onSuccess }) => onSuccess?.("ok")}
            accept="image/png,image/jpeg,image/jpg"
            maxCount={1}
            onPreview={async (file) => {
              const src = file.url ?? URL.createObjectURL(file.originFileObj as File);
              window.open(src);
            }}
          >
            {idCardFileList.length >= 1 ? null : (
              <div className="text-black/55">
                <div className="text-[20px] leading-none">+</div>
                <div className="mt-1.5 text-[13px]">อัปโหลด</div>
              </div>
            )}
          </Upload>
        </ImgCrop>
      </div>

      {ocrLoading && (
        <div className="mb-6 flex items-center justify-center gap-2.5 rounded-xl border border-black/10 bg-black/[.02] p-4 text-[13px] text-black/55">
          <span className="border-brand-600 h-4 w-4 flex-none animate-spin rounded-full border-2 border-t-transparent" />
          กำลังตรวจสอบข้อมูลบัตร…
        </div>
      )}

      {!ocrLoading && ocrError && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          {ocrError}
        </div>
      )}

      {/* อ่านไม่ครบ = ต้องอัปโหลดใหม่อย่างเดียว ไม่มีให้กรอกเอง และกดสร้างบัญชีไม่ได้จนกว่าจะผ่าน */}
      {!ocrLoading && !ocrError && ocrMissingFields.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-[13px] text-amber-800">
          <p className="mb-1 font-semibold">ภาพไม่ชัดเจน อ่านข้อมูลได้ไม่ครบ</p>
          <p className="text-[12.5px]">
            อ่านไม่ได้: {ocrMissingFields.map((f) => OCR_FIELD_LABELS[f] ?? f).join(", ")} — กรุณา
            อัปโหลดรูปใหม่ให้เห็นบัตรเต็มใบ ชัดเจน ไม่มีแสงสะท้อนหรือเงาบัง
          </p>
        </div>
      )}

      {/* อ่านครบทุกฟิลด์ = ซ่อนฟอร์มไปเลย เหลือแค่แถบยืนยันว่าตรวจเสร็จแล้ว
          (ข้อมูลที่อ่านได้ยังถูกส่งไปตอนสร้างบัญชีตามปกติ) */}
      {!ocrLoading && !ocrError && ocrDone && ocrMissingFields.length === 0 && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-[13px] font-semibold text-emerald-800">
          ✓ ตรวจสอบข้อมูลบัตรเสร็จสิ้น
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setFaceModalOpen(true)}
          className="rounded-full border border-black/[.16] px-4 py-2 text-[12.5px] font-semibold text-black/70 hover:border-black/35"
        >
          📱 ยืนยันใบหน้าผ่านโทรศัพท์{faceVerifiedMock ? " ✓" : ""}
        </button>
      </div>

      {faceModalOpen && (
        <div className="mb-6 rounded-xl border border-black/10 bg-black/[.02] p-4 text-center text-[13px]">
          {faceVerifiedMock ? (
            <p className="font-semibold text-emerald-600">ยืนยันใบหน้าสำเร็จ ✓</p>
          ) : (
            <>
              <p className="mb-3 text-black/60">สแกนใบหน้าผ่านมือถือเพื่อยืนยันตัวตน (จำลอง)</p>
              <button
                type="button"
                onClick={() => setFaceVerifiedMock(true)}
                className="rounded-full bg-black px-4 py-2 text-[12.5px] font-semibold text-white"
              >
                จำลองสแกนสำเร็จ
              </button>
            </>
          )}
        </div>
      )}

      <label className="mb-6 flex items-start gap-2.5 text-[13px] text-black/70">
        <input
          type="checkbox"
          checked={pdpaAccepted}
          onChange={(e) => setPdpaAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none accent-[#2D5DA8]"
        />
        <span>
          ฉันยอมรับ{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setPdpaModalOpen(true);
            }}
            className="text-brand-600 underline underline-offset-2"
          >
            นโยบายความเป็นส่วนตัว (PDPA)
          </button>{" "}
          เกี่ยวกับการเก็บและใช้ข้อมูลส่วนบุคคลของฉันในระบบ
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="bg-brand-600 w-full rounded-full py-3.5 text-[14.5px] font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {submitting ? "กำลังสร้างบัญชี…" : "สร้างบัญชี"}
      </button>

      <PdpaModal open={pdpaModalOpen} onClose={() => setPdpaModalOpen(false)} />
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
  placeholder?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-5">
      <label className="mb-2 block text-[13px] font-medium text-black/70">{label}</label>
      <div className="focus-within:border-brand-400 flex items-center rounded-lg border border-black/[.14] transition-colors">
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-0 px-3.5 py-2.5 text-[14px] outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            className="flex-none border-0 bg-transparent px-3 text-black/40 hover:text-black/70"
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>
    </div>
  );
}
