import { categoryRepository } from "../repositories/category.repository";
import { ConflictError, NotFoundError } from "../utils/errors";
import { slugify } from "../utils/slugify";

function flatten<T extends { productCount?: number; _count?: { products: number } }>(c: T) {
  const { _count, ...rest } = c;
  return { ...rest, productCount: _count?.products ?? 0 };
}

export async function listCategories(status: "active" | "all") {
  const categories = await categoryRepository.findAll(status);
  return categories.map(flatten);
}

export async function createCategory(input: { name: string; slug?: string }, userId: number) {
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

  const existing = await categoryRepository.findBySlug(slug);
  if (existing) throw new ConflictError("มีหมวดหมู่ที่ใช้ slug นี้อยู่แล้ว");

  return categoryRepository.create({ name: input.name, slug, createdById: userId });
}

export async function updateCategory(
  id: number,
  input: { name?: string; slug?: string; isActive?: boolean },
  userId: number,
) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError("ไม่พบหมวดหมู่นี้");

  let slug = category.slug;
  if (input.slug?.trim()) {
    slug = slugify(input.slug);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing && existing.id !== id)
      throw new ConflictError("มีหมวดหมู่ที่ใช้ slug นี้อยู่แล้ว");
  }

  return categoryRepository.update(id, { ...input, slug, updatedById: userId });
}

export async function setCategoryStatus(id: number, isActive: boolean, userId: number) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError("ไม่พบหมวดหมู่นี้");

  return categoryRepository.setActive(id, isActive, userId);
}

export async function deleteCategory(id: number) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError("ไม่พบหมวดหมู่นี้");

  const productCount = await categoryRepository.countProducts(id);
  if (productCount > 0) {
    throw new ConflictError(`ลบไม่ได้ — มีสินค้า ${productCount} รายการอยู่ในหมวดหมู่นี้`);
  }

  await categoryRepository.softDelete(id);
}
