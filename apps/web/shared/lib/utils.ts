import { API_ORIGIN } from "@/constants";

export function resolveUploadUrl(url: string) {
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}

const DISTRICT_PREFIX = /^(เขต|อำเภอ|อ\.)/;
const PROVINCE_PREFIX = /^(จังหวัด|จ\.)/;
const BANGKOK_VARIANTS = /^(กรุงเทพมหานคร|กรุงเทพฯ|กรุงเทพ)$/;

// ที่อยู่จริงมาจาก reverse geocode (Nominatim) เป็น string ยาวคั่นด้วย comma
// เช่น "ชุมชนประชาร่วมใจ, แขวงบางขุนศรี, เขตบางกอกน้อย, กรุงเทพมหานคร, 10700, ประเทศไทย"
// ย่อให้เหลือแค่ อำเภอ/เขต (ตัดคำนำหน้าออก), จังหวัด — ไม่เอาตำบล/ชื่อสถานที่/รหัสไปรษณีย์/ประเทศ
// กรุงเทพมหานคร แสดงย่อเป็น "กรุงเทพฯ"
export function formatShortLocation(location: string): string {
  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const districtRaw = parts.find((p) => DISTRICT_PREFIX.test(p));
  const district = districtRaw?.replace(DISTRICT_PREFIX, "").trim();
  let province = parts.find((p) => PROVINCE_PREFIX.test(p));
  if (!province) province = parts.find((p) => BANGKOK_VARIANTS.test(p));
  if (!province) {
    province = [...parts].reverse().find((p) => p !== "ประเทศไทย" && !/^\d+$/.test(p));
  }
  if (province && BANGKOK_VARIANTS.test(province)) province = "กรุงเทพฯ";

  const picked = [district, province].filter((p): p is string => !!p);
  return picked.length > 0 ? picked.join(", ") : location;
}
