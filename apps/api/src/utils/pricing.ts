export type RentPriceTier = { days: number; price: number };

// จำนวนคืนระหว่างวันเช็คอิน-เช็คเอาท์ — ปัดขึ้นเสมอ (กันกรณีเวลาไม่ตรงเที่ยงคืนพอดี)
export function diffInDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
}

// ปัดขึ้น tier ถัดไปเสมอ (แบบ A) — เจ้าของกำหนดจำนวนวัน+ราคาของแต่ละ tier เองได้อิสระ
// (ไม่จำกัดแค่ 3/7/15/30 วันอีกต่อไป) tiers ไม่ต้องเรียงมาก่อน ฟังก์ชันเรียงให้เอง
// ดูสูตรเต็มใน CLAUDE.md Dev Standard #21
export function resolveRentPrice(
  nights: number,
  pricePerDay: number,
  tiers: RentPriceTier[] = [],
): number {
  const table = [{ days: 1, price: pricePerDay }, ...tiers].sort((a, b) => a.days - b.days);

  const matched = table.find((t) => nights <= t.days);
  if (matched) return matched.price;

  const highest = table[table.length - 1];
  return highest.price + (nights - highest.days) * pricePerDay;
}
