import { prisma } from "@loop/db";

export const signupOtpRepository = {
  upsert(email: string, data: { codeHash: string; expiresAt: Date }) {
    return prisma.signupOtp.upsert({
      where: { email },
      create: { email, ...data },
      update: { ...data, verifiedAt: null },
    });
  },

  findByEmail(email: string) {
    return prisma.signupOtp.findUnique({ where: { email } });
  },

  markVerified(email: string) {
    return prisma.signupOtp.update({ where: { email }, data: { verifiedAt: new Date() } });
  },

  deleteByEmail(email: string) {
    return prisma.signupOtp.delete({ where: { email } }).catch(() => null);
  },
};
