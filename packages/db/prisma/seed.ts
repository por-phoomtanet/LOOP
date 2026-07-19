import bcrypt from "bcrypt";
import { prisma } from "../src/index";

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { label: "ผู้ดูแลระบบ" },
    create: { name: "admin", label: "ผู้ดูแลระบบ" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: { label: "ผู้ใช้ทั่วไป" },
    create: { name: "user", label: "ผู้ใช้ทั่วไป" },
  });

  const adminMenus = ["dashboard", "categories", "users", "products", "payments", "settings"];
  for (const menuKey of adminMenus) {
    await prisma.rolePermission.upsert({
      where: { roleId_menuKey: { roleId: adminRole.id, menuKey } },
      update: { canView: true, canCreate: true, canUpdate: true, canDelete: true },
      create: {
        roleId: adminRole.id,
        menuKey,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
    });
  }

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@loop.dev" },
    update: { passwordHash: adminPasswordHash, roleId: adminRole.id },
    create: {
      name: "LOOP Admin",
      email: "admin@loop.dev",
      passwordHash: adminPasswordHash,
      phone: "0800000000",
      accountType: "INDIVIDUAL",
      roleId: adminRole.id,
      verificationStatus: "APPROVED",
    },
  });

  const categories = [
    { name: "อิเล็กทรอนิกส์", slug: "electronics" },
    { name: "กล้อง", slug: "cameras" },
    { name: "แฟชั่น", slug: "fashion" },
    { name: "กลางแจ้ง & แคมป์", slug: "outdoor" },
    { name: "เครื่องมือ & บ้าน", slug: "tools" },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, isActive: true },
      create: { ...category, isActive: true },
    });
  }

  console.log("Seed เสร็จสิ้น — roles:", [adminRole.name, userRole.name]);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
