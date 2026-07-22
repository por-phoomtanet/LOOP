import * as categoryService from "../services/category.service";

type CreateInput = Parameters<typeof categoryService.createCategory>[0];
type UpdateInput = Parameters<typeof categoryService.updateCategory>[1];

export async function list(query: unknown) {
  const status = (query as { status?: string }).status === "all" ? "all" : "active";
  const result = await categoryService.listCategories(status);
  return { data: result, message: "ok" };
}

export async function create(body: unknown, userId: number) {
  const result = await categoryService.createCategory(body as CreateInput, userId);
  return { data: result, message: "ok" };
}

export async function update(id: number, body: unknown, userId: number) {
  const result = await categoryService.updateCategory(id, body as UpdateInput, userId);
  return { data: result, message: "ok" };
}

export async function updateStatus(id: number, body: unknown, userId: number) {
  const { isActive } = body as { isActive: boolean };
  const result = await categoryService.setCategoryStatus(id, isActive, userId);
  return { data: result, message: "ok" };
}

export async function remove(id: number) {
  await categoryService.deleteCategory(id);
  return { data: null, message: "ok" };
}
