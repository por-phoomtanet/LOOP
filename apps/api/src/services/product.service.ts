import { categoryRepository } from "../repositories/category.repository";
import { productRepository } from "../repositories/product.repository";
import { publicUrlFor } from "../middleware/upload";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";

type CreateListingInput = {
  title: string;
  description: string;
  categoryId: number;
  pricePerDay: number;
  pickupOptions: string[];
};

export async function createListing(ownerId: number, input: CreateListingInput) {
  const category = await categoryRepository.findById(input.categoryId);
  if (!category) throw new NotFoundError("ไม่พบหมวดหมู่นี้");

  // prototype ไม่มีช่อง location เดี่ยว — ใช้จุดรับสินค้าแรกเป็นที่ตั้งของสินค้า
  const location = input.pickupOptions[0]?.trim() || "ไม่ระบุ";

  const product = await productRepository.create({
    title: input.title.trim(),
    description: input.description.trim(),
    categoryId: input.categoryId,
    ownerId,
    pricePerDay: input.pricePerDay,
    location,
    pickupOptions: input.pickupOptions.map((l) => l.trim()).filter(Boolean),
  });

  return product;
}

export async function addProductImages(
  actingUserId: number,
  productId: number,
  filenames: string[],
) {
  if (filenames.length === 0) throw new BadRequestError("กรุณาอัปโหลดรูปสินค้าอย่างน้อย 1 รูป");

  const product = await productRepository.findById(productId);
  if (!product) throw new NotFoundError("ไม่พบสินค้านี้");
  if (product.ownerId !== actingUserId) {
    throw new ForbiddenError("จัดการได้เฉพาะประกาศของตัวเอง");
  }

  const startOrder = await productRepository.countImages(productId);
  const urls = filenames.map((filename) => publicUrlFor("products", filename));
  const images = await productRepository.addImages(productId, urls, startOrder);
  return images;
}
