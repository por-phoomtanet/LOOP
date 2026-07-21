import { roleRepository } from "../repositories/role.repository";
import { ConflictError, NotFoundError } from "../utils/errors";

export async function listRoles() {
  const roles = await roleRepository.findAll();
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    createdAt: r.createdAt,
    userCount: r._count.users,
  }));
}

export async function createRole(input: { name: string; label: string }) {
  const existing = await roleRepository.findByName(input.name);
  if (existing) throw new ConflictError("ชื่อ role นี้มีอยู่แล้ว");

  return roleRepository.create(input);
}

export async function updateRole(id: number, input: { name?: string; label?: string }) {
  const role = await roleRepository.findById(id);
  if (!role) throw new NotFoundError("ไม่พบ role นี้");

  if (input.name && input.name !== role.name) {
    const existing = await roleRepository.findByName(input.name);
    if (existing) throw new ConflictError("ชื่อ role นี้มีอยู่แล้ว");
  }

  return roleRepository.update(id, input);
}

export async function deleteRole(id: number) {
  const role = await roleRepository.findById(id);
  if (!role) throw new NotFoundError("ไม่พบ role นี้");

  const userCount = await roleRepository.countUsers(id);
  if (userCount > 0) {
    throw new ConflictError(`ลบไม่ได้ — มีผู้ใช้ ${userCount} คนผูกกับ role นี้อยู่`);
  }

  await roleRepository.delete(id);
}
