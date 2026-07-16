import { prisma } from "@loop/db";

export const rolePermissionRepository = {
  findByRoleName(roleName: string) {
    return prisma.rolePermission.findMany({
      where: { role: { name: roleName } },
      select: {
        menuKey: true,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
    });
  },
};
