import { getHealth } from "../services/health.service";

// health คืน raw object ตรงๆ (ไม่ใช่ envelope {data,message}) เหมือนเดิม
export function health() {
  return getHealth();
}
