import { rolePermissionRepository } from "../repositories/rolePermission.repository";

export function getPermissionsForRole(roleName: string) {
  return rolePermissionRepository.findByRoleName(roleName);
}
