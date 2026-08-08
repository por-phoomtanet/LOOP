import type { PickupMethod, ProductStatus } from "@loop/db";
import { prisma } from "@loop/db";

const priceTiersInclude = {
  priceTiers: { orderBy: { days: "asc" as const } },
};

const ownerListInclude = {
  category: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  pickupOptions: true,
  ...priceTiersInclude,
};

type PriceTierInput = { days: number; price: number };

export const productRepository = {
  findAllForAdmin() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        owner: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        ...priceTiersInclude,
      },
      orderBy: { id: "desc" },
    });
  },

  findByIdForAdmin(id: number) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { name: true } },
        owner: { select: { name: true, email: true, phone: true } },
        images: { orderBy: { sortOrder: "asc" } },
        pickupOptions: true,
        ...priceTiersInclude,
      },
    });
  },

  async findActivePublic(
    filters: { q?: string; category?: string },
    pagination: { page: number; pageSize: number },
  ) {
    // แยก where เป็น const เดียว ใช้ทั้ง findMany + count (กัน filter หลุดไม่ตรงกัน)
    const where = {
      status: "ACTIVE" as const,
      deletedAt: null,
      ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" as const } } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          owner: { select: { name: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          ...priceTiersInclude,
        },
        orderBy: { id: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { rows, total };
  },

  create(data: {
    title: string;
    description: string;
    categoryId: number;
    pricePerDay: number;
    priceTiers: PriceTierInput[];
    location: string;
    lat: number | null;
    lng: number | null;
    ownerId: number;
    createdById: number;
    status: ProductStatus;
  }) {
    const { priceTiers, ...rest } = data;
    return prisma.product.create({
      data: { ...rest, priceTiers: { create: priceTiers } },
      include: priceTiersInclude,
    });
  },

  findById(id: number) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: priceTiersInclude,
    });
  },

  update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      categoryId: number;
      pricePerDay: number;
      priceTiers: PriceTierInput[];
      location: string;
      lat: number | null;
      lng: number | null;
    }> & { updatedById: number },
  ) {
    const { priceTiers, ...rest } = data;
    if (priceTiers === undefined) {
      return prisma.product.update({ where: { id }, data: rest, include: priceTiersInclude });
    }
    // แทนที่ tier ทั้งชุดเสมอ (ไม่ diff ทีละแถว) — ไม่มีอะไรอ้างอิง ProductPriceTier.id
    // โดยตรงจากนอกไฟล์นี้ (Rental snapshot ราคาแยกไว้แล้ว ตาม Dev Standard #19) จึงลบ+สร้างใหม่ได้ปลอดภัย
    return prisma.$transaction(async (tx) => {
      await tx.productPriceTier.deleteMany({ where: { productId: id } });
      if (priceTiers.length > 0) {
        await tx.productPriceTier.createMany({
          data: priceTiers.map((t) => ({ productId: id, days: t.days, price: t.price })),
        });
      }
      return tx.product.update({ where: { id }, data: rest, include: priceTiersInclude });
    });
  },

  setStatus(id: number, status: ProductStatus, updatedById: number) {
    return prisma.product.update({ where: { id }, data: { status, updatedById } });
  },

  softDelete(id: number) {
    return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  findByOwner(ownerId: number) {
    return prisma.product.findMany({
      where: { ownerId, deletedAt: null },
      include: ownerListInclude,
      orderBy: { id: "desc" },
    });
  },

  countImages(productId: number) {
    return prisma.productImage.count({ where: { productId } });
  },

  addImage(productId: number, url: string, sortOrder: number) {
    return prisma.productImage.create({ data: { productId, url, sortOrder } });
  },

  addPickupOption(productId: number, type: PickupMethod, label: string) {
    return prisma.pickupOption.create({ data: { productId, type, label } });
  },

  findPickupOptionById(id: number) {
    return prisma.pickupOption.findUnique({ where: { id } });
  },

  findPickupOptionByProductAndType(productId: number, type: PickupMethod) {
    return prisma.pickupOption.findFirst({ where: { productId, type } });
  },

  removePickupOption(id: number) {
    return prisma.pickupOption.delete({ where: { id } });
  },
};
