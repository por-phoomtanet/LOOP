import { categoryRepository } from "../repositories/category.repository";
import { productRepository } from "../repositories/product.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";

type ProductInput = {
  title: string;
  description: string;
  categoryId: number;
  pricePerDay: number;
  location: string;
  lat?: number;
  lng?: number;
};

async function assertActiveCategory(categoryId: number) {
  const category = await categoryRepository.findById(categoryId);
  if (!category || !category.isActive) {
    throw new BadRequestError("ไม่พบหมวดหมู่นี้ หรือหมวดหมู่นี้ถูกปิดใช้งานอยู่");
  }
}

async function findOwnedProduct(id: number, userId: number) {
  const product = await productRepository.findById(id);
  if (!product) throw new NotFoundError("ไม่พบประกาศนี้");
  if (product.ownerId !== userId) throw new ForbiddenError("ไม่มีสิทธิ์แก้ไขประกาศนี้");
  return product;
}

export async function listProductsForAdmin() {
  const products = await productRepository.findAllForAdmin();
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    categoryName: p.category.name,
    ownerName: p.owner.name,
    pricePerDay: p.pricePerDay,
    status: p.status,
    ratingAvg: p.ratingAvg,
    location: p.location,
    thumbnailUrl: p.images[0]?.url ?? null,
    createdAt: p.createdAt,
  }));
}

export async function createProduct(input: ProductInput, userId: number) {
  await assertActiveCategory(input.categoryId);
  return productRepository.create({
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    pricePerDay: input.pricePerDay,
    location: input.location,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    ownerId: userId,
    createdById: userId,
  });
}

export async function updateProduct(id: number, input: Partial<ProductInput>, userId: number) {
  await findOwnedProduct(id, userId);
  if (input.categoryId !== undefined) await assertActiveCategory(input.categoryId);
  return productRepository.update(id, { ...input, updatedById: userId });
}

export async function setProductStatus(id: number, status: "ACTIVE" | "PAUSED", userId: number) {
  const product = await findOwnedProduct(id, userId);
  if (product.status !== "ACTIVE" && product.status !== "PAUSED") {
    throw new BadRequestError("ประกาศนี้ยังไม่ผ่านการตรวจสอบ ไม่สามารถพัก/เริ่มใหม่ได้");
  }
  return productRepository.setStatus(id, status, userId);
}

export async function deleteProduct(id: number, userId: number) {
  await findOwnedProduct(id, userId);
  await productRepository.softDelete(id);
}

export async function addProductImages(id: number, userId: number, files: { filename: string }[]) {
  await findOwnedProduct(id, userId);
  const existingCount = await productRepository.countImages(id);
  return Promise.all(
    files.map((file, i) =>
      productRepository.addImage(id, `/uploads/products/${file.filename}`, existingCount + i),
    ),
  );
}

export async function addPickupOption(id: number, userId: number, label: string) {
  await findOwnedProduct(id, userId);
  return productRepository.addPickupOption(id, label);
}

export async function removePickupOption(id: number, optionId: number, userId: number) {
  await findOwnedProduct(id, userId);
  const option = await productRepository.findPickupOptionById(optionId);
  if (!option || option.productId !== id) throw new NotFoundError("ไม่พบจุดรับสินค้านี้");
  await productRepository.removePickupOption(optionId);
}

export async function listMyListings(userId: number) {
  const products = await productRepository.findByOwner(userId);
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    pricePerDay: p.pricePerDay,
    location: p.location,
    lat: p.lat,
    lng: p.lng,
    status: p.status,
    ratingAvg: p.ratingAvg,
    reviewCount: p.reviewCount,
    images: p.images.map((img) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
    pickupOptions: p.pickupOptions.map((o) => ({ id: o.id, label: o.label })),
    createdAt: p.createdAt,
  }));
}
