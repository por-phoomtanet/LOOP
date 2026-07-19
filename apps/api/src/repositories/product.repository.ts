import { prisma } from "@loop/db";

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" } },
  pickupOptions: true,
} as const;

export const productRepository = {
  findById(id: number) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
  },

  create(data: {
    title: string;
    description: string;
    categoryId: number;
    ownerId: number;
    pricePerDay: number;
    location: string;
    pickupOptions: string[];
  }) {
    const { pickupOptions, ownerId, ...rest } = data;
    return prisma.product.create({
      data: {
        ...rest,
        ownerId,
        createdById: ownerId,
        updatedById: ownerId,
        pickupOptions: { create: pickupOptions.map((label) => ({ label })) },
      },
      include: productInclude,
    });
  },

  async addImages(productId: number, urls: string[], startOrder: number) {
    await prisma.productImage.createMany({
      data: urls.map((url, i) => ({ productId, url, sortOrder: startOrder + i })),
    });
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });
  },

  countImages(productId: number) {
    return prisma.productImage.count({ where: { productId } });
  },
};
