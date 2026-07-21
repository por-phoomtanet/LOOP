import { prisma } from "@loop/db";

export const roleRepository = {
  findAll() {
    return prisma.role.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { users: true } } },
    });
  },

  findById(id: number) {
    return prisma.role.findUnique({ where: { id } });
  },

  findByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  },

  countUsers(id: number) {
    return prisma.user.count({ where: { roleId: id } });
  },

  create(data: { name: string; label: string }) {
    return prisma.role.create({ data });
  },

  update(id: number, data: { name?: string; label?: string }) {
    return prisma.role.update({ where: { id }, data });
  },

  delete(id: number) {
    return prisma.role.delete({ where: { id } });
  },
};
