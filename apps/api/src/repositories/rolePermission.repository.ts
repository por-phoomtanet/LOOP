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

  upsertByRoleId(
    roleId: number,
    menuKey: string,
    data: { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean },
  ) {
    return prisma.rolePermission.upsert({
      where: { roleId_menuKey: { roleId, menuKey } },
      update: data,
      create: { roleId, menuKey, ...data },
    });
  },
};
