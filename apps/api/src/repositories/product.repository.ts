import type { ProductStatus } from "@loop/db";
import { prisma } from "@loop/db";

const ownerListInclude = {
  category: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  pickupOptions: true,
};

export const productRepository = {
  findAllForAdmin() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        owner: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { id: "desc" },
    });
  },

  findActivePublic(filters: { q?: string; category?: string }) {
    return prisma.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
        ...(filters.category ? { category: { slug: filters.category } } : {}),
      },
      include: {
        category: { select: { name: true, slug: true } },
        owner: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { id: "desc" },
    });
  },

  create(data: {
    title: string;
    description: string;
    categoryId: number;
    pricePerDay: number;
    location: string;
    lat: number | null;
    lng: number | null;
    ownerId: number;
    createdById: number;
  }) {
    return prisma.product.create({ data });
  },

  findById(id: number) {
    return prisma.product.findFirst({ where: { id, deletedAt: null } });
  },

  update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      categoryId: number;
      pricePerDay: number;
      location: string;
      lat: number | null;
      lng: number | null;
    }> & { updatedById: number },
  ) {
    return prisma.product.update({ where: { id }, data });
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

  addPickupOption(productId: number, label: string) {
    return prisma.pickupOption.create({ data: { productId, label } });
  },

  findPickupOptionById(id: number) {
    return prisma.pickupOption.findUnique({ where: { id } });
  },

  removePickupOption(id: number) {
    return prisma.pickupOption.delete({ where: { id } });
  },
};
