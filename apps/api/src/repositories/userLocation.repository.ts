import { prisma } from "@loop/db";

export const userLocationRepository = {
  findByUser(userId: number) {
    return prisma.userLocation.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });
  },

  findById(id: number) {
    return prisma.userLocation.findUnique({ where: { id } });
  },

  create(data: { userId: number; label: string; address: string; lat: number; lng: number }) {
    return prisma.userLocation.create({ data });
  },

  remove(id: number) {
    return prisma.userLocation.delete({ where: { id } });
  },
};
