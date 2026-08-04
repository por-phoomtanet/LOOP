"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PdpaModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-[0_20px_60px_rgba(10,10,10,.25)]">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <h2 className="font-arch text-[18px] font-extrabold tracking-[-.02em]">
            นโยบายความเป็นส่วนตัว (PDPA)
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-black/40 hover:bg-black/5 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 text-[13.5px] leading-relaxed text-black/70">
          <p className="mb-4">
            renty (&quot;เรา&quot;) เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติ
            คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            เพื่อให้บริการแพลตฟอร์มเช่าสินค้าระหว่างบุคคลอย่าง ปลอดภัย
            โปรดอ่านรายละเอียดด้านล่างก่อนยอมรับ
          </p>

          <h3 className="mb-1.5 font-semibold text-black">1. ข้อมูลที่เราเก็บรวบรวม</h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>
              ข้อมูลบัญชี: ชื่อผู้ใช้ อีเมล เบอร์โทร รหัสผ่าน (เข้ารหัสไว้ ไม่เก็บเป็นข้อความธรรมดา)
            </li>
            <li>
              ข้อมูลยืนยันตัวตน: รูปถ่ายบัตรประชาชน และข้อมูลที่อ่านได้จากบัตร (เลขบัตรประชาชน
              ชื่อ-นามสกุลภาษาไทย/อังกฤษ ที่อยู่ วันเกิด) — อ่านด้วยระบบ AI (OCR) โดยอัตโนมัติ
              ท่านตรวจสอบและแก้ไขได้ก่อนยืนยัน
            </li>
            <li>
              ข้อมูลการรับเงิน (เฉพาะผู้ปล่อยเช่า): ชื่อ-นามสกุลจริงตามบัญชีธนาคาร และรูป QR
              พร้อมเพย์
            </li>
            <li>ข้อมูลการทำธุรกรรม: ประกาศสินค้า คำขอเช่า ยอดชำระเงิน และรูปสลิปโอนเงิน</li>
          </ul>

          <h3 className="mb-1.5 font-semibold text-black">2. วัตถุประสงค์ในการใช้ข้อมูล</h3>
          <ul className="mb-4 list-disc space-y-1 pl-5">
            <li>ยืนยันตัวตนผู้ใช้เพื่อความปลอดภัยในการเช่า-ให้เช่า และป้องกันการสมัครบัญชีซ้ำ</li>
            <li>ตรวจสอบความถูกต้องของการชำระเงินระหว่างผู้เช่าและผู้ให้เช่า</li>
            <li>ติดต่อสื่อสารเกี่ยวกับการใช้งานและการทำธุรกรรมบนแพลตฟอร์ม</li>
            <li>ป้องกันการฉ้อโกงและการใช้งานที่ผิดวัตถุประสงค์</li>
          </ul>

          <h3 className="mb-1.5 font-semibold text-black">3. การประมวลผลโดยบุคคลภายนอก</h3>
          <p className="mb-4">
            รูปบัตรประชาชนและรูปสลิปโอนเงินจะถูกส่งไปประมวลผลผ่านบริการ AI ภายนอก (OpenRouter)
            เพื่ออ่านข้อมูลอัตโนมัติเท่านั้น ไม่ใช้เพื่อวัตถุประสงค์อื่น
            และไม่ส่งต่อให้บุคคลภายนอกรายอื่น เพิ่มเติม
          </p>

          <h3 className="mb-1.5 font-semibold text-black">4. การเก็บรักษาและการเปิดเผย</h3>
          <p className="mb-4">
            เราเก็บเลขบัตรประชาชนแบบเต็มไว้ในระบบเพื่อป้องกันการสมัครซ้ำด้วยบัตรใบเดียว แต่จะแสดงผล
            แบบปกปิดบางส่วนเสมอ (เช่น x-xxxx-xxxxx-xx-3) ทั้งต่อตัวท่านเองและผู้ดูแลระบบ
            ไม่เปิดเผยข้อมูล ส่วนบุคคลของท่านต่อผู้ใช้รายอื่นเกินความจำเป็นต่อการทำธุรกรรม
          </p>

          <h3 className="mb-1.5 font-semibold text-black">5. สิทธิของเจ้าของข้อมูล</h3>
          <p className="mb-4">
            ท่านมีสิทธิขอเข้าถึง แก้ไข ลบ หรือถอนความยินยอมการเก็บข้อมูลส่วนบุคคลได้ทุกเมื่อ
            โดยติดต่อ ทีมงานผ่านช่องทางในหน้าศูนย์ช่วยเหลือ
            การถอนความยินยอมอาจส่งผลต่อความสามารถในการใช้งาน บางฟีเจอร์ของแพลตฟอร์ม
          </p>

          <p className="text-black/50">
            การกดยอมรับถือว่าท่านรับทราบและยินยอมให้ renty เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล
            ตามที่ระบุไว้ข้างต้น
          </p>
        </div>

        <div className="border-t border-black/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-600 w-full rounded-full py-3 text-[14px] font-semibold text-white"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    </div>
  );
}
