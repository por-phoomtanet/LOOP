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

  // เฉพาะเมนูที่มีหน้า admin จริงตอนนี้ (Phase 4) — payments/settings ยังไม่ได้สร้าง (รอ Rental/Settings model)
  const adminMenus = ["dashboard", "users", "roles", "categories", "products"];

  // ลบ permission ของเมนูที่เคย seed ไว้ก่อนหน้าแต่ตอนนี้ไม่มีหน้าจริงแล้ว
  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id, menuKey: { notIn: adminMenus } },
  });

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
    { name: "กล้อง", slug: "cameras" },
    { name: "อิเล็กทรอนิกส์", slug: "electronics" },
    { name: "แฟชั่น", slug: "fashion" },
    { name: "กิจกรรมกลางแจ้ง", slug: "outdoor" },
    { name: "เครื่องมือ & บ้าน", slug: "tools" },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  // ---- สินค้าตัวอย่าง (ACTIVE) สำหรับแสดงหน้าแรก ----
  const sellerPasswordHash = await bcrypt.hash("Seller123!", 10);
  const seller = await prisma.user.upsert({
    where: { email: "seller@renty.dev" },
    update: { passwordHash: sellerPasswordHash, roleId: userRole.id },
    create: {
      name: "renty Demo Shop",
      email: "seller@renty.dev",
      passwordHash: sellerPasswordHash,
      phone: "0810000000",
      accountType: "SHOP",
      roleId: userRole.id,
      verificationStatus: "APPROVED",
    },
  });

  const U = (id: string) =>
    `https://images.unsplash.com/photo-${id}?w=600&h=600&fit=crop&crop=entropy&q=80&auto=format`;

  const sampleProducts = [
    {
      title: "Sony A7 IV + เลนส์ 24-70mm",
      slug: "cameras",
      price: 1020,
      location: "กรุงเทพฯ",
      rating: 5.0,
      reviews: 41,
      img: "1502920917128-1aa500764cbd",
    },
    {
      title: "DJI Mini 4 Pro โดรน",
      slug: "cameras",
      price: 840,
      location: "เชียงใหม่",
      rating: 4.9,
      reviews: 33,
      img: "1473968512647-3e447244af8f",
    },
    {
      title: "GoPro Hero 12 + อุปกรณ์ยึด",
      slug: "cameras",
      price: 530,
      location: "ภูเก็ต",
      rating: 4.9,
      reviews: 44,
      img: "1526170375885-4d8ecf77b99f",
    },
    {
      title: 'MacBook Pro 16" M3',
      slug: "electronics",
      price: 1230,
      location: "กรุงเทพฯ",
      rating: 4.8,
      reviews: 19,
      img: "1517336714731-489689fd1ca8",
    },
    {
      title: "PlayStation 5 + 2 จอย",
      slug: "electronics",
      price: 420,
      location: "กรุงเทพฯ",
      rating: 4.9,
      reviews: 58,
      img: "1606813907291-d86efa9b94db",
    },
    {
      title: "โปรเจกเตอร์พกพา 4K",
      slug: "electronics",
      price: 490,
      location: "เชียงใหม่",
      rating: 4.8,
      reviews: 31,
      img: "1527443224154-c4a3942d3acf",
    },
    {
      title: "ชุดราตรีดีไซเนอร์",
      slug: "fashion",
      price: 630,
      location: "กรุงเทพฯ",
      rating: 5.0,
      reviews: 27,
      img: "1595777457583-95e059d581b8",
    },
    {
      title: "กระเป๋าโท้ทแบรนด์เนม",
      slug: "fashion",
      price: 770,
      location: "กรุงเทพฯ",
      rating: 5.0,
      reviews: 35,
      img: "1584917865442-de89df76afd3",
    },
    {
      title: "เต็นท์โดม 4 คน",
      slug: "outdoor",
      price: 420,
      location: "ปาย",
      rating: 4.9,
      reviews: 52,
      img: "1504280390367-361c6d9f38f4",
    },
    {
      title: "เรือคายัคเป่าลม 2 ที่นั่ง",
      slug: "outdoor",
      price: 700,
      location: "กระบี่",
      rating: 4.9,
      reviews: 18,
      img: "1544551763-46a013bb70d5",
    },
    {
      title: "ชุดสว่านไร้สาย Bosch",
      slug: "tools",
      price: 320,
      location: "นนทบุรี",
      rating: 4.7,
      reviews: 38,
      img: "1504148455328-c376907d081c",
    },
    {
      title: "Osprey เป้เดินป่า 65L",
      slug: "outdoor",
      price: 280,
      location: "เชียงราย",
      rating: 4.8,
      reviews: 22,
      img: "1553062407-98eeb64c6a62",
    },
  ];

  // ลบสินค้าตัวอย่างเดิมของ demo seller ก่อน (idempotent — รูป/จุดรับ cascade ตามไปด้วย)
  await prisma.product.deleteMany({ where: { ownerId: seller.id } });

  for (const sp of sampleProducts) {
    const category = await prisma.category.findUnique({ where: { slug: sp.slug } });
    if (!category) continue;
    await prisma.product.create({
      data: {
        title: sp.title,
        description: `${sp.title} พร้อมให้เช่า สภาพดี ดูแลอย่างดี ราคาต่อวันรวมประกันความเสียหาย`,
        categoryId: category.id,
        ownerId: seller.id,
        createdById: seller.id,
        pricePerDay: sp.price,
        location: sp.location,
        status: "ACTIVE",
        ratingAvg: sp.rating,
        reviewCount: sp.reviews,
        images: { create: [{ url: U(sp.img), sortOrder: 0 }] },
        pickupOptions: { create: [{ label: "BTS อโศก" }, { label: "จัดส่งผ่าน Grab" }] },
      },
    });
  }

  console.log(
    "Seed เสร็จสิ้น — roles:",
    [adminRole.name, userRole.name],
    "| สินค้าตัวอย่าง:",
    sampleProducts.length,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
