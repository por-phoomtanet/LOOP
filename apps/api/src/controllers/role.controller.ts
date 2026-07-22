import * as roleService from "../services/role.service";

type CreateInput = Parameters<typeof roleService.createRole>[0];
type UpdateInput = Parameters<typeof roleService.updateRole>[1];

export async function list() {
  const result = await roleService.listRoles();
  return { data: result, message: "ok" };
}

export async function create(body: unknown) {
  const result = await roleService.createRole(body as CreateInput);
  return { data: result, message: "ok" };
}

export async function update(id: number, body: unknown) {
  const result = await roleService.updateRole(id, body as UpdateInput);
  return { data: result, message: "ok" };
}

export async function remove(id: number) {
  await roleService.deleteRole(id);
  return { data: null, message: "ok" };
}
