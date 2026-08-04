import { prisma } from "@loop/db";
import type { RentalStatus } from "@loop/db";

export const rentalRepository = {
  create(data: {
    productId: number;
    renterId: number;
    ownerId: number;
    startDate: Date;
    endDate: Date;
    nights: number;
    pricePerDaySnap: number;
    totalAmount: number;
  }) {
    return prisma.rental.create({ data });
  },

  findById(id: number) {
    return prisma.rental.findUnique({
      where: { id },
      include: {
        product: { select: { title: true } },
        owner: { select: { name: true, legalName: true, promptPayQrUrl: true } },
      },
    });
  },

  setStatus(id: number, status: RentalStatus) {
    return prisma.rental.update({ where: { id }, data: { status } });
  },
};
