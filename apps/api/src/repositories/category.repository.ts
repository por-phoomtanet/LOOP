import { prisma } from "@loop/db";

export const categoryRepository = {
  findActive() {
    return prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true },
    });
  },

  findById(id: number) {
    return prisma.category.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
  },
};
