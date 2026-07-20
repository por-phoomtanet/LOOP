import { prisma } from "@loop/db";

const auditInclude = {
  createdBy: { select: { name: true } },
  updatedBy: { select: { name: true } },
} as const;

export const categoryRepository = {
  findAll(status: "active" | "all") {
    return prisma.category.findMany({
      where: status === "active" ? { isActive: true, deletedAt: null } : { deletedAt: null },
      include: { ...auditInclude, _count: { select: { products: true } } },
      orderBy: { id: "asc" },
    });
  },

  findById(id: number) {
    return prisma.category.findFirst({ where: { id, deletedAt: null } });
  },

  findBySlug(slug: string) {
    return prisma.category.findFirst({ where: { slug, deletedAt: null } });
  },

  create(data: { name: string; slug: string; createdById: number }) {
    return prisma.category.create({ data, include: auditInclude });
  },

  update(
    id: number,
    data: { name?: string; slug?: string; isActive?: boolean; updatedById: number },
  ) {
    return prisma.category.update({ where: { id }, data, include: auditInclude });
  },

  setActive(id: number, isActive: boolean, updatedById: number) {
    return prisma.category.update({ where: { id }, data: { isActive, updatedById } });
  },

  softDelete(id: number) {
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  countProducts(id: number) {
    return prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  },
};
