type RentPriceTiers = {
  pricePerDay: number;
  price3Day?: number | null;
  price7Day?: number | null;
};

// จำนวนคืนระหว่างวันเช็คอิน-เช็คเอาท์ — ปัดขึ้นเสมอ (กันกรณีเวลาไม่ตรงเที่ยงคืนพอดี)
export function diffInDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
}

// ปัดขึ้น tier ถัดไปเสมอ (แบบ A) — ดูสูตรเต็มใน CLAUDE.md Dev Standard #21
export function resolveRentPrice(nights: number, tiers: RentPriceTiers): number {
  const table = [
    { days: 1, price: tiers.pricePerDay },
    ...(tiers.price3Day != null ? [{ days: 3, price: tiers.price3Day }] : []),
    ...(tiers.price7Day != null ? [{ days: 7, price: tiers.price7Day }] : []),
  ];

  const matched = table.find((t) => nights <= t.days);
  if (matched) return matched.price;

  const highest = table[table.length - 1];
  return highest.price + (nights - highest.days) * tiers.pricePerDay;
}
