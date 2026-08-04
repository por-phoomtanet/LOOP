import { prisma } from "@loop/db";

export const paymentSlipRepository = {
  findByReference(reference: string) {
    return prisma.paymentSlip.findUnique({ where: { reference } });
  },

  create(data: {
    rentalId: number;
    imageUrl: string;
    amount: number;
    transferredAt: Date;
    reference: string;
    senderName: string | null;
    receiverName: string | null;
    bank: string | null;
    verified: boolean;
    rejectedReason: string | null;
    rawAnalysis: string;
  }) {
    return prisma.paymentSlip.create({ data });
  },
};
