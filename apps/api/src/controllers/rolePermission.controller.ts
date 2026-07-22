import * as rolePermissionService from "../services/rolePermission.service";

type PermissionInput = Parameters<typeof rolePermissionService.updatePermission>[2];

export async function getByRole(role: string) {
  const result = await rolePermissionService.getPermissionsForRole(role);
  return { data: result, message: "ok" };
}

export async function update(role: string, menuKey: string, body: unknown) {
  const result = await rolePermissionService.updatePermission(
    role,
    menuKey,
    body as PermissionInput,
  );
  return { data: result, message: "ok" };
}
