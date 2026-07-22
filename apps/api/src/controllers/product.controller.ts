import * as productService from "../services/product.service";
import { saveImage } from "../plugins/upload";
import { paginationSchema } from "../schemas/pagination.schema";
import { BadRequestError } from "../utils/errors";

type CreateInput = Parameters<typeof productService.createProduct>[0];
type UpdateInput = Parameters<typeof productService.updateProduct>[1];

export async function adminList() {
  const result = await productService.listProductsForAdmin();
  return { data: result, message: "ok" };
}

export async function publicList(query: unknown) {
  const q = query as { q?: string; category?: string };
  const { page, pageSize } = paginationSchema.parse(query);
  const { data, total } = await productService.listPublicProducts(
    {
      q: typeof q.q === "string" ? q.q : undefined,
      category: typeof q.category === "string" ? q.category : undefined,
    },
    { page, pageSize },
  );
  return { data, message: "ok", total, page, pageSize };
}

export async function create(body: unknown, userId: number) {
  const result = await productService.createProduct(body as CreateInput, userId);
  return { data: result, message: "ok" };
}

export async function update(id: number, body: unknown, userId: number) {
  const result = await productService.updateProduct(id, body as UpdateInput, userId);
  return { data: result, message: "ok" };
}

export async function updateStatus(id: number, body: unknown, userId: number) {
  const { status } = body as { status: "ACTIVE" | "PAUSED" };
  const result = await productService.setProductStatus(id, status, userId);
  return { data: result, message: "ok" };
}

export async function remove(id: number, userId: number) {
  await productService.deleteProduct(id, userId);
  return { data: null, message: "ok" };
}

export async function uploadImages(id: number, userId: number, files: File[]) {
  if (files.length === 0) throw new BadRequestError("กรุณาอัปโหลดรูปอย่างน้อย 1 รูป");
  const filenames = await Promise.all(files.map((f) => saveImage("products", f)));
  const result = await productService.addProductImages(
    id,
    userId,
    filenames.map((filename) => ({ filename })),
  );
  return { data: result, message: "ok" };
}

export async function addPickupOption(id: number, userId: number, body: unknown) {
  const { label } = body as { label: string };
  const result = await productService.addPickupOption(id, userId, label);
  return { data: result, message: "ok" };
}

export async function removePickupOption(id: number, optionId: number, userId: number) {
  await productService.removePickupOption(id, optionId, userId);
  return { data: null, message: "ok" };
}

export async function myListings(userId: number) {
  const result = await productService.listMyListings(userId);
  return { data: result, message: "ok" };
}
