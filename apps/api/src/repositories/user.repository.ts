import { prisma } from "@loop/db";
import type { AccountType } from "@loop/db";

const flatten = <T extends { role: { name: string } }>(user: T) => ({
  ...user,
  role: user.role.name,
});

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  },

  findById(id: number) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  },

  async create(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    accountType: AccountType;
  }) {
    const userRole = await prisma.role.findUnique({ where: { name: "user" } });
    if (!userRole) throw new Error("Missing seed: role 'user' not found");

    const user = await prisma.user.create({
      data: { ...data, roleId: userRole.id },
      include: { role: true },
    });
    return flatten(user);
  },

  setOtp(id: number, data: { otpCodeHash: string; otpExpiresAt: Date; otpMethod: string }) {
    return prisma.user.update({ where: { id }, data });
  },

  verifyOtp(id: number) {
    return prisma.user.update({
      where: { id },
      data: {
        otpCodeHash: null,
        otpExpiresAt: null,
        otpVerifiedAt: new Date(),
        verificationStatus: "APPROVED",
      },
    });
  },

  setIdCardImage(id: number, idCardImageUrl: string) {
    return prisma.user.update({ where: { id }, data: { idCardImageUrl } });
  },

  setFaceVerified(id: number) {
    return prisma.user.update({ where: { id }, data: { faceVerified: true } });
  },

  async findAll(pagination: { page: number; pageSize: number }) {
    const where = { deletedAt: null };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { rows: users.map(flatten), total };
  },

  setVerificationStatus(id: number, status: "APPROVED" | "REJECTED") {
    return prisma.user.update({ where: { id }, data: { verificationStatus: status } });
  },

  countAll() {
    return prisma.user.count({ where: { deletedAt: null } });
  },

  countPending() {
    return prisma.user.count({ where: { deletedAt: null, verificationStatus: "PENDING" } });
  },
};
