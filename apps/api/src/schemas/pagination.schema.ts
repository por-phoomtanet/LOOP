import { z } from "zod";

// query string มาเป็น string เสมอ → coerce เป็น number; ค่า default ตรงกับ pageSize ที่ HomePage ใช้ (24)
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export type Pagination = z.infer<typeof paginationSchema>;
