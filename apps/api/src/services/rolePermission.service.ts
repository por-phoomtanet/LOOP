import { roleRepository } from "../repositories/role.repository";
import { rolePermissionRepository } from "../repositories/rolePermission.repository";
import { NotFoundError } from "../utils/errors";

export function getPermissionsForRole(roleName: string) {
  return rolePermissionRepository.findByRoleName(roleName);
}

export async function updatePermission(
  roleName: string,
  menuKey: string,
  data: { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean },
) {
  const role = await roleRepository.findByName(roleName);
  if (!role) throw new NotFoundError("ไม่พบ role นี้");

  return rolePermissionRepository.upsertByRoleId(role.id, menuKey, data);
}
