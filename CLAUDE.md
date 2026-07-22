# renty — Peer-to-Peer Rental Marketplace

แพลตฟอร์มให้เช่าสินค้าระหว่างบุคคล (P2P rental marketplace) แบบ C2C — ผู้ใช้นำของที่มีอยู่มาปล่อยเช่าเป็นรายวันแทนการขายขาด ทุกการเช่ามีเงินประกันความเสียหาย (refundable deposit) และผ่านการยืนยันตัวตน (KYC) รองรับ 2 ภาษา (ไทย/อังกฤษ) สกุลเงินบาท (฿) เอกสารนี้อ้างอิง scope จาก [`requirement.md`](./requirement.md) ซึ่งสรุปมาจาก prototype ใน `Prototype เว็บ C2C/`

> **หมายเหตุ:** ชื่อโปรเจกต์เดิม "LOOP" ถูกเปลี่ยนเป็น "renty" (Phase 6 — ดูรายละเอียด CI ด้านล่าง) — ชื่อ npm package (`@loop/*`) และชื่อโฟลเดอร์ `LOOP/` ยังคงเดิมโดยตั้งใจ เพราะเป็นรายละเอียด internal ไม่ใช่สิ่งที่ผู้ใช้ปลายทางเห็น

---

## ขอบเขตระบบ (Scope)

### ✅ ทำได้ใน Phase นี้
| ระบบ | Feature |
|---|---|
| Marketplace | Home (แนะนำ/หมวดหมู่/รีวิว), Shop (ค้นหา+filter หมวดหมู่), รายละเอียดสินค้า (gallery, สินค้าคล้ายกัน) |
| Listing (ประกาศให้เช่า) | สร้าง/แก้ไข/พัก/ลบประกาศ, อัปโหลดรูป, ตั้งราคา/วัน, จุดรับสินค้า, สถานะ active/under_review/paused |
| Rental (เช่า/checkout) | เลือกวัน, จุดรับ, คำนวณราคา (ค่าเช่า+ค่าธรรมเนียม+เงินประกัน), ยกเลิกได้ใน 10 นาที, pipeline pending→approved→shipped→completed |
| My Listings / My Rentals | เจ้าของ: อนุมัติ/ปฏิเสธ/ยืนยันจัดส่ง-รับคืน (แนบรูป) · ผู้เช่า: ประวัติการเช่า, คืนสินค้า (แนบรูป) |
| Favorites | บันทึกสินค้าที่สนใจ, badge นับจำนวน |
| Signup + KYC | สมัครสมาชิก, OTP (email/phone) → ผ่านแล้ว **ใช้งานได้ทันที** ไม่ต้องรอแอดมิน, อัปโหลดบัตรประชาชน, ยืนยันใบหน้า (เริ่มจาก mock ก่อน ต่อ provider จริงภายหลัง) |
| Admin | Dashboard, Category CRUD, Users (ดูรายชื่อ/ระงับ-ปลดระงับ), Products (read-only), Payments, Settings |
| Auth | Login/JWT, Role (admin/user), Role Permission ใช้เฉพาะฝั่ง Admin panel |

### 🔜 Phase ถัดไป (ทำทีหลัง)
| ระบบ | เหตุผลที่เลื่อน |
|---|---|
| KYC จริง (OCR บัตรประชาชน + face liveness) | ต้องเลือก/เซ็นสัญญากับ provider ภายนอก (เช่น NDID, Sumsub) — Phase แรก mock ไว้ก่อนตาม prototype |
| Payment Gateway จริง | ต้องผูก PSP (Omise/2C2P) + reconciliation — Phase แรกบันทึกสถานะ payment เอง ยังไม่ตัดเงินจริง |
| แผนที่จริง (pickup location) | prototype ใช้ภาพ mock, ต้องเลือก Maps provider (Google Maps/Longdo) |
| ระบบรีวิวเต็มรูปแบบ + คะแนนสะสม | ต่อยอดหลังมี rental ที่ completed จริงเพียงพอ |
| แชท/การแจ้งเตือนแบบ real-time ระหว่างผู้เช่า-เจ้าของ | ปัจจุบันใช้เบอร์โทร/LINE ID เป็นช่องทางติดต่อ ตาม prototype |

---

## Tech Stack

- **Docker** — containerize ทุก service
- **PostgreSQL** — relational database หลัก
- **Prisma ORM** — schema, migration, type-safe query
- **Next.js 15** (App Router) — เว็บฝั่ง Marketplace + Admin dashboard
- **Tailwind CSS** — utility-first styling
- **Ant Design** — UI component library เฉพาะฝั่ง Admin panel (Table, Form, Modal)
- **Axios** — HTTP client (single instance, interceptors)
- **Zustand** — lightweight global state management
- **Node.js + Express** — REST API
- **JWT + bcrypt** — Authentication / Authorization
- **Multer** — อัปโหลดรูปภาพ (product photos, ID card, shipment/return photos)
- **ExcelJS** — Export รายงาน Admin Payments เป็น Excel (.xlsx) และ CSV
- **Jest + Supertest** — Unit & Integration test (API)
- **Git Monorepo** — จัดการ codebase

---

## Monorepo Structure

```
LOOP/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/         # HTTP routing only — chains middleware + controller
│   │   │   ├── controllers/    # req/res handling — calls service, returns response
│   │   │   ├── services/       # business logic — calls repository, ไม่รู้จัก req/res
│   │   │   ├── repositories/   # data access — Prisma queries only, ไม่มี business logic
│   │   │   ├── middleware/     # authenticate, requireRole, validate, errorHandler
│   │   │   ├── types/          # TypeScript declarations (express.d.ts)
│   │   │   └── utils/          # pure helpers (errors.ts, pricing.ts — คำนวณค่าเช่า/ค่าธรรมเนียม/เงินประกัน)
│   │   ├── tests/
│   │   └── package.json
│   └── web/
│       ├── app/                        # Next.js App Router — routing ONLY
│       │   ├── (marketplace)/
│       │   │   ├── page.tsx                    # Home
│       │   │   ├── shop/page.tsx
│       │   │   ├── products/[id]/page.tsx      # รายละเอียดสินค้า (modal อาจ intercept route)
│       │   │   ├── checkout/[productId]/page.tsx
│       │   │   ├── list-item/page.tsx
│       │   │   ├── signup/page.tsx
│       │   │   ├── my-listings/page.tsx
│       │   │   └── my-rentals/page.tsx
│       │   ├── (auth)/
│       │   │   └── login/page.tsx
│       │   ├── (admin)/
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── categories/page.tsx
│       │   │   ├── users/page.tsx
│       │   │   ├── products/page.tsx
│       │   │   ├── payments/page.tsx
│       │   │   └── settings/page.tsx
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── modules/                    # Feature modules — domain logic per feature
│       │   ├── auth/
│       │   │   ├── components/         # LoginForm, SignupForm, OtpStep, KycStep
│       │   │   ├── hooks/              # useLogin, useSignup
│       │   │   ├── services/           # authApi.ts
│       │   │   └── types.ts
│       │   ├── products/               # marketplace + listing (create/edit/pause) ใช้ module เดียวกัน
│       │   │   ├── components/         # ProductCard, ProductGallery, ProductForm, PickupOptionsEditor
│       │   │   ├── hooks/              # useProducts, useProduct, useMyListings
│       │   │   ├── services/           # productsApi.ts
│       │   │   └── types.ts
│       │   ├── rentals/                # checkout + my-rentals + order management (owner)
│       │   │   ├── components/         # CheckoutForm, PriceSummary, RentalStatusBadge, ConditionPhotoModal
│       │   │   ├── hooks/              # useCheckout, useMyRentals, useOwnerOrders
│       │   │   ├── services/           # rentalsApi.ts
│       │   │   └── types.ts
│       │   ├── admin/
│       │   │   ├── components/         # DashboardStats, CategoryTable, UserTable, PaymentsTable, SettingsForm
│       │   │   ├── hooks/
│       │   │   ├── services/           # adminApi.ts
│       │   │   └── types.ts
│       │   └── users/
│       │       ├── components/
│       │       ├── hooks/
│       │       ├── services/           # usersApi.ts
│       │       └── types.ts
│       ├── shared/                     # Cross-feature reusable code
│       │   ├── components/             # PageHeader, DataTable, ConfirmModal, ImageUploader
│       │   ├── layouts/                # DashboardLayout (Admin Sidebar + Header), MarketplaceLayout (Header + Footer)
│       │   └── guards/                 # AuthGuard, PermissionGuard
│       ├── services/                   # Global HTTP layer
│       │   └── api.ts                  # Axios instance — baseURL, token interceptor
│       ├── store/                      # Global state (Zustand)
│       │   ├── authStore.ts            # user, token, setAuth, clearAuth
│       │   ├── permissionStore.ts      # permissions, canView/canCreate/canUpdate/canDelete (เฉพาะ Admin)
│       │   ├── rolesStore.ts           # roles list + getLabelByName, clear ตอน logout
│       │   ├── favoritesStore.ts       # favorite product ids, badge count
│       │   └── masterStore.ts          # categories, pickup options (active-only), clear ตอน logout
│       ├── types/                      # Global TypeScript types
│       │   └── index.ts                # ApiResponse<T>, PaginatedResponse<T>, User
│       ├── constants/                  # App-wide constants
│       │   └── index.ts                # ROUTES, API_BASE_URL, CANCEL_WINDOW_MINUTES=10, DEPOSIT_MULTIPLIER=2
│       └── lib/                        # Pure utilities
│           └── utils.ts
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── docker-compose.yml
└── package.json
```

---

## User Roles

Role คือแค่ชื่อ — สิทธิ์จริง (canView/canCreate/canUpdate/canDelete per menu) กำหนดใน `RolePermission` ใน DB ผ่านหน้า `/admin/settings/roles` (ใช้เฉพาะ gating เมนูฝั่ง **Admin panel** เท่านั้น — หน้า marketplace ฝั่งผู้ใช้ทั่วไปไม่ใช้ระบบสิทธิ์นี้ ใช้แค่ auth ธรรมดา)

| Role | คำอธิบาย |
|---|---|
| `admin` | Role เริ่มต้น — เข้าถึงทุกเมนูใน Admin panel (Dashboard, Categories, Users, Products, Payments, Settings) |
| `user` | ผู้ใช้ทั่วไป — เป็นได้ทั้งผู้เช่าและเจ้าของสินค้าในบัญชีเดียวกัน (ไม่ต้องใช้ RolePermission เพราะไม่ใช่ back-office) |

หมายเหตุ: `accountType` (individual/shop) เป็น **attribute ของ User** ไม่ใช่ role/สิทธิ์ — ใช้แสดงผลต่างกัน (เช่น badge "ร้านค้า") ไม่ได้ gate ฟีเจอร์ตาม prototype

---

## Data Models (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Role เป็น table ไม่ใช่ enum — เพื่อให้ admin สร้าง role ใหม่ได้
model Role {
  id          Int              @id @default(autoincrement())
  name        String           @unique   // admin, user
  label       String                     // ผู้ดูแลระบบ, ผู้ใช้ทั่วไป
  createdAt   DateTime         @default(now())
  users       User[]
  permissions RolePermission[]
}

model RolePermission {
  id        Int      @id @default(autoincrement())
  roleId    Int
  role      Role     @relation(fields: [roleId], references: [id])
  menuKey   String   // "dashboard" | "categories" | "users" | "products" | "payments" | "settings"
  canView   Boolean  @default(true)
  canCreate Boolean  @default(false)
  canUpdate Boolean  @default(false)
  canDelete Boolean  @default(false)
  updatedAt DateTime @updatedAt

  @@unique([roleId, menuKey])
}

enum AccountType {
  INDIVIDUAL
  SHOP
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id                 Int                 @id @default(autoincrement())
  name               String
  email              String              @unique
  passwordHash       String
  phone              String
  lineId             String?
  accountType        AccountType         @default(INDIVIDUAL)
  roleId             Int
  role               Role                @relation(fields: [roleId], references: [id])
  verificationStatus VerificationStatus  @default(PENDING)  // ตาม Admin > Users (approve/reject)
  idCardImageUrl     String?                                // อัปโหลดตอน signup KYC
  faceVerified       Boolean             @default(false)
  isActive           Boolean             @default(true)
  createdAt          DateTime            @default(now())
  deletedAt          DateTime?

  products           Product[]           @relation("ProductOwner")
  rentals            Rental[]            @relation("Renter")
  favorites          Favorite[]
  reviews            Review[]
}

model Category {
  id          Int       @id @default(autoincrement())
  name        String
  slug        String    @unique
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  createdById Int?
  updatedById Int?
  createdBy   User?     @relation("CategoryCreatedBy", fields: [createdById], references: [id])
  updatedBy   User?     @relation("CategoryUpdatedBy", fields: [updatedById], references: [id])
  products    Product[]
}

enum ProductStatus {
  UNDER_REVIEW  // เพิ่งลงประกาศ รอแอดมิน/ระบบตรวจสอบ
  ACTIVE
  PAUSED
}

model Product {
  id            Int             @id @default(autoincrement())
  title         String
  description   String
  categoryId    Int
  category      Category        @relation(fields: [categoryId], references: [id])
  ownerId       Int
  owner         User            @relation("ProductOwner", fields: [ownerId], references: [id])
  pricePerDay   Decimal
  location      String
  status        ProductStatus   @default(UNDER_REVIEW)
  ratingAvg     Float           @default(0)   // cache — คำนวณจาก Review ตอน create/update review
  reviewCount   Int             @default(0)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?
  createdById   Int?
  updatedById   Int?
  createdBy     User?           @relation("ProductCreatedBy", fields: [createdById], references: [id])
  updatedBy     User?           @relation("ProductUpdatedBy", fields: [updatedById], references: [id])

  images        ProductImage[]
  pickupOptions PickupOption[]
  rentals       Rental[]
  favorites     Favorite[]
  reviews       Review[]
}

model ProductImage {
  id        Int      @id @default(autoincrement())
  productId Int
  product   Product  @relation(fields: [productId], references: [id])
  url       String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model PickupOption {
  id        Int      @id @default(autoincrement())
  productId Int
  product   Product  @relation(fields: [productId], references: [id])
  label     String
  createdAt DateTime @default(now())
}

enum RentalStatus {
  PENDING      // รอเจ้าของอนุมัติ — ยกเลิกฟรีได้ภายใน CANCEL_WINDOW_MINUTES
  APPROVED     // เจ้าของอนุมัติแล้ว รอจัดส่ง
  DECLINED
  SHIPPED      // เจ้าของยืนยันจัดส่งแล้ว (แนบ shipmentPhotoUrl)
  RETURNING    // ผู้เช่าส่งคืนแล้ว รอเจ้าของยืนยันรับ (แนบ returnPhotoUrl)
  COMPLETED
  CANCELLED
}

model Rental {
  id               Int          @id @default(autoincrement())
  productId        Int
  product          Product      @relation(fields: [productId], references: [id])
  renterId         Int
  renter           User         @relation("Renter", fields: [renterId], references: [id])
  startDate        DateTime
  endDate          DateTime
  nights           Int
  pricePerDaySnap  Decimal      // snapshot ราคา ณ ตอนจอง กันราคาสินค้าเปลี่ยนภายหลัง
  serviceFeePct    Float        // snapshot จาก Settings.serviceFeePct ณ ตอนจอง
  serviceFee       Decimal
  deposit          Decimal      // = pricePerDaySnap * 2
  totalAmount      Decimal
  contactPhone     String
  contactLine      String?
  note             String?
  pickupOptionId   Int?
  status           RentalStatus @default(PENDING)
  requestedAt      DateTime     @default(now())  // ใช้คำนวณ cancel window 10 นาที
  shipmentPhotoUrl String?
  returnPhotoUrl   String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  review           Review?
}

model Favorite {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  productId Int
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}

model Review {
  id        Int      @id @default(autoincrement())
  rentalId  Int      @unique   // 1 rental รีวิวได้ครั้งเดียว หลังสถานะ COMPLETED เท่านั้น
  rental    Rental   @relation(fields: [rentalId], references: [id])
  productId Int
  product   Product  @relation(fields: [productId], references: [id])
  renterId  Int
  renter    User     @relation(fields: [renterId], references: [id])
  rating    Int       // 1-5
  comment   String?
  createdAt DateTime @default(now())
}

// Singleton row (id เดิมคงที่ = 1) — Admin > Settings
model Settings {
  id                     Int      @id @default(1)
  platformName           String   @default("LOOP")
  currency               String   @default("THB (฿)")
  serviceFeePct          Float    @default(10)
  supportEmail           String
  requireIdVerification  Boolean  @default(true)
  maintenanceMode        Boolean  @default(false)
  updatedAt              DateTime @updatedAt
}
```

---

## API Endpoints

| Method | Path | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/register` | * | สมัครสมาชิก step กรอกฟอร์ม (สร้าง user status=PENDING) |
| POST | `/api/auth/register/otp/request` | * | ขอ OTP (email/phone) |
| POST | `/api/auth/register/otp/verify` | * | ยืนยัน OTP → สร้างบัญชีสำเร็จ |
| POST | `/api/auth/login` | * | Login รับ JWT |
| GET | `/api/auth/me` | auth | ดูข้อมูลตัวเอง |
| GET | `/api/health` | * | Health check (status + db + uptime) |
| GET | `/api/categories` | * | รายการหมวดหมู่ (active only) |
| POST/PUT/DELETE | `/api/categories/:id` | admin | CRUD หมวดหมู่ |
| GET | `/api/products` | * | ค้นหา/filter สินค้า (`q`, `category`, `page`) |
| GET | `/api/products/:id` | * | รายละเอียดสินค้า + สินค้าคล้ายกัน |
| POST | `/api/products` | auth | สร้างประกาศให้เช่า (status=UNDER_REVIEW) |
| PUT | `/api/products/:id` | auth (owner) | แก้ไขประกาศ |
| PATCH | `/api/products/:id/status` | auth (owner: pause/resume · admin: approve/reject) | เปลี่ยนสถานะประกาศ |
| DELETE | `/api/products/:id` | auth (owner) | ลบประกาศ (soft delete) |
| POST | `/api/products/:id/images` | auth (owner) | อัปโหลดรูปสินค้า (multer) |
| POST/DELETE | `/api/products/:id/pickup-options` / `/:optionId` | auth (owner) | จัดการจุดรับสินค้า |
| POST/DELETE | `/api/products/:id/favorite` | auth | บันทึก/เอาออกจาก Saved |
| GET | `/api/me/favorites` | auth | รายการสินค้าที่บันทึกไว้ |
| GET | `/api/me/listings` | auth | ประกาศของฉัน (owner) |
| GET | `/api/me/orders` | auth | คำขอเช่าที่เข้ามา (owner) |
| GET | `/api/me/rentals` | auth | ประวัติการเช่าของฉัน (renter) |
| POST | `/api/products/:id/rentals` | auth | สร้างคำขอเช่า (checkout) — คำนวณ price/fee/deposit จาก Settings snapshot |
| PATCH | `/api/rentals/:id/cancel` | auth (renter) | ยกเลิก — อนุญาตเฉพาะภายใน `CANCEL_WINDOW_MINUTES` และ status=PENDING |
| PATCH | `/api/rentals/:id/approve` | auth (owner) | อนุมัติคำขอ |
| PATCH | `/api/rentals/:id/decline` | auth (owner) | ปฏิเสธคำขอ |
| PATCH | `/api/rentals/:id/ship` | auth (owner) | ยืนยันจัดส่ง (ต้องแนบ `shipmentPhotoUrl`) |
| PATCH | `/api/rentals/:id/return` | auth (renter) | ส่งคืนสินค้า (ต้องแนบ `returnPhotoUrl`) |
| PATCH | `/api/rentals/:id/complete` | auth (owner) | ยืนยันรับคืน → status=COMPLETED |
| POST | `/api/rentals/:id/review` | auth (renter) | รีวิวหลัง COMPLETED (ครั้งเดียว/rental) |
| GET | `/api/admin/dashboard` | admin | สรุปสถิติ (สินค้า/ผู้ใช้/คำสั่งเช่า/มูลค่ารวม) |
| GET | `/api/admin/users` | admin | รายการผู้ใช้ทั้งหมด |
| PATCH | `/api/admin/users/:id/status` | admin | approve/reject ผู้ใช้ที่ PENDING |
| GET | `/api/admin/products` | admin | สินค้าทั้งหมดในระบบ (read-only) |
| GET | `/api/admin/payments` | admin | สรุป + ตารางธุรกรรม |
| GET | `/api/admin/payments/export` | admin | Export Excel/CSV |
| GET/PUT | `/api/admin/settings` | admin | ดู/แก้ไขตั้งค่าระบบ (รวม `serviceFeePct` ที่ Checkout ต้องอ่านค่าเดียวกัน) |
| GET | `/api/roles` | admin | ดึง role ทั้งหมด |
| POST/PUT/DELETE | `/api/roles` / `/api/roles/:id` | admin | สร้าง/แก้ไข/ลบ role |
| GET | `/api/role-permissions` | admin | ดึง permission ทั้งหมด |
| GET | `/api/role-permissions/:role` | auth | ดึง permission ของ role นั้น |
| PUT | `/api/role-permissions/:role/:menuKey` | admin | อัปเดต permission |

---

## Dev Standards (บังคับใช้ทุก Phase)

> กฎเหล่านี้ป้องกันบัคที่พบบ่อยที่สุด — ต้องทำก่อนเขียน feature จริง

### 1. Input Validation — Zod (API)
ทุก route ที่รับ body/query ต้อง validate ด้วย Zod ก่อน controller
```ts
const schema = z.object({ title: z.string().min(1), pricePerDay: z.number().positive() })
// throws ZodError → global handler จัดการ
// หมายเหตุ: Zod 3.25+ ใช้ { error: 'Required' } แทน { required_error: 'Required' }
```

### 2. Global Error Handler (Express)
middleware ตัวสุดท้ายใน `apps/api/src/app.ts` — format error response สม่ำเสมอ
```ts
app.use((err, req, res, next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: err.errors })
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
  res.status(500).json({ error: 'Internal server error' })
})
```

### 3. Prisma Transaction สำหรับ operation ที่ต้องทำพร้อมกัน
เช่น เปลี่ยนสถานะ Rental พร้อมสร้างข้อมูลที่เกี่ยวข้อง (เช่น complete → อัปเดต Product.ratingAvg เมื่อมี review) ต้องใช้ `$transaction`
```ts
await prisma.$transaction([
  prisma.rental.update({ where: { id }, data: { status: 'COMPLETED' } }),
  prisma.product.update({ where: { id: productId }, data: { ... } }),
])
```

### 4. Env Validation ตอน Startup
```ts
const required = ['DATABASE_URL', 'JWT_SECRET']
required.forEach(k => { if (!process.env[k]) throw new Error(`Missing env: ${k}`) })
```

### 5. Consistent API Response Format
```ts
res.json({ data: result, message: 'ok' })          // Success
res.status(400).json({ error: 'message' })          // Error
```

### 6. ESLint + Prettier
- `@typescript-eslint/no-explicit-any` — ห้ามใช้ `any`
- `@typescript-eslint/no-unused-vars` — ห้ามมี unused variables
- Prettier format ก่อน commit (ผ่าน lint-staged + Husky)
- ห้ามใช้ `eslint-config-next` เพราะดึง ESLint 10 ซึ่ง conflict กับ v8 — ใช้ `@typescript-eslint` โดยตรงแทน

### 7. Controller-Service-Repository Pattern

| ชั้น | ความรับผิดชอบ | รู้จัก | ไม่รู้จัก |
|---|---|---|---|
| **Route** | HTTP path + middleware chain | middleware, controller | business logic, DB |
| **Controller** | รับ `req` → เรียก service → ส่ง `res` | service | Prisma, business rules |
| **Service** | business logic (เช่น คำนวณราคาเช่า, เช็ค cancel window) | repository | `req`, `res`, HTTP status |
| **Repository** | Prisma query เท่านั้น | PrismaClient | business rules, HTTP |

**กฎข้าม:** Controller ห้าม import Prisma | Service ห้าม import req/res | Repository ห้ามมี if/else business logic

### 8. Feature-Based Frontend Architecture (Web)
```ts
// app/(marketplace)/shop/page.tsx — routing ONLY
import ShopPage from '@/modules/products/components/ShopPage'
export default function Page() { return <ShopPage /> }
```
**กฎข้าม:**
- `app/` ห้ามมี useState / useEffect / fetch
- `modules/[feature]/services/` ห้าม import จาก modules อื่น — ใช้ `services/api.ts`
- ห้ามสร้าง Axios instance มากกว่า 1 ตัว

### 9. Soft Delete
```ts
where: { deletedAt: null }
findFirst({ where: { id, deletedAt: null } })   // ✅ ถูก — findById ต้องใช้ findFirst
findUnique({ where: { id } })                    // ❌ ไม่ filter soft-deleted record
```
Service: deleteById → update({ deletedAt: new Date() }) | API: DELETE ยัง return 200 เหมือนเดิม

### 10. Role Permission (Dynamic RBAC — เฉพาะ Admin panel)
- หลัง login (ถ้า role=admin) → `GET /api/role-permissions/:role` → เก็บใน `permissionStore` (Zustand, persist)
- Admin sidebar: render เฉพาะ menu ที่ `canView: true`
- ปุ่ม action แสดงตาม `canCreate / canUpdate / canDelete`
- ทุกหน้า Admin ใช้ `<PermissionGuard menuKey="...">` — ห้าม hardcode role name
- `permissionStore` ต้อง clear ตอน logout
- หน้า marketplace ฝั่งผู้ใช้ทั่วไป **ไม่ใช้** PermissionGuard — ใช้แค่ `<AuthGuard>` (ต้อง login หรือไม่)

```tsx
function PermissionGuard({ children, menuKey }) {
  const canView = usePermissionStore((s) => s.canView(menuKey))
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <Spin />
  if (!canView) return <Page403 />
  return <>{children}</>
}
```

### 11. Role Table (ไม่ใช่ enum)
- Repository flatten `role: { name: 'admin' }` → `role: 'admin'` ก่อน return เสมอ
- JWT payload ยังคง `role: string` ไม่เปลี่ยน

### 12. isActive/status — Toggle Status (ไม่ใช่ Soft Delete)
- `Category.isActive` ใช้ enable/disable ปกติ (Dev Standard เดิม)
- `Product.status` ใช้ enum 3 ค่า (UNDER_REVIEW/ACTIVE/PAUSED) แทน `isActive` เพราะมีมากกว่า 2 สถานะ — endpoint เดียวกันคือ `PATCH /:id/status` แต่ body รับ `{ status }` แทน `{ isActive }`
- Dropdown ทั่วระบบ (เช่น หมวดหมู่ใน list-item form) ดึงเฉพาะ active items เสมอ

```ts
// ✅ ถูก — filter ทั้ง isActive/status ที่เหมาะกับ entity และ soft delete
where: status === 'active' ? { isActive: true, deletedAt: null } : { deletedAt: null }
```

### 13. Responsive Design (Mobile-first)
- **Marketplace** (Next.js + Tailwind): mobile-first ตั้งแต่ต้น ตาม prototype ที่เป็นเว็บทั่วไป (ไม่ใช่ back-office เดิม)
- **Admin panel** (Ant Design): Sidebar ใช้ `useBreakpoint()` → `!screens.md` ให้แทน `<Sider>` ด้วย `<Drawer>`
- ทุกตาราง Admin ต้องมี `scroll={{ x: 'max-content' }}`
- Form/Modal ใช้ `layout="vertical"` เสมอ | Button group ใช้ `<Space wrap>`

### 14. Page Layout Template — เฉพาะ Admin panel

```tsx
<PageHeader
  title="ชื่อหน้า"
  subtitle="คำอธิบาย"
  extra={canCreate ? <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>เพิ่ม...</Button> : undefined}
/>
```
ปุ่ม action ในตาราง (แก้ไข/ลบ) ต้องใช้ `type="text"` เสมอ — ห้ามใช้ default (มีกรอบ)

**App/useApp pattern**: outer component wrap `<App>`, inner component call `App.useApp()`

**Form per component**: ถ้ามีหลาย mode (เช่น ProductForm สำหรับ individual/shop) ให้แยก component แยกกัน — ห้ามสร้าง `useForm()` แล้วไม่ connect กับ `<Form>`

### 15. Table Standard (บังคับทุกตาราง Admin)

- คอลัมน์ "ลำดับ" เป็นคอลัมน์แรกเสมอ (นับต่อเนื่องข้ามหน้าถ้ามี pagination)
- คอลัมน์ action ต้องมี `title: 'จัดการ'` เสมอ — ห้ามใช้ `title: ''`
- Controlled pagination + `showSizeChanger` + `showTotal`
- filter/sort เปลี่ยน → `setPage(1)` เสมอ
- ตาราง master data (Category) → `pagination={false}` ได้ แต่ยังต้องมีคอลัมน์ลำดับ

### 16. Modal + Form Pattern

```tsx
<Modal
  open={modal.open}
  destroyOnHidden
  afterOpenChange={(open) => {
    if (open) {
      form.resetFields()
      if (modal.editing) form.setFieldsValue({ ...modal.editing })
    }
  }}
  onCancel={() => setModal({ open: false, editing: null })}
>
  <Form form={form} layout="vertical">...</Form>
</Modal>
```
ห้ามใช้ `useEffect` ดูการเปลี่ยน `modal.open` เพื่อ resetFields — ใช้ `afterOpenChange` แทน

### 17. Error Message Handling (API + Frontend)
```ts
// API — Thai user-facing message
throw new ConflictError('อีเมลนี้ถูกใช้แล้ว')
throw new NotFoundError('ไม่พบสินค้านี้')
throw new BadRequestError('ไม่สามารถยกเลิกได้ เกินเวลา 10 นาทีแล้ว')
```
```tsx
// Frontend — extract error จาก API response ก่อน fallback
} catch (err) {
  const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined
  message.error(msg ?? 'เกิดข้อผิดพลาด')
}
```

### 18. Audit Fields (บังคับสำหรับทุก table ที่ผู้ใช้ CRUD)
`Category`, `Product` ต้องมี `createdById/updatedById` ครบ (ดู schema ด้านบน) — `Rental` ไม่ต้องเพราะมี `renterId`/product→`ownerId` ให้ traceability อยู่แล้ว

```ts
const auditInclude = {
  createdBy: { select: { name: true } },
  updatedBy: { select: { name: true } },
} as const
```

**⚠️ Migration กับ `@updatedAt` บน existing table ที่มีข้อมูล:** รัน SQL ด้วย `prisma db execute --file` ก่อน แล้วค่อย `db push` (ดูตัวอย่างใน CLAUDE_TEMPLATE.md)

### 19. Pricing Logic (เฉพาะ LOOP — คำนวณราคาเช่า)
คำนวณราคาต้อง snapshot ค่าที่ใช้ ณ ตอนสร้าง Rental เสมอ ห้ามอ่านค่าปัจจุบันของ Product/Settings ตอนแสดงผลย้อนหลัง (กันปัญหาที่พบใน prototype ที่ Checkout hardcode fee 10% ไม่ตรงกับ Admin Settings):
```ts
// service ตอนสร้าง rental
const nights = diffInDays(startDate, endDate)
const pricePerDaySnap = product.pricePerDay
const serviceFeePct = settings.serviceFeePct   // อ่านจาก DB ตอนนี้ครั้งเดียว ไม่ hardcode
const serviceFee = pricePerDaySnap * nights * (serviceFeePct / 100)
const deposit = pricePerDaySnap * 2
const totalAmount = pricePerDaySnap * nights + serviceFee + deposit
```

### 20. Cancel Window (เฉพาะ LOOP — ยกเลิกคำขอเช่าฟรีภายใน 10 นาที)
```ts
// service
const CANCEL_WINDOW_MINUTES = 10
const canCancel = rental.status === 'PENDING' &&
  (Date.now() - rental.requestedAt.getTime()) < CANCEL_WINDOW_MINUTES * 60 * 1000
if (!canCancel) throw new BadRequestError('ไม่สามารถยกเลิกได้ เกินเวลาที่กำหนดแล้ว')
```
Frontend: countdown ใช้ `setInterval` ทุก 1 วินาที เริ่มใน `useEffect`/mount และ clear ตอน unmount เสมอ (กัน memory leak ตามที่เจอใน prototype เดิม)

---

## Task Management Rules (สำหรับ AI)

> 1. **เริ่ม task** → เปลี่ยน `[ ]` เป็น `[~]`
> 2. **เจอปัญหา** → เพิ่ม FIX ใต้ task นั้นทันที
> 3. **fix เสร็จ** → `[x]` + เพิ่ม `🧪 test:` และ `📝 commit:` ใต้ FIX item นั้น
> 4. **task เสร็จ** → `[x]` + เพิ่ม `🧪 test:` และ `📝 commit:` ใต้ task หลัก
> 5. **ห้ามลบ** FIX ที่เสร็จแล้ว — เก็บ `[x]` ไว้เป็น history

**สัญลักษณ์:**

| สัญลักษณ์ | ความหมาย |
|---|---|
| `[ ]` | ยังไม่เริ่ม |
| `[~]` | กำลังทำอยู่ |
| `[x]` | เสร็จแล้ว |
| `FIX #N:` | sub-task แก้ปัญหา (สร้างอัตโนมัติ) |
| `before/after:` | แสดงก่อน-หลังแก้ (ถ้าสั้นพอ) |
| `fix:` | สรุปวิธีแก้สั้นๆ (ถ้ายาวเกิน) |
| `🧪 test:` | วิธีทดสอบ + ผลที่ควรเห็น |
| `📝 commit:` | ชื่อ git commit ที่แนะนำ |

**โครงสร้าง:**
```
- [x] 1.1 task หลัก
  - 🧪 test: <คำสั่ง> → <ผลที่ควรเห็น>
  - 📝 commit: `feat(1.1): ...`

  - [x] FIX #1: <ปัญหา> | before: ... → after: ...
    - 🧪 test: <คำสั่ง> → <ผลที่ควรเห็น>
    - 📝 commit: `fix(1.1): ...`
```

---

## Tasks

### Phase 1 — Project Setup

- [x] 1.0 สร้างไฟล์ `.gitignore` ที่ root
  - 🧪 test: `git status` → node_modules, .env, dist ไม่ติด tracked ✅
  - 📝 commit: `chore: add gitignore`

- [x] 1.1 สร้าง Monorepo structure + ตั้งค่า npm workspaces
  - 🧪 test: `npm install` root → ติดตั้งสำเร็จ 717 packages ไม่มี error ✅
  - 📝 commit: `chore: init monorepo workspace`

  - [x] FIX #1: `bcrypt@5.x`/`multer@1.x` ดึง dependency (`@mapbox/node-pre-gyp`→`tar`, `node-pre-gyp`) ที่มี high-severity CVE | before: `bcrypt: ^5.1.1`, `multer: ^1.4.5-lts.1` → after: `bcrypt: ^6.0.0`, `multer: ^2.0.0` (ไม่มี native-build vulnerable chain)
    - 🧪 test: `npm audit --omit=dev` → เหลือเฉพาะ 2 moderate (อยู่ใน postcss ที่ bundle มากับ next เอง, ไม่ fixable โดยไม่ downgrade next) ✅
    - 📝 commit: `fix(deps): bump bcrypt and multer to patched major versions`

- [x] 1.2 ตั้งค่า Docker Compose (PostgreSQL + API + Web)
  - 🧪 test: `docker compose up` → ทุก container ขึ้นปกติ, `curl /api/health` → 200, `curl /` (web) → 200 ✅
  - 📝 commit: `chore: add docker-compose`

  - [x] FIX #1: host port 5432/4000/3000 ชนกับ container ของโปรเจกต์อื่น (`lawyer_db`/`lawyer_api`/`lawyer_web`) ที่รันอยู่แล้วบนเครื่อง | before: map `5432:5432`/`4000:4000`/`3000:3000` → after: map `5433:5432`/`4001:4000`/`3001:3000` (ปรับ `.env`/`.env.example` ทุกไฟล์ให้ตรงกัน)
    - 🧪 test: `docker compose up -d db` → container start สำเร็จไม่มี "port already allocated" ✅
    - 📝 commit: `fix(docker): remap host ports to avoid collision with other running projects`

  - [x] FIX #2: `PrismaClientInitializationError: ... libssl.so.1.1: No such file or directory` — Prisma query engine หา OpenSSL ไม่เจอบน `node:20-alpine` (musl) | before: ไม่มี `openssl` ใน image, ไม่ได้ระบุ `binaryTargets` → after: เพิ่ม `RUN apk add --no-cache openssl` ทั้ง build/runner stage ใน `apps/api/Dockerfile` + เพิ่ม `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` ใน `generator client` ของ `schema.prisma`
    - 🧪 test: `docker compose up -d` → `loop-api-1` status `Up` (ไม่ restart loop), `curl /api/health` → `{"status":"ok","db":"connected",...}` ✅
    - 📝 commit: `fix(api): install openssl and add musl binary target for prisma on alpine`

  - [x] FIX #3: web container ฟัง port ไม่ตรงกับที่ compose map ไว้ (`next start -p 3001` ข้างในแต่ compose map `3001:3000`) | before: `ports: ["3001:3000"]`, `EXPOSE 3000` → after: `ports: ["3001:3001"]`, `EXPOSE 3001` ให้ตรงกับ script `next dev/start -p 3001`
    - 🧪 test: `curl -o /dev/null -w "%{http_code}" http://localhost:3001/` → `200` ✅
    - 📝 commit: `fix(web): align docker port mapping with next -p 3001`

- [x] 1.3 ตั้งค่า Prisma ใน packages/db + เขียน schema.prisma (ตาม Data Models ด้านบน) + migrate
  - 🧪 test: `npx prisma migrate dev --name init` → migration `20260712155855_init` สร้างและ apply สำเร็จ, tables ตรงกับ schema ✅
  - 📝 commit: `feat(db): add prisma schema and initial migration`

  - [x] FIX #1: `packages/db` ไม่มี build step คอมไพล์ `src/index.ts` → JS ทำให้ apps/api (compiled, ไม่มี tsx) เรียก `require("@loop/db")` แล้ว crash (`Unexpected identifier 'global'` เพราะ Node รันไฟล์ `.ts` ตรงๆ ไม่ได้) | before: `main: "src/index.ts"`, `build: "prisma generate"` → after: `main: "dist/index.js"`, `types: "dist/index.d.ts"`, `build: "prisma generate && tsc -p tsconfig.json"`, จำกัด `tsconfig.json` ให้ `include` เฉพาะ `src` (ไม่รวม `prisma/seed.ts` ที่รันผ่าน `tsx` แยกอยู่แล้ว)
    - 🧪 test: `npm run build --workspace=packages/db && node apps/api/dist/index.js` (รันจาก `apps/api/`) → `{"status":"ok","db":"connected"}` ✅
    - 📝 commit: `fix(db): compile package to dist so compiled consumers (apps/api) can require it`

- [x] 1.4 ตั้งค่า Express API พื้นฐาน + เชื่อม PostgreSQL ผ่าน Prisma + Health endpoint
  - 🧪 test: `GET /api/health` → `{"status":"ok","db":"connected","uptime":N}` (ทดสอบทั้ง `tsx dev` และ compiled `node dist/index.js`) ✅
  - 📝 commit: `feat(api): setup express with prisma and health endpoint`

- [x] 1.5 ตั้งค่า Next.js + Tailwind CSS + Ant Design (เฉพาะ admin routes) + Axios + Zustand
  - 🧪 test: `npm run dev --workspace=apps/web` → `curl localhost:3001/` แสดง "LOOP." + tagline ✅ | `npm run build --workspace=apps/web` → compiled สำเร็จ (4 static pages) ✅
  - 📝 commit: `feat(web): setup nextjs tailwind antd axios zustand`

- [x] 1.6 ตั้งค่า Jest + Supertest สำหรับ API test
  - หมายเหตุ: แยก `src/app.ts` (Express app) ออกจาก `src/index.ts` (server start) ตามที่กำหนด — ts-jest ใช้ `tsconfig.test.json` แยกจาก build tsconfig (ดู FIX ด้านล่าง)
  - 🧪 test: `npm test --workspace=apps/api` → `PASS tests/health.test.ts` ✅
  - 📝 commit: `chore(api): setup jest and supertest`

  - [x] FIX #1: `tsc -p tsconfig.json` (build จริง) พังเพราะ `tests/` ไม่ได้อยู่ใต้ `rootDir: "src"` | before: tsconfig เดียวรวม `include: ["src","tests"]` → after: `tsconfig.json` (build) มีแค่ `include: ["src"]`, เพิ่ม `tsconfig.test.json` แยก (ไม่ล็อก rootDir) ให้ ts-jest ใช้แทนผ่าน `jest.config.js` → `transform`
    - 🧪 test: `npx tsc -p apps/api/tsconfig.json --noEmit` → ไม่มี error ✅ และ `npm test` ยังผ่านเหมือนเดิม ✅
    - 📝 commit: `fix(api): split build tsconfig from test tsconfig to satisfy rootDir`

  - [x] FIX #2: `moduleResolution: "node"` ขึ้น error `TS5107: deprecated` บน TypeScript 6.0.3 (ซึ่ง hoist มาที่ root node_modules จาก `@typescript-eslint`) ในขณะที่ local devDependency ของ `apps/api` คือ 5.9.3 — ค่า `ignoreDeprecations` ที่แต่ละเวอร์ชันต้องการไม่ตรงกัน (5.9 ต้องการ `"5.0"`, 6.0 บอกให้ใช้ `"6.0"`) ทำให้ตั้งค่าเดียวให้ผ่านทั้งคู่ไม่ได้ | before: `module: "commonjs"`, `moduleResolution: "node"` → after: `module: "node16"`, `moduleResolution: "node16"` (ไม่ deprecated, ผ่านทั้ง TS 5.9 และ 6.0) และตั้ง `tsconfig.test.json` override กลับเป็น `module/moduleResolution: "commonjs"/"node"` เพื่อเลี่ยง ts-jest hybrid-module warning
    - 🧪 test: `npx tsc -p apps/api/tsconfig.json --noEmit` (ทั้งด้วย local tsc 5.9.3 และ root-hoisted 6.0.3) → ผ่านทั้งคู่ ✅ | `npm test` ไม่มี ts-jest warning ✅
    - 📝 commit: `fix(api): use node16 module resolution to avoid deprecated node10 alias across ts versions`

- [x] 1.7 สร้าง `.dockerignore` (api + web)
  - 🧪 test: `docker compose build` → build context ไม่รวม `node_modules`/`dist`/`.next` ✅
  - 📝 commit: `chore: add dockerignore`

- [x] 1.8 ตั้งค่า ESLint + Prettier + lint-staged + Husky
  - 🧪 test: `npm run lint --workspaces --if-present` → ไม่มี error ✅ | commit ไฟล์ที่มี `any` → husky pre-commit รัน `lint-staged` แล้ว **บล็อกจริง** (`@typescript-eslint/no-explicit-any`) ✅
  - 📝 commit: `chore: add eslint prettier lint-staged`

  - [x] FIX #1: `next-env.d.ts` (auto-generated โดย Next.js) โดน ESLint กวาดแล้ว error `triple-slash-reference` | before: `ignorePatterns` ไม่รวมไฟล์นี้ → after: เพิ่ม `"next-env.d.ts"` ใน `ignorePatterns`
    - 🧪 test: `npm run lint --workspace=apps/web` → ผ่าน ✅
    - 📝 commit: `fix(lint): ignore generated next-env.d.ts`

- [x] 1.9 เพิ่ม Env Validation + Global Error Handler ใน API
  - 🧪 test: ลบ `JWT_SECRET` แล้วเรียก `validateEnv()` → throw `"Missing env: JWT_SECRET"` ทันที ✅ (ยืนยันซ้ำผ่าน compiled `dist/index.js` ที่รันโดยไม่มี `.env` → crash พร้อม error เดียวกัน) | Zod `ZodError` → `errorHandler` ตอบ 400 พร้อม `{ error: [{field, message}] }`
  - 📝 commit: `feat(api): env validation and global error handler`

- [x] 1.10 ติดตั้ง Zod ใน API + สร้าง validate middleware
  - 🧪 test: `validate({ body })` middleware โยน `ZodError` เมื่อ parse ไม่ผ่าน แล้ว Express ส่งต่อให้ `errorHandler` อัตโนมัติ (สังเคราะห์ error format ให้ Phase 2+ นำไปใช้กับ route จริงต่อ) ✅
  - 📝 commit: `feat(api): add zod request validation`

- [x] 1.11 สร้าง Seed script (roles admin/user + admin user + 5 categories + สินค้าตัวอย่าง + Settings singleton)
  - 🧪 test: `npx prisma db seed` → สร้าง role admin/user + permission 6 เมนู + admin user (`admin@loop.dev`) + 5 categories + settings singleton ✅ | รันซ้ำครั้งที่ 2 ไม่ error (upsert ทำงานถูกต้อง) ✅
  - 📝 commit: `chore(db): add seed script`


### Phase 2 — Marketplace Header/Navbar

- [x] 2.1 Web: สร้าง Header/Navbar (`shared/components/Header.tsx`) — announcement bar, โลโก้ "LOOP.", nav tabs หน้าแรก/ช้อป, ปุ่มสลับภาษา EN/TH, ปุ่ม "ลงประกาศให้เช่า", ไอคอน Saved, avatar + dropdown เมนู (รายการเช่าของฉัน/รายการปล่อยเช่าของฉัน/วิธีใช้งาน/ศูนย์ช่วยเหลือ/สมัครสมาชิก/สลับเป็นแอดมิน)
  - หมายเหตุ: เพิ่มฟอนต์ Archivo + Noto Sans Thai ผ่าน `next/font/google` ใน `app/layout.tsx` ให้ตรงกับ prototype
  - 🧪 test: เปิด `http://localhost:3001/` → navbar ตรงกับ reference design ✅ | คลิก EN/TH → สลับภาษาถูกต้องทั้งสีปุ่มและข้อความ (ตรวจผ่าน computed style ไม่ใช่แค่ดูภาพ) ✅ | คลิก avatar → dropdown เปิด/ปิดถูกต้อง ✅ | `console --errors` ว่าง ✅
  - 📝 commit: `feat(web): add header navbar component`

---

### Phase 3 — สมัครใช้งาน (Signup + KYC เริ่มต้น แบบ mock)

> ครอบคลุมทั้ง 4 ชั้น: Database (field OTP บน User) → API (register/otp/id-card/face-verify) → Web (หน้า Signup ฝั่งผู้ใช้ตามภาพ) → Backoffice (Admin > Users ดูรายชื่อ/ระงับการใช้งานได้)
>
> **หมายเหตุ:** สมัครเสร็จ + ยืนยัน OTP แล้ว = ใช้งานได้ทันที (`verificationStatus=APPROVED` อัตโนมัติ) ไม่ต้องรอแอดมินอนุมัติก่อน — ต่างจาก prototype เดิมที่ user ใหม่ค้างสถานะ PENDING รอแอดมิน Admin > Users จึงเป็นหน้าดู/จัดการผู้ใช้ (เช่น ระงับ/เปิดใช้งานภายหลัง) ไม่ใช่ gate ก่อนใช้งาน

- [x] 3.1 DB: เพิ่ม field สำหรับ OTP บน `User` + migration
  - เพิ่ม `otpCodeHash String?`, `otpExpiresAt DateTime?`, `otpMethod String?` ("email" | "phone"), `otpVerifiedAt DateTime?` (null = ยังไม่ยืนยันตัวตนผ่าน OTP)
  - 🧪 test: `npx prisma migrate dev --name add_user_otp_fields` → migration `20260716085115_add_user_otp_fields` apply สำเร็จ, คอลัมน์ใหม่ nullable ไม่กระทบ user เดิม ✅
  - 📝 commit: `feat(db): add otp fields to user for signup verification`

- [x] 3.0 (พบระหว่างทำ) API: Auth infra ขั้นต่ำที่ยังไม่มี — JWT sign/verify, `authenticate` middleware, `requireRole` middleware, `POST /api/auth/login`
  - เหตุผล: 3.5/3.8/3.9 ต้องมี "เจ้าของบัญชีเท่านั้น" และ "admin เท่านั้น" ซึ่งทำไม่ได้ถ้าไม่มี auth infra จริง (Phase 2 เดิมที่วางแผนเรื่องนี้ไว้ถูกตัดไปทำ Header/Navbar แทน) — เพิ่ม `utils/jwt.ts`, `middleware/authenticate.ts`, `middleware/requireRole.ts`, `types/express.d.ts` (ขยาย `Request.user`), `services/auth.service.ts::login`
  - 🧪 test: ไม่มี token → 401 | token ผิด → 401 | role ไม่ถึง → 403 (ครอบคลุมใน 3.10) ✅
  - 📝 commit: `feat(api): minimal jwt auth infra (sign/verify, authenticate, requireRole, login)`

- [x] 3.2 API: `POST /api/auth/register` — สร้าง user จากฟอร์มสมัคร (step 1)
  - รับ `{ accountType, name, email, phone, password }` validate ด้วย Zod, hash password ด้วย bcrypt, สร้าง `User` role=`user`, `verificationStatus=PENDING` (ชั่วคราวระหว่างรอยืนยัน OTP เท่านั้น), `otpVerifiedAt=null` — คืน JWT ทันที (ล็อกอินแบบ "ยังไม่ยืนยัน" เพื่อให้เรียก endpoint ถัดไปในขั้นตอนสมัครได้)
  - 🧪 test: อีเมลซ้ำ → 409 `ConflictError('อีเมลนี้ถูกใช้แล้ว')` ✅ | สำเร็จ → 201 คืน `{ token, user }` (ไม่คืน passwordHash) ✅ | body ไม่ผ่าน validate → 400 ✅
  - 📝 commit: `feat(api): user registration endpoint`

- [x] 3.3 API: `POST /api/auth/register/otp/request` + `POST /api/auth/register/otp/verify`
  - request (ต้อง auth): รับ `{ method: 'email'|'phone' }` (userId มาจาก JWT ไม่รับจาก body — กัน request OTP แทนคนอื่น) → generate รหัส 6 หลัก, เก็บ `otpCodeHash` (bcrypt hash) + `otpExpiresAt` (+5 นาที) + `otpMethod` — โหมด mock: `console.log` รหัสแทนการส่งจริง
  - verify (ต้อง auth): รับ `{ code }` → compare กับ `otpCodeHash`, เช็คไม่หมดอายุ → ตั้ง `otpVerifiedAt=now()`, เคลียร์ `otpCodeHash`, **และตั้ง `verificationStatus=APPROVED` ทันที**
  - 🧪 test: ไม่มี token → 401 ✅ | รหัสผิด → 400 ✅ | รหัสถูก → 200 `otpVerifiedAt` ถูกตั้งค่า และ `verificationStatus === 'APPROVED'` ✅ (ดึงรหัสจริงจาก mock log ใน test ผ่าน `jest.spyOn(console, "log")`)
  - 📝 commit: `feat(api): otp request and verify auto-activates account`

  - [x] FIX #1: body spec เดิมตั้งใจรับ `userId` ผ่าน body ซึ่งเป็นช่องโหว่ (ใครก็ขอ/ยืนยัน OTP แทนบัญชีคนอื่นได้ถ้ารู้ id) | before: `{ userId, method }` ไม่ auth → after: endpoint ต้อง `authenticate` เสมอ, ดึง `userId` จาก `req.user.userId` (JWT) เท่านั้น
    - 🧪 test: เรียกโดยไม่มี Bearer token → 401 ✅
    - 📝 commit: รวมอยู่ใน `feat(api): otp request and verify auto-activates account`

- [x] 3.4 API: อัปโหลดบัตรประชาชน + OCR จำลอง
  - `POST /api/users/:id/id-card` (auth + multer, จำกัด PNG/JPEG/WEBP ≤5MB, เก็บ `idCardImageUrl`) | `POST /api/users/:id/id-card/ocr-mock` (auth) — คืนค่าจำลองคงที่ (`SOMCHAI JAIDEE`, `1-2345-67890-12-3`, `1995-05-12`, `2030-05-12`) ตาม prototype ปุ่ม "ดึงข้อมูลจากรูปภาพ (จำลอง)" — ยังไม่ต่อ OCR provider จริง (ดู requirement.md Phase ถัดไป) — ทั้งสอง endpoint บังคับ `:id === req.user.userId` เท่านั้น (403 ถ้าไม่ใช่เจ้าของ)
  - 🧪 test: ไม่มีไฟล์แนบ → 400 ✅ | อัปโหลดสำเร็จ → คืน `/uploads/id-cards/...` ✅ | อัปโหลดให้บัญชีคนอื่น → 403 ✅ | ไม่มี token → 401 ✅ | ocr-mock คืนค่าเดิมทุกครั้ง ✅
  - 📝 commit: `feat(api): id card upload and mock ocr endpoint`

  - [x] FIX #1: ยังไม่มี static file serving + upload directory ในโปรเจกต์ (ฟีเจอร์อัปโหลดแรกของระบบ) | before: ไม่มี `middleware/upload.ts`, ไม่ serve `/uploads` → after: เพิ่ม `createImageUpload()` (multer diskStorage แยกโฟลเดอร์ตาม subdir, fileFilter คืน `BadRequestError` แทน `Error` เปล่าเพื่อให้ `errorHandler` จับเป็น 400 ได้ถูกต้อง) + `app.use("/uploads", express.static(...))` + เพิ่ม `MulterError` branch ใน `errorHandler.ts`
    - 🧪 test: `curl http://localhost:4001/uploads/id-cards/<file>` → 200 ได้ไฟล์ที่อัปโหลดจริง ✅
    - 📝 commit: `feat(api): image upload middleware with static serving`

- [x] 3.5 API: `POST /api/users/:id/face-verify` — ยืนยันใบหน้าจำลอง
  - mock endpoint (auth, เจ้าของบัญชีเท่านั้น): ตั้ง `faceVerified=true` ทันที (จำลองปุ่ม "Simulate scan complete" ใน prototype) — เตรียม endpoint ไว้สลับเป็น provider จริง (liveness check) ภายหลังโดยไม่กระทบ contract
  - 🧪 test: เรียก endpoint → `faceVerified` เปลี่ยนเป็น `true` ✅ | user ไม่มีสิทธิ์ (ไม่ใช่เจ้าของบัญชี) → 403 ✅
  - 📝 commit: `feat(api): mock face verification endpoint`

- [x] 3.6 Web: หน้า Signup — ฟอร์มสมัคร (`modules/auth/components/SignupForm.tsx`)
  - ตามภาพ: kicker "สร้างบัญชี", หัวข้อ "สมัครใช้งาน LOOP", toggle ประเภทบัญชี (บุคคล/ร้านค้า), ช่องชื่อผู้ใช้/อีเมล/เบอร์โทร/รหัสผ่าน, ช่องอัปโหลดรูปบัตรประชาชน (พร้อมข้อความ "ใช้เพื่อยืนยันตัวตนสำหรับการเช่าที่ปลอดภัย ไม่เปิดเผยต่อผู้ใช้อื่น"), ปุ่ม "ดึงข้อมูลจากรูปภาพ (จำลอง)" (แสดงผลจำลอง client-side ทันที) และปุ่ม "ยืนยันใบหน้าผ่านโทรศัพท์" (จำลอง "สแกนสำเร็จ"), ปุ่มหลัก "สร้างบัญชี" สีดำเต็มความกว้าง
  - หมายเหตุการออกแบบ: ปุ่ม OCR/face-verify ระหว่างกรอกฟอร์ม (ก่อนมี user จริง) เป็น mock แบบ client-only ตาม prototype เดิม — พอกด "สร้างบัญชี" ถึงเรียก `POST /api/auth/register` แล้ว `setAuth()` เข้า authStore ทันที ตามด้วยอัปโหลดไฟล์บัตร/ยิง face-verify จริงถ้าผู้ใช้กดไว้ (ไม่ block flow ถ้าล้มเหลว ให้แก้ทีหลังได้)
  - 🧪 test: เปิด `/signup` → ตรงกับภาพอ้างอิง ✅ | กรอกครบ + กด OCR/face-verify mock + submit → เรียก `/api/auth/register` สำเร็จ → ไปขั้นตอน OTP ✅ (ตรวจผ่าน Playwright end-to-end, `console --errors` ว่าง)
  - 📝 commit: `feat(web): signup form matching reference design`

- [x] 3.7 Web: ขั้นตอน OTP + หน้าสำเร็จ (`modules/auth/components/OtpStep.tsx`, `SignupPage.tsx`)
  - เลือกช่องทาง (อีเมล/เบอร์โทร) พร้อม mask ปลายทาง, กรอกรหัส 6 หลัก, ปุ่ม "ยืนยันและสร้างบัญชี" → หน้าสำเร็จ "สร้างบัญชีสำเร็จ!" + ปุ่ม "กลับหน้าแรก"
  - 🧪 test: กรอกรหัสผิด → แสดง error จาก API (Dev Standard #17) | กรอกรหัสถูก (ดึงจาก mock log จริงใน Playwright test) → ไปหน้าสำเร็จ ✅ end-to-end ผ่านเบราว์เซอร์จริง
  - 📝 commit: `feat(web): otp verification step and success screen`

- [x] 3.8 API (Backoffice): `GET /api/admin/users` + `PATCH /api/admin/users/:id/status` + `GET /api/role-permissions/:role`
  - GET users: รายการ user ทั้งหมด (`name, email, createdAt, accountType, verificationStatus`) — admin only, ส่วนใหญ่จะเป็น `APPROVED` อยู่แล้วเพราะ auto-activate ตอน OTP ผ่าน (3.3)
  - PATCH: รับ `{ status: 'APPROVED'|'REJECTED' }` — ใช้เป็นเครื่องมือ **moderation ภายหลัง** ไม่ใช่ gate ก่อนใช้งาน เรียกได้ทุกเมื่อไม่ผูกกับสถานะ PENDING
  - GET role-permissions (พบระหว่างทำ 3.9): จำเป็นสำหรับ `PermissionGuard` ฝั่ง Web ตาม Dev Standard #10 — คืน permission ทั้ง 6 เมนูของ role ที่ระบุ
  - 🧪 test: non-admin เรียก users/status → 403 ✅ | ไม่มี token → 401 ✅ | admin เปลี่ยนสถานะ `APPROVED`→`REJECTED`→`APPROVED` ได้ทั้งสองทาง → 200 ✅ | `status` ไม่ใช่ enum ที่กำหนด → 400 ✅ | `GET /api/role-permissions/admin` คืน `canView/Create/Update/Delete: true` ครบ 6 เมนู ✅
  - 📝 commit: `feat(api): admin user list, status moderation, and role permissions endpoint`

- [x] 3.9 Web (Backoffice): หน้า Admin > Users (`modules/admin/components/UserTable.tsx`)
  - ตาราง: ชื่อ, อีเมล, วันที่สมัคร, ประเภท (บุคคล/ร้านค้า), สถานะ (สี: เขียว=ใช้งานได้/แดง=ถูกระงับ/เทา=รอยืนยัน OTP) ตาม Table Standard (#15 — คอลัมน์ลำดับ, action column ชื่อ "จัดการ", controlled pagination) | ปุ่ม "ระงับ"/"ปลดระงับ" แสดงทุกแถว (ไม่ gate ด้วย PENDING อีกต่อไป) ผ่าน `PermissionGuard menuKey="users"`
  - 🧪 test: `PermissionGuard` กัน non-admin (403 จริงในเบราว์เซอร์ — สมัคร user ปกติแล้วเข้า `/users` ตรงๆ) ✅ | admin login → เห็นตาราง → กดระงับ/ปลดระงับ → toast แสดงผล + สถานะในตารางเปลี่ยนทันที ✅ (ตรวจผ่าน Playwright screenshot)
  - 📝 commit: `feat(web): admin users page with status moderation`

  - [x] FIX #1: URL ผิดจากที่ตั้งใจ — `app/(admin)/users/page.tsx` ให้ URL จริงเป็น `/users` ไม่ใช่ `/admin/users` เพราะ `(admin)` เป็น Next.js route group (วงเล็บ) ไม่เพิ่ม path segment ตามที่ออกแบบไว้ตั้งแต่ Monorepo Structure ใน CLAUDE.md เอง | before: `LoginForm` สั่ง `router.push("/admin/users")`, `ROUTES.admin = "/admin/dashboard"` → after: แก้เป็น `router.push("/users")`, `ROUTES.admin = "/dashboard"` + เพิ่ม `ROUTES.adminUsers = "/users"`
    - 🧪 test: login ด้วย `admin@loop.dev` → redirect ไป `/users` (ไม่ 404) ✅
    - 📝 commit: `fix(web): correct admin route to match (admin) route group convention`

  - [x] FIX #2 (โครงสร้างรองรับ, พบระหว่างทำ): ยังไม่มี `permissionStore`, `PermissionGuard`, หน้า Login ตาม Dev Standard #10 — เพิ่ม `store/permissionStore.ts` (Zustand persist, `canView/Create/Update/Delete`), `shared/guards/PermissionGuard.tsx` (รอ `mounted` ก่อน check ตามตัวอย่างใน CLAUDE.md), `shared/components/Page403.tsx`, `modules/auth/components/LoginForm.tsx` + `app/(auth)/login/page.tsx`, และ `authStore.clearAuth()` เรียก `permissionStore.clearPermissions()` ด้วยตาม standard "permissionStore ต้อง clear ตอน logout"
    - 🧪 test: login เป็น admin → `permissionStore` มี permission ครบ → เข้า `/users` ได้ | login เป็น user ปกติ → `permissionStore` ว่าง → เข้า `/users` → เห็นหน้า 403 ✅
    - 📝 commit: `feat(web): login page, permissionStore, and PermissionGuard`

- [x] 3.10 Auto test: ครอบคลุม register → otp (auto-activate) → id-card/face-verify mock → admin moderation ครบวงจร
  - 🧪 test: `npm test --workspace=apps/api` → **22/22 ผ่าน** (`health.test.ts`, `auth.test.ts`, `user.test.ts`, `admin.test.ts`) รวม edge case: OTP ผิด/ไม่ auth, ownership 403 (id-card/face-verify), non-admin 403, invalid enum 400, OTP ผ่านแล้ว `verificationStatus` เป็น `APPROVED` ทันทีโดยไม่มี admin action ใดๆ ✅

---

### Phase 4 — Admin Panel (Dashboard, Categories, Users, Products, Payments, Settings)

> อ้างอิงดีไซน์จาก prototype (`Prototype เว็บ C2C/LOOP Home (standalone).html` — หน้า Admin Dashboard): sidebar เข้มด้านซ้าย (โลโก้ "LOOP. Admin", เมนู แดชบอร์ด → หัวข้อกลุ่ม "ข้อมูลหลัก" → ประเภทสินค้า/ผู้ใช้/สินค้า/การชำระเงิน/ตั้งค่า, ปุ่มยุบ/ขยายด้านล่าง), top bar ("ออกจากแอดมิน" + avatar + ชื่อผู้ใช้ (label role ในวงเล็บ)), หน้า Dashboard มี stat card 6 ใบ + กราฟแท่ง "สินค้าตามหมวดหมู่"
>
> **ลำดับความสำคัญ:** เริ่มจาก **User & Role management** ก่อน (4.1–4.4) เพราะมีข้อมูลจริงอยู่แล้วจาก Phase 3 (`User`/`Role`/`RolePermission`) — ส่วน Categories/Products/Payments/Settings (4.6 เป็นต้นไป) ต้อง **re-add model กลับเข้า schema ก่อน** เพราะถูกลบออกตอน schema trim (ดู Phase 3 FIX เรื่อง `remove_unimplemented_models`) จะยังไม่ทำจนกว่าจะถึง Phase สินค้า/หมวดหมู่จริง

- [x] 4.1 Web: Admin sidebar shell ตามภาพ (ปรับ `app/(admin)/layout.tsx` + `shared/components/AdminSidebar.tsx`)
  - Sidebar เข้ม: โลโก้ "LOOP. Admin", รายการเมนูพร้อมไอคอน (แดชบอร์ด, หัวข้อกลุ่ม "ข้อมูลหลัก", ประเภทสินค้า/ผู้ใช้/บทบาทและสิทธิ์/สินค้า/การชำระเงิน/ตั้งค่า), ปุ่มยุบ/ขยาย sidebar ด้านล่าง (จำสถานะด้วย localStorage) — เมนูที่ยังไม่มีหน้าจริง (ประเภทสินค้า/สินค้า/การชำระเงิน/ตั้งค่า) แสดงเป็น disabled พร้อมป้าย "เร็วๆ นี้" แทนการซ่อนไปเลย (อ้างอิงแนวทาง `disabledNav` ของ prototype เดิม)
  - Top bar: ปุ่ม "ออกจากแอดมิน" (เรียก `clearAuth()` + กลับหน้าแรก), avatar placeholder + ชื่อผู้ใช้จริงจาก `authStore` + label role (map เฉพาะ `admin`/`user` ไว้ก่อน, fallback เป็นชื่อ role ดิบถ้าเป็น role ใหม่ที่สร้างเอง)
  - เมนู sidebar ที่มีหน้าจริง (`dashboard`/`users`/`roles`) แสดงเฉพาะเมื่อ `permissionStore.canView(menuKey)` เป็น true ตาม Dev Standard #10
  - 🧪 test: login admin → เข้าหน้า `/users` → เห็น sidebar เต็มรูปแบบตรงภาพ ✅ | คลิกยุบ/ขยายได้และจำสถานะหลัง refresh ✅ | คลิก "ออกจากแอดมิน" → กลับหน้าแรกและ auth เคลียร์ ✅ (ตรวจผ่าน Playwright screenshot)
  - 📝 commit: `feat(web): admin sidebar shell matching reference design`

  - [x] FIX #1: Hydration mismatch — `AdminSidebar`'s `NavLink` เรียก `usePermissionStore` ตรงๆ ไม่รอ mount ทำให้ server render (permissions ว่างก่อน rehydrate จาก localStorage) กับ client render (permissions จริงหลัง rehydrate) ไม่ตรงกัน React โยน hydration error | before: `if (item.ready && !canView) return null` → after: เพิ่ม prop `mounted` จาก `AdminSidebar` (มี state นี้อยู่แล้วสำหรับ sidebar width) ส่งเข้า `NavLink`, เงื่อนไขเป็น `if (item.ready && (!mounted || !canView)) return null` เพื่อให้ server กับ client-ก่อน-mount render ตรงกันเสมอ (ซ่อนไว้ก่อน) เหมือน pattern ของ `PermissionGuard`
    - 🧪 test: capture `console`/`pageerror` ผ่าน Playwright ก่อนแก้ → เจอ `Hydration failed...` ชัดเจน | หลังแก้ → ไม่มี error/warning ที่เกี่ยวกับ hydration เหลืออยู่เลย ✅
    - 📝 commit: `fix(web): guard permission-based sidebar items behind mounted flag to avoid hydration mismatch`

  - [x] FIX #2 (bug เดียวกัน จุดอื่น): `app/(admin)/layout.tsx` เองก็อ่าน `useAuthStore()` มาโชว์ชื่อ/role ใน top bar ตรงๆ โดยไม่รอ mount เช่นกัน (ความเสี่ยง hydration mismatch แบบเดียวกับ FIX #1 แต่ยังไม่ทันแสดงอาการเพราะ optional chaining ไม่มี error แค่ mismatch เงียบๆ) | before: `{user && (...)}` → after: เพิ่ม `mounted` state (`useEffect` set true) เป็น `{mounted && user && (...)}`
    - 🧪 test: ตรวจซ้ำด้วย Playwright ไม่มี hydration warning ทั้งหน้า `/dashboard`, `/roles`, `/users` ✅
    - 📝 commit: รวมอยู่ใน `fix(web): guard permission-based sidebar items behind mounted flag to avoid hydration mismatch`

- [x] 4.2 DB + API: Role CRUD จริง (แทน role คงที่ admin/user ที่ seed ไว้)
  - เพิ่ม `GET/POST/PUT/DELETE /api/roles` (admin only) ตาม Dev Standard #11 — Repository flatten ทุกจุดที่ query role
  - ลบ role ที่ยังมี user ผูกอยู่ไม่ได้ (ป้องกัน user ค้าง role ที่ไม่มีอยู่จริง)
  - 🧪 test: สร้าง/แก้ไข/ลบ role ใหม่ได้ (admin only, non-admin → 403) ✅ | ลบ role ที่มี user ผูกอยู่ → 409 ✅ | ลบ role ที่ไม่มี user → 200 ✅ | ชื่อ role ซ้ำ → 409 ✅
  - 📝 commit: `feat(api): role crud endpoints`

  - [x] FIX #1: ลบ role ที่ไม่มี user ผูกแล้วก็ยัง 500 — `RolePermission` มี FK ไปที่ `Role` แบบไม่มี cascade ทำให้ `prisma.role.delete()` ชน FK constraint ถ้า role นั้นเคยมี permission row ถูก seed/สร้างไว้ (ซึ่งมีทุก role เพราะ 4.3/4.4 สร้าง permission ให้ทุก role ที่เลือกในหน้า matrix) | before: `RolePermission.role` ไม่มี `onDelete` → after: เพิ่ม `onDelete: Cascade` ใน schema + migration `role_permission_cascade_delete`
    - 🧪 test: สร้าง role ใหม่ + ผูก permission แล้วลบ role นั้น → 200 ลบสำเร็จทั้ง role และ permission ที่ผูกอยู่ ✅ (พบจาก curl smoke test ก่อนจะเขียน Jest ยืนยันซ้ำ)
    - 📝 commit: `fix(db): cascade delete role permissions when a role is deleted`

- [x] 4.3 API: อัปเดต Role Permission (`PUT /api/role-permissions/:role/:menuKey`)
  - ต่อยอดจาก `GET /api/role-permissions/:role` ที่มีอยู่แล้ว (Phase 3.8) — เพิ่มฝั่งแก้ไขค่า canView/Create/Update/Delete ต่อ role+menu ด้วย `upsert` (รองรับทั้ง role ใหม่ที่ยังไม่เคยมี permission row มาก่อน)
  - 🧪 test: admin แก้ไข permission ของ role+menu → 200 อัปเดตค่าใหม่ถูกต้อง ✅ | non-admin → 403 ✅ | body ไม่ใช่ boolean ครบ 4 ตัว → 400 ✅
  - 📝 commit: `feat(api): update role permission endpoint`

- [x] 4.4 Web: หน้า Roles + Role Permission matrix (`modules/admin/components/RoleTable.tsx`, `RolePermissionMatrix.tsx`, `RolesPage.tsx`)
  - ตาราง role: ชื่อ, label, จำนวน user ที่ผูกอยู่ + ปุ่มเพิ่ม/แก้ไข/ลบ ตาม Table Standard #15 + Modal Pattern #16 (ปุ่มลบ disabled ถ้า `userCount > 0`)
  - Permission matrix: เลือก role จาก dropdown แล้วติ๊ก canView/Create/Update/Delete ต่อเมนู (`dashboard`/`users`/`roles` — 3 เมนูที่มีหน้าจริงตอนนี้) บันทึกทันทีที่เปลี่ยน (optimistic update + rollback ถ้า API fail + toast)
  - `RolesPage.tsx` (client component) ผูก `refreshKey` ระหว่างสอง component ให้ matrix รู้จัก role ใหม่ทันทีที่ตารางสร้าง/ลบเสร็จ
  - 🧪 test: สร้าง role ใหม่ → ปรากฏใน dropdown ของ permission matrix ทันที ✅ | ติ๊ก checkbox → บันทึกจริง (ตรวจซ้ำด้วยการโหลดหน้าใหม่) ✅ | ลบ role ที่มี user ผูกอยู่ → ปุ่มลบ disabled ไม่ต้องรอ error จาก server ✅ (ตรวจผ่าน Playwright end-to-end จริง)
  - 📝 commit: `feat(web): role and permission management pages`

- [x] 4.5 Web: Admin Dashboard (`modules/admin/components/DashboardStats.tsx`)
  - stat card 6 ใบตามภาพ: ผู้ใช้ทั้งหมด (+ "รอตรวจสอบ N รายการ" นับจาก `verificationStatus=PENDING`) ใช้ข้อมูลจริงจาก `GET /api/admin/dashboard` — การ์ด สินค้าทั้งหมด/ออเดอร์ทั้งหมด/มูลค่าการเช่ารวม/หมวดหมู่/รายการที่ปล่อยเช่า แสดง "—" ชัดเจนพร้อมคำอธิบายด้านล่างว่ายังไม่เปิดใช้งาน จนกว่าจะมี `Product`/`Rental`/`Category` model จริง — **ไม่ hardcode ตัวเลขปลอมแบบ prototype เดิม**
  - 🧪 test: เข้า `/dashboard` (admin, ผ่าน `PermissionGuard menuKey="dashboard"`) → การ์ดผู้ใช้แสดงตัวเลขจริงตรงกับ DB ✅, การ์ดอื่นแสดง "—" ไม่ใช่เลขคงที่ ✅ (ตรวจผ่าน Playwright screenshot)
  - 📝 commit: `feat(web): admin dashboard with real user stats and honest placeholders`

- [x] 4.6 DB: เพิ่ม `Category` + `Product` + `ProductImage` + `PickupOption` model กลับเข้า schema
  - โครงสร้างเดิมก่อน schema trim (`Category` มี audit fields ตาม Dev Standard #18, `Product` มี `status` enum `UNDER_REVIEW/ACTIVE/PAUSED`, `ratingAvg`/`reviewCount` เป็น cache ไว้ก่อนเพราะยังไม่มี `Review` model) — ยังไม่ใส่ความสัมพันธ์กับ `Rental`/`Favorite`/`Review` เพราะ model เหล่านั้นยังไม่ถูกสร้าง
  - เพิ่ม `onDelete: Cascade` ให้ `ProductImage`/`PickupOption` → `Product` ตั้งแต่แรก (บทเรียนจาก FIX ของ 4.2 ที่ `RolePermission` ลืมใส่จนต้องแก้ทีหลัง)
  - 🧪 test: `npx prisma migrate dev --name reintroduce_category_and_product` → migration สำเร็จ ไม่กระทบ `User`/`Role`/`RolePermission` เดิม ✅
  - 📝 commit: `feat(db): reintroduce category and product models`

- [x] 4.7 API + Web: Admin หมวดหมู่ (Category CRUD)
  - API: `GET /api/categories` (public, `?status=all` สำหรับ admin ตาม Dev Standard #12), `POST/PUT/PATCH :id/status/DELETE` (admin only) — auto-slugify จากชื่อถ้าไม่ระบุ slug, กันชื่อ/slug ซ้ำ (409), ลบไม่ได้ถ้ายังมีสินค้าผูกอยู่ (409), soft delete ตาม Dev Standard #9
  - Web: `modules/admin/components/CategoryTable.tsx` — ตาราง + Modal เพิ่ม/แก้ไข (Table Standard #15 + Modal Pattern #16) + `Switch` toggle `isActive` ในคอลัมน์ตาราง (ไม่ใช่ในตัว modal เพราะต้อง toggle ไว-ๆ จากตารางได้เลย)
  - 🧪 test: สร้าง/แก้ไข/ลบหมวดหมู่ ✅ | slug ซ้ำ → 409 ✅ | toggle สถานะ → หายจาก list `active` ทันที แต่ยังอยู่ใน `?status=all` ✅ | ลบหมวดหมู่ที่มีสินค้า → disabled ปุ่มลบฝั่ง UI (ตรวจผ่าน Playwright screenshot จริง)
  - 📝 commit: `feat: admin category management (api + web)`

- [x] 4.8 API + Web: Admin สินค้า (read-only)
  - API: `GET /api/admin/products` (admin only) — join `category`/`owner`/รูปแรกของสินค้า คืน `thumbnailUrl`
  - Web: `modules/admin/components/ProductTable.tsx` — ตาราง read-only (รูป, ชื่อ, หมวดหมู่, ผู้ขาย, ราคา/วัน, คะแนน, ที่ตั้ง, สถานะ) ตาม Table Standard #15 — แสดง empty state "No data" เพราะยังไม่มีหน้าลงประกาศจริง (ดู Phase 5)
  - 🧪 test: non-admin → 403 ✅ | admin → 200 คืน array ว่างตอนนี้ (ถูกต้อง เพราะยังไม่มี flow สร้างสินค้าจริง) ✅
  - 📝 commit: `feat: admin products readonly page (api + web)`

  - [x] FIX #1 (พบระหว่างทำ 4.7-4.8): `AdminSidebar` ยังตั้ง `ready: false` ค้างไว้สำหรับ `categories`/`products` (แสดง "เร็วๆ นี้" disabled) ทั้งที่ตอนนี้มีหน้าจริงแล้ว | before: `ready: false` ทั้งสองเมนู → after: เปลี่ยนเป็น `ready: true` และ seed `adminMenus` เพิ่ม `"categories", "products"` ให้ admin role มองเห็นเมนูจริง
    - 🧪 test: login admin → sidebar แสดง "ประเภทสินค้า"/"สินค้า" เป็นเมนูจริงคลิกได้ ไม่มีป้าย "เร็วๆ นี้" แล้ว ✅ (`payments`/`settings` ยัง disabled ถูกต้องเพราะยังไม่มี model)
    - 📝 commit: รวมอยู่ใน `feat: admin category management (api + web)`

- [ ] 4.9 (รอ Rental model — Phase เช่า/checkout) API + Web: Admin การชำระเงิน (สรุปยอด + ตารางธุรกรรม + export ตาม Dev Standard ExcelJS)
- [ ] 4.10 (รอ Settings model) API + Web: Admin ตั้งค่า (platformName, currency, serviceFeePct, requireIdVerification, maintenanceMode)

---

### Phase 5 — ลงประกาศให้เช่า (List Item)

> อ้างอิงสเปกจาก [`requirement.md`](./requirement.md) หัวข้อ 4.6 "ลงประกาศสินค้า" — หน้าฝั่ง**ผู้ใช้ทั่วไป** (marketplace ไม่ใช่ admin) สำหรับสร้าง/แก้ไข/พัก/ลบประกาศให้เช่าสินค้าของตัวเอง ต่อยอดจาก `Category`/`Product`/`ProductImage`/`PickupOption` ที่เพิ่งเพิ่มกลับเข้า schema ใน Phase 4.6
>
> **หมายเหตุ:** Phase 4.8 (Admin สินค้า) ยังไม่มีปุ่ม approve/reject (read-only ตามสโคป) ดังนั้นตอนนี้ยังไม่มีทางให้ `UNDER_REVIEW` กลายเป็น `ACTIVE` ผ่าน UI จริง — pause/resume ของ owner (5.2) ยังใช้งานได้เต็มรูปแบบกับประกาศที่ผ่านการอนุมัติแล้ว แค่ต้องรออนุมัติผ่านช่องทางอื่น (เช่น ตรงๆ ใน DB) จนกว่าจะมี Phase admin-approve-product ในอนาคต — 🧪 test ของ 5.2/5.7 จำลองสถานะ "ผ่านการอนุมัติแล้ว" ด้วยการอัปเดต DB ตรงเพื่อทดสอบ pause/resume

- [x] 5.1 API: `POST /api/products` — สร้างประกาศ (auth, ทุก user ที่ login แล้วสร้างได้ ไม่ต้องเป็น role พิเศษ)
  - รับ `{ title, description, categoryId, pricePerDay, location }` validate ด้วย Zod, ตั้ง `ownerId = req.user.userId`, `createdById = req.user.userId`, `status = UNDER_REVIEW` เสมอ (ไม่ให้ user ตั้ง ACTIVE เองได้ตรงๆ)
  - 🧪 test: สร้างสำเร็จ → 201 status `UNDER_REVIEW` ✅ | ไม่ login → 401 ✅ | `categoryId` ไม่มีอยู่จริง/ไม่ active → 400 ✅
  - 📝 commit: `feat(api): implement phase 5 product listing lifecycle for owners`

- [x] 5.2 API: `PUT /api/products/:id` (owner เท่านั้น) + `PATCH /api/products/:id/status` (owner: pause/resume เท่านั้น สลับระหว่าง `ACTIVE`↔`PAUSED` — ห้าม set `UNDER_REVIEW`/`ACTIVE` เองถ้ายังไม่เคยผ่านการอนุมัติ) + `DELETE /api/products/:id` (soft delete ตาม Dev Standard #9)
  - 🧪 test: แก้ไข/ลบประกาศของคนอื่น → 403 ✅ | pause ขณะยัง `UNDER_REVIEW` → 400 ✅ | pause แล้ว resume ได้เฉพาะประกาศที่เคย `ACTIVE` มาก่อน (จำลองผ่าน DB ตรงตามหมายเหตุด้านบน) ✅ | ลบแล้วหายจาก `GET /api/me/listings` ✅
  - 📝 commit: รวมอยู่ใน `feat(api): implement phase 5 product listing lifecycle for owners`

- [x] 5.3 API: อัปโหลดรูปสินค้า + จัดการจุดรับสินค้า
  - `POST /api/products/:id/images` (owner, multer, รองรับหลายรูป, เรียงตาม `sortOrder`) — ใช้ `createImageUpload()` เดิมจาก Phase 3 (เปลี่ยน subdir เป็น `products`)
  - `POST /api/products/:id/pickup-options` + `DELETE /api/products/:id/pickup-options/:optionId` (owner)
  - 🧪 test: อัปโหลดไม่ใช่รูป → 400 ✅ | อัปโหลด/ลบรูปของสินค้าคนอื่น → 403 ✅ | เพิ่ม/ลบจุดรับสินค้าได้ ✅ | sortOrder เรียงต่อเนื่องตามลำดับอัปโหลด ✅
  - 📝 commit: รวมอยู่ใน `feat(api): implement phase 5 product listing lifecycle for owners`

- [x] 5.4 API: `GET /api/me/listings` (auth) — ประกาศทั้งหมดของ user ที่ login (ทุกสถานะ รวม `UNDER_REVIEW`/`PAUSED`)
  - 🧪 test: คืนเฉพาะประกาศของ user นั้น ไม่เห็นของคนอื่น ✅ | ไม่ login → 401 ✅
  - 📝 commit: รวมอยู่ใน `feat(api): implement phase 5 product listing lifecycle for owners`

- [x] 5.5 Web: หน้าลงประกาศ (`modules/products/components/ListItemForm.tsx`, route `app/(marketplace)/list-item/page.tsx`)
  - อัปโหลดรูป (1 รูปต่อครั้งตามสเปก — ขยายเป็นหลายรูปทีหลังได้เพราะ API รองรับอยู่แล้ว), ชื่อสินค้า, หมวดหมู่ (dropdown จาก `GET /api/categories` — active only), ราคา/วัน (บาท), รายละเอียด (textarea), ที่ตั้งสินค้า (ข้อความ), จุดรับสินค้า (chip เพิ่ม/ลบ)
  - ปุ่มส่งประกาศ → `POST /api/products` จริง แล้วอัปโหลดรูป/pickup options ตามลำดับ → หน้าสำเร็จ "ส่งประกาศสำเร็จ! รอตรวจสอบ" + ปุ่ม "ลงประกาศเพิ่ม" (รีเซ็ตฟอร์ม) — component เดียวกันรองรับโหมดแก้ไข (`listing` prop) ให้ 5.6 นำไปใช้ซ้ำได้
  - เพิ่ม `shared/guards/AuthGuard.tsx` (ตาม Dev Standard #10 ที่ระบุไว้แต่ยังไม่เคยสร้างจริง) ให้หน้า marketplace เช็ค login ธรรมดาโดยไม่ใช้ `PermissionGuard` ของฝั่ง admin
  - 🧪 test: กรอกครบ + อัปโหลดรูป + เพิ่ม pickup option 2 อัน → ส่งสำเร็จ → เห็นประกาศจริงใน `GET /api/me/listings` (status รอตรวจสอบ) ✅ ตรวจผ่าน Playwright end-to-end จริง (เบราว์เซอร์จริง ไม่ใช่ mock)
  - 📝 commit: `feat(web): implement phase 5 list-item and my-listings pages`

  - [x] FIX #1 (พบระหว่างทดสอบ E2E): รูปสินค้าที่อัปโหลดขึ้น 404 ทุกครั้งบนหน้าเว็บ (ทั้งในฟอร์มแก้ไขและ My Listings) — เพราะ API คืน URL แบบ relative (`/uploads/products/...`) ซึ่ง `<img src>` เอาไป resolve กับ origin ของหน้าเว็บเอง (`localhost:3001`) แทนที่จะเป็น origin ของ API ที่เสิร์ฟไฟล์จริง (`localhost:4001`) — บั๊กเดียวกันนี้แฝงอยู่ใน `ProductTable.tsx` (Admin > สินค้า) มาตั้งแต่ Phase 4.8 แต่ไม่เคยแสดงอาการเพราะตอนนั้นยังไม่มีสินค้าจริงในระบบเลย | before: `<img src={url}>` ตรงๆ → after: เพิ่ม `constants/index.ts::API_ORIGIN` (ตัด `/api` ออกจาก `API_BASE_URL`) + `shared/lib/utils.ts::resolveUploadUrl()` แล้วใช้ทั้ง 3 จุด (`ListItemForm`, `MyListingsTable`, `ProductTable`)
    - 🧪 test: Playwright E2E ก่อนแก้ → เห็น 404 ใน network log ของรูปที่เพิ่งอัปโหลด | หลังแก้ → รูปโหลดสำเร็จทั้งในฟอร์มแก้ไขและตาราง My Listings/Admin Products ✅
    - 📝 commit: รวมอยู่ใน `feat(web): implement phase 5 list-item and my-listings pages`

  - [x] FIX #2 (พบระหว่างใช้งานจริงหลัง Phase 6): กดปุ่ม "ลงประกาศให้เช่า" จากหน้าแรกตอนยังไม่ login → เปิด `LoginModal` → login สำเร็จ (โดยเฉพาะด้วยบัญชี admin) → หายไปเฉยๆ ไม่ไปต่อที่ `/list-item` เพราะ `LoginForm` มี logic เดิมที่บังคับ `router.push("/users")` ทันทีที่ role เป็น admin โดยไม่สนใจว่าผู้ใช้ตั้งใจจะไปที่ไหน (ทับ modal แม้จะปิดแล้ว) — ผู้ใช้ต้องการให้ login "ที่หน้า home page" ไม่ต้องพาไปหน้าแอดมินอัตโนมัติ สลับไปแอดมินทีหลังเองผ่านปุ่ม "แผงแอดมิน"/"ไปหน้าแอดมิน" ที่มีอยู่แล้วพอ | before: `LoginForm` เช็ค `isAdmin` แล้ว `router.push("/users")` เสมอ, `LoginModal` รับแค่ `onClose` (ใช้เป็น `onSuccess` ของ `LoginForm` ด้วย) → after: ลบ auto-redirect ไปแอดมินออกทั้งหมดจาก `LoginForm` (ยังคงโหลด `RolePermission` ให้ admin เหมือนเดิม แค่ไม่บังคับ navigate), เพิ่ม `LoginModal` prop `onSuccess` แยกจาก `onClose`, เพิ่ม `postLoginRedirect` state ใน `Header.tsx` — `goToListItem()` ตอนไม่ได้ login จะจำ `ROUTES.listItem` ไว้แล้วส่งต่อให้ `handleLoginSuccess()` พาไปหลัง login สำเร็จ (ปุ่ม login เฉยๆ ใน dropdown ไม่ตั้งค่านี้ ก็เลยแค่ปิด modal ตามเดิม)
    - 🧪 test: Playwright — คลิก "ลงประกาศให้เช่า" ตอนไม่ login (บัญชี admin) → login → landed บน `/list-item` จริง (ไม่ใช่ `/users`) ✅ | login ผ่านปุ่ม "เข้าสู่ระบบ" เฉยๆ ใน dropdown (บัญชี admin) → อยู่หน้าแรกเดิม ไม่ถูกพาไป `/users` ✅
    - 📝 commit: `fix(web): stop auto-redirecting admin logins to admin panel, continue to intended page instead`

  - [x] FIX #3 (พบระหว่างเทียบกับ prototype): `ListItemForm` เขียนขึ้นเองใน 5.5 ตอนแรกไม่ได้ตรงกับ layout/ข้อความจริงใน `Prototype เว็บ C2C/LOOP Home.dc.html` (kicker/title/subtitle ผิด, ไม่มี ฿ prefix ในช่องราคา, ไม่มี fake map preview, pickup option เป็น pill chip แทนที่จะเป็น row list พร้อม toggle icon, หน้าสำเร็จมีปุ่มเดียวและข้อความไม่ตรง) — ผู้ใช้ขอให้ทำ "ตาม design" จริง จึงไปอ่าน markup ต้นฉบับจาก `LOOP Home.dc.html` (บรรทัด 396-494 และ dictionary บรรทัด 2036-2038) แทนการเดาจากภาพอย่างเดียว | before/after: kicker "ลงประกาศ"→"ลงประกาศใหม่", title "ลงประกาศให้เช่าสินค้าใหม่"→"ลงขายสินค้าของคุณ" (คำในเว็บจริงของ prototype เอง แม้จะฟังดูเหมือน "ขาย" ก็ตาม), เพิ่ม subtitle, รูปภาพ label "รูปสินค้า"→"รูปภาพ" + สูง 140px→220px + placeholder "เพิ่มรูปสินค้า"→"Add a photo" (ตรงตาม prototype ที่ hardcode อังกฤษ), ราคา label "ราคา/วัน (บาท)"→"ราคาต่อวัน" พร้อมเพิ่ม ฿ prefix ในกรอบเดียวกับ input, หมวดหมู่ default "เลือกหมวดหมู่"→"—", pickup label "จุดรับสินค้า"→"สถานที่นัดรับ" + เปลี่ยนจาก pill chip เป็น bordered row (ไอคอนถูกสีน้ำเงินแทน checkbox จริงเพราะระบบไม่มี state toggle จริง แค่ add/remove), เพิ่ม fake map preview (CSS dot-grid + pin SVG + badge "ตัวอย่างแผนที่" เหนือช่อง location — เป็นแค่ตกแต่ง CSS ไม่ใช่แผนที่จริง ไม่ผิด Dev Standard ที่เลื่อนแผนที่จริงไป Phase ถัดไป), หน้าสำเร็จ title "ส่งประกาศสำเร็จ! รอตรวจสอบ"→"ส่งประกาศแล้ว!" + body ตรงตาม prototype (สลับ "LOOP"→"renty") + เพิ่มปุ่ม "กลับหน้าแรก" (เดิมมีแค่ "ลงประกาศเพิ่ม")
    - 🧪 test: Playwright screenshot เทียบกับภาพ prototype ทีละจุด (ฟอร์มว่าง, มี pickup row, หน้าสำเร็จ) → ตรงกันทั้ง layout และข้อความ (สีเป็น brand blue ตาม Phase 6 ไม่ใช่สีดำของ prototype ซึ่งถูกต้องแล้ว) ✅ | `npm run build --workspace=apps/web` ผ่าน ✅
    - 📝 commit: `fix(web): match list-item form layout and copy to prototype design`

- [x] 5.6 Web: หน้า My Listings (`modules/products/components/MyListingsTable.tsx`, route `app/(marketplace)/my-listings/page.tsx`)
  - รายการประกาศของฉัน + ปุ่มพัก/เริ่มใหม่ (ซ่อนเมื่อยัง `UNDER_REVIEW`) + ปุ่มแก้ไข (เปิด `ListItemForm` เดิมในโหมดแก้ไขผ่าน modal overlay ตาม pattern เดียวกับ `LoginModal`) + ปุ่มลบ (มี `confirm()` ก่อนลบจริง)
  - 🧪 test: พัก/เริ่มใหม่/ลบ ทำงานถูกต้อง ✅ | แก้ไขประกาศแล้วข้อมูลอัปเดตจริงในตาราง ✅ | ปุ่มพัก/เริ่มใหม่ไม่แสดงขณะ `UNDER_REVIEW` ✅ ตรวจผ่าน Playwright end-to-end จริง (สร้าง → แก้ไข → จำลองอนุมัติ → พัก → เริ่มใหม่ → ลบ ครบวงจร)
  - 📝 commit: รวมอยู่ใน `feat(web): implement phase 5 list-item and my-listings pages`

  - [x] FIX #4 (พบระหว่างเทียบกับ prototype ต่อจาก FIX #3): `MyListingsTable` เขียนเองใน 5.6 ตอนแรกก็ไม่ตรงกับ layout ต้นฉบับเช่นกัน (ไม่มี kicker/subtitle/ปุ่มลงประกาศเพิ่มด้านบน, ไม่มี tab bar, badge สีไม่ตรง, ปุ่มลบเป็นข้อความแทนไอคอนถังขยะ) — อ่าน markup จริงจาก `LOOP Home.dc.html` บรรทัด 636-706 (ส่วน `hasListingsPage`) และ dictionary บรรทัด 2078-2083 | before/after: เพิ่ม kicker "รายการของคุณ" + subtitle "จัดการสินค้าที่คุณลงประกาศให้เช่า" + ปุ่ม "ลงประกาศให้เช่า" มุมขวาบน (ลิงก์ไป `/list-item`), เพิ่ม tab bar แบบ pill ("รายการสินค้า" ใช้งานได้ / "ออเดอร์" ปิดใช้งานพร้อมป้าย "เร็วๆ นี้" — **ไม่ทำ tab ออเดอร์จริงเพราะยังไม่มี Rental model/API เลย ทำแค่ UI ปุ่มปิดไว้ก่อนเพื่อไม่ทำฟีเจอร์ที่ยังไม่มี backend รองรับ ตาม pattern เดียวกับ AdminSidebar disabled nav**), status badge ใช้สี/ข้อความตรงตาม prototype เป๊ะ (ใช้งาน=`#178a5a`, รอตรวจสอบ=`#a8752f`, หยุดชั่วคราว=`rgba(10,10,10,.55)`), ปุ่มลบเปลี่ยนจากข้อความ "ลบ" เป็นไอคอนถังขยะสีส้ม `#c96442` (สีเดียวกับที่ใช้แสดง badge admin อยู่แล้วในโปรเจกต์ ไม่ใช่สีใหม่), แถวสินค้าเปลี่ยนจาก card แยกกันเป็น bordered list ต่อเนื่องในกรอบเดียว (ตรงตาม prototype) — คงปุ่ม "แก้ไข" ไว้เพิ่มจากของเดิมเพราะเป็นฟีเจอร์จริงที่ทำแล้วใน 5.6 แม้ prototype (mock static) จะไม่มีปุ่มนี้ก็ตาม
    - 🧪 test: Playwright screenshot เทียบกับภาพ prototype ทั้ง 3 สถานะ (รอตรวจสอบ/ใช้งาน/หยุดชั่วคราว) → layout, สี badge, ปุ่ม ตรงกันหมด ✅ | `npm run build --workspace=apps/web` ผ่าน ✅ | `npm test --workspace=apps/api` ยัง 58/58 ผ่าน (ไม่ได้แตะ API) ✅
    - 📝 commit: `fix(web): match my-listings page layout to prototype design`

- [x] 5.7 Auto test: ครอบคลุม create → upload image/pickup options → pause/resume → edit → delete ครบวงจร + ownership 403 ทุก endpoint
  - 🧪 test: `npm test --workspace=apps/api` → **58/58 ผ่าน** (เพิ่ม `product.test.ts` 17 เคสใหม่ ครอบคลุม create/update/status/delete/images/pickup-options/me-listings รวม 403 ownership ทุก endpoint) ✅
  - 📝 commit: `feat(api): implement phase 5 product listing lifecycle for owners`

---

### Phase 6 — Rebrand เป็น "renty" (Corporate Identity)

> ที่มา: CI board 2 ภาพที่ผู้ใช้ให้มา (`apps/web/public/img/messageImage_1784102757687.jpg` = โลโก้/สี/ฟอนต์/มาสคอต, `messageImage_1784103039520.jpg` = ลายเส้นโซเชียล/พื้นหลัง/ไอคอน) — เป็น **การเปลี่ยนชื่อผลิตภัณฑ์เต็มรูปแบบ** จาก "LOOP" เป็น **"renty"** (ไม่ใช่แค่เปลี่ยนสี) ตามที่ยืนยันกับผู้ใช้แล้ว
>
> **ขอบเขต:** ใช้เฉพาะฝั่ง **Marketplace** เท่านั้น (Header, Home, Signup/Login modal, List Item, My Listings) — **Admin panel ไม่แตะ** ยังคงธีม Ant Design เข้ม/sidebar เดิมตามที่ผู้ใช้เลือกไว้ (ยกเว้นฟอนต์ body ที่เป็น global infra ใน `app/layout.tsx` เลยได้ผลไปทั้งแอปด้วย — ไม่ใช่การเปลี่ยนสี/โลโก้ จึงไม่ผิดขอบเขตที่ตกลงไว้)
>
> **บล็อกเกอร์ที่แก้แล้ว:** ภาพ 2 ไฟล์ที่มีอยู่เป็น "CI presentation board" ไม่ใช่ไฟล์โลโก้พร้อมใช้ — แก้โดย **crop เองจากภาพ presentation ด้วย `sharp`** (primary logo, app icon, favicon mark) แล้วลบพื้นหลังด้วยการทำ near-white pixel ให้โปร่งใส — คุณภาพเป็น raster ไม่ใช่ vector (เป็น placeholder ตามที่แจ้งไว้ ถ้ามีไฟล์ต้นฉบับจริงควรเปลี่ยนทีหลัง)
>
> **ฟอนต์:** ใช้ **Prompt** (secondary font ในภาพ, Google Font รองรับไทย) แทน Noto Sans Thai เดิมทั่วทั้งแอป — "Renty Rounded" เป็นแค่ font ที่ใช้ทำ wordmark ในภาพโลโก้ (บาก็ฝังเป็นภาพนิ่งอยู่แล้ว ไม่ต้อง source แยก) ส่วน Archivo (headline) คงไว้เหมือนเดิม

- [x] 6.1 เตรียม brand assets
  - Crop จาก CI board ด้วย `sharp` (ตัดพื้นหลังด้วย near-white→transparent pixel processing): primary logo (icon+wordmark, ไม่มี tagline สำหรับ header), primary logo แบบเต็ม (มี tagline), favicon mark (หัวหมา 2 ตัว)
  - เพิ่ม `apps/web/public/brand/renty-logo.png`, `renty-logo-full.png` + `apps/web/app/icon.png`, `apps/web/app/apple-icon.png` (ใช้ Next.js App Router convention แทน `favicon.ico` แบบ manual — auto-wire เข้า metadata ให้เอง)
  - 🧪 test: `npm run build --workspace=apps/web` → เห็น route `/icon.png`, `/apple-icon.png` ถูกสร้างอัตโนมัติ ✅ | เปิดเว็บจริงผ่าน Playwright → favicon/logo ขึ้นในแท็บและ header จริง ✅
  - 📝 commit: `feat(web): implement phase 6 renty rebrand (assets, tokens, header, forms)`

- [x] 6.2 Design tokens: สี + ฟอนต์
  - เพิ่ม `theme.extend.colors.brand` ใน `tailwind.config.ts`: `{ 50: "#FFF7EB", 100: "#F2F7FD", 200: "#DAE8F7", 400: "#6FA3D8", 600: "#2D5DA8" }`
  - เปลี่ยน `next/font/google` ใน `app/layout.tsx`: `Noto_Sans_Thai` → `Prompt` (คง `Archivo` ไว้สำหรับ headline) — เปลี่ยนชื่อ CSS variable `--font-noto-thai` → `--font-prompt` ใน `globals.css` ให้ตรงกับของจริง (ไม่ใช่แค่เปลี่ยน font แต่ปล่อยชื่อ variable เดิมค้างไว้ให้สับสน)
  - 🧪 test: `npm run build --workspace=apps/web` ผ่าน ✅ | ตรวจผ่าน Playwright screenshot เห็น glyph ไทยเปลี่ยนไปจริง (Prompt แตกต่างจาก Noto Sans Thai ชัดเจนที่ตัว ก/ถ) ✅
  - 📝 commit: รวมอยู่ใน `feat(web): implement phase 6 renty rebrand (assets, tokens, header, forms)`

- [x] 6.3 เปลี่ยนชื่อผลิตภัณฑ์ในจุดที่ผู้ใช้เห็น (marketplace + เอกสาร)
  - `app/layout.tsx` metadata title/description → "renty" ✅
  - หัวเอกสาร CLAUDE.md (บรรทัดแรก + เพิ่มหมายเหตุอธิบายการเปลี่ยนชื่อ) — ไม่ไล่เปลี่ยนทุกจุดที่พิมพ์ "LOOP" ทั้งไฟล์ (เสี่ยง diff บวมไม่จำเป็น) แค่หัวเอกสาร ✅
  - **หมายเหตุ:** ห้ามเปลี่ยนชื่อ npm workspace package (`@loop/db`, `@loop/api`, `@loop/web`) และชื่อโฟลเดอร์ `LOOP/` เพราะเป็นรายละเอียด internal ไม่ใช่สิ่งที่ผู้ใช้ปลายทางเห็น เปลี่ยนแล้วมีแต่ทำให้ import path พังทั้ง repo โดยไม่ได้ประโยชน์
  - **ปรับจากแผนเดิม:** `Settings.platformName` ยังไม่มีให้แก้ เพราะ `Settings` model ยังไม่ถูกสร้างจริง (รอ Phase 4.10 "รอ Settings model") — ข้ามจุดนี้ไปก่อน แล้วค่อยตั้ง default เป็น "renty" ตอนสร้าง model จริง
  - 🧪 test: เปิดแท็บเบราว์เซอร์ → title แสดง "renty — Peer-to-Peer Rental Marketplace" ✅
  - 📝 commit: `chore: rename product to renty in user-facing surfaces`

- [x] 6.4 Restyle Header/Navbar
  - แทนที่ wordmark ข้อความ "LOOP." ด้วยภาพโลโก้ renty จาก 6.1 (`next/image`)
  - เปลี่ยนปุ่ม/border/nav-active สีดำ (`#0a0a0a`) เป็นโทนน้ำเงิน brand (`#2D5DA8` primary) ทั่ว Header: announcement bar, nav link สี, EN/TH toggle, ปุ่ม "ลงประกาศให้เช่า", ไอคอน Saved, badge, avatar circle — คงสีดำไว้เฉพาะจุดที่เป็น body text ทั่วไปตาม pattern ที่ CI เองก็ใช้ (บทความ/label ใช้สีดำ, สีน้ำเงินสงวนไว้กับ headline/accent)
  - 🧪 test: Playwright screenshot หน้าแรกจริง → โลโก้/สีตรงกับ CI board, `console --errors` เหลือแค่ 404 ของ `/shop` prefetch (route ที่ยังไม่มีอยู่แล้วตั้งแต่ก่อน Phase นี้ ไม่เกี่ยวกับ rebrand) ✅
  - 📝 commit: รวมอยู่ใน `feat(web): implement phase 6 renty rebrand (assets, tokens, header, forms)`

- [x] 6.5 Restyle Signup/Login modal/List Item/My Listings
  - สลับปุ่มหลัก/toggle/focus ring สีดำ → `brand-600`/`#2D5DA8` ใน `SignupForm`, `SignupPage` (หน้าสำเร็จ), `LoginForm`, `LoginModal`, `OtpStep`, `ListItemForm` (รวมหน้าสำเร็จ "ส่งประกาศสำเร็จ!" ที่เปลี่ยนจาก emerald เป็น `brand-100`/`brand-600`)
  - เปลี่ยนข้อความ "LOOP" → "renty" ทุกจุดที่ผู้ใช้เห็นจริงในหน้าเหล่านี้ (หัวข้อฟอร์ม, หน้าสำเร็จ)
  - 🧪 test: Playwright screenshot หน้า Signup/Login จริง → ปุ่ม/toggle เป็นน้ำเงิน brand, ข้อความแสดง "renty" ✅ | `npm run build --workspace=apps/web` ผ่าน ✅ | Admin panel (`/users`) ตรวจผ่าน Playwright ยืนยันว่าไม่ถูกแตะต้อง ยังเป็น dark sidebar "LOOP. Admin" เดิมตามขอบเขตที่ตกลง ✅
  - 📝 commit: `feat(web): implement phase 6 renty rebrand (assets, tokens, header, forms)`

---

### Phase 7 — Migrate API → Elysia.js + Bun และเพิ่ม Pagination

> **ที่มา:** Load test เซิร์ฟเวอร์จริง (34.143.177.158) พบ `GET /api/products` ตันที่ ~300 req/sec โดย latency วิ่งขึ้นเป็นเส้นตรงตาม concurrency (single-process saturation ไม่มี error). ไล่หาสาเหตุเจอว่า `product.repository.ts::findActivePublic()` **ไม่มี pagination เลย** — ดึงและ join สินค้า ACTIVE ทุกแถวทุก request ทั้งที่ตาราง "API Endpoints" ด้านบน spec ไว้ว่า `GET /api/products` รับ `page` param ได้ แต่ไม่เคย implement. ผู้ใช้ตัดสินใจ **ทำทั้งคู่พร้อมกัน**: migrate framework Express→Elysia+Bun (เร็วขึ้นที่ HTTP layer) + แก้ pagination (คอขวดจริง) ในงานเดียว เพราะ routes/controllers ต้อง rewrite อยู่แล้ว.
>
> **กลยุทธ์:** ทำบน branch `feat/bun-elysia-migration` เดียว port ครบก่อน merge — `main` + image ที่ deploy อยู่ไม่ถูกแตะจนกว่าจะ merge → server จริงไม่มีความเสี่ยงระหว่างทำ. Repositories(6)+services(8) portable ~90% verbatim (ไม่ import Express-specific), ที่ rewrite จริงคือแค่ HTTP glue ~24 ไฟล์ (routes/controllers/middleware/bootstrap).
>
> **2 Checkpoint ในตัว branch** (แยกปัญหา framework ออกจาก feature): **A = framework parity** (Elysia รันได้ + test เดิม 58 เคสผ่านใต้ `bun test` โดยยังไม่แตะ pagination) → **B = pagination** (ใส่ทับตอน Elysia นิ่งแล้ว).
>
> **⚠️ ความเสี่ยงสูงสุด (auth):** `Bun.password.verify()` ต้อง verify hash เดิม (`$2b$...` จาก native bcrypt) ได้โดยไม่ reset password — **ต้องพิสูจน์ด้วยการ login `admin@loop.dev`/`Admin123!` จริงบน Bun ก่อน cutover** ไม่ใช่เขียนโค้ดแล้วเดา (test ปกติจับไม่ได้เพราะสร้าง user ใหม่ที่ hash ด้วย Bun.password อยู่แล้ว). ข้อควรระวัง: `$2a$` hash (จาก `bcryptjs` คนละ lib) มีรายงาน verify fail ใต้ Bun — โปรเจกต์ใช้ native bcrypt (`$2b$`) ไม่น่าโดน แต่ยืนยันก่อน.
>
> **หมายเหตุ prerequisite:** ต้องติดตั้ง Bun ก่อน (ยังไม่มีบนเครื่อง dev) — Phase 7.0 spikes ทั้งหมดต้องมี Bun ถึงรันได้.

- [ ] 7.0 Spikes — de-risk ก่อน commit ทำ port เต็ม (ทุกข้อต้องผ่านก่อนไป 7.1)
  - ติดตั้ง Bun (`irm bun.sh/install.ps1 | iex`) → ยืนยัน `bun --version`
  - spike bcrypt: `Bun.password.verify()` กับ `$2b$` hash จริงจาก seed (`admin@loop.dev`) → verify ผ่าน
  - spike Prisma: `import @loop/db` แล้ว query ได้ใต้ `bun run` (Prisma โหลด native query-engine binary ได้)
  - spike build: `bun build --target=bun` + `--external @prisma/client --external @loop/db` → bundle รัน + หา engine binary เจอ
  - 🧪 test: 4 spike ผ่านครบ (ถ้า Prisma โหลดไม่ได้ใต้ Bun → ทบทวนทั้งแผนใหม่ก่อนไปต่อ)
  - 📝 commit: `chore(api): verify bun+prisma+bun.password compatibility spikes`

- [ ] 7.1 Elysia app skeleton + middleware → plugins (`apps/api/src/plugins/`)
  - `plugins/auth.ts` (`.derive({as:"scoped"})` set `user`, throw→onError), `plugins/requireRole.ts` (`beforeHandle` factory), `plugins/validate.ts` (wrap Zod `.parse()` ใน `beforeHandle` — เก็บ pattern เดิม schema ไม่ต้องแก้), `plugins/upload.ts` (`t.File`/`t.Files`+`Bun.write()` แทน multer, validate mime/size ใน schema — `MulterError` branch หายไป), `plugins/errorHandling.ts` (`.onError()` รักษา order ZodError→HttpError→500 + shape `{error:[{field,message}]}`)
  - `app.ts` ใหม่ (`new Elysia()`, `@elysiajs/cors`, `@elysiajs/static` แทน `express.static`), `index.ts` ใหม่ (validateEnv ก่อน import `@loop/db` — Bun/ESM equivalent ของ trick `require()` เดิม), ลบ `types/express.d.ts` + `middleware/*` เดิม
  - `utils/errors.ts` port verbatim (ไม่มี Express dependency)
  - **⚠️ verify:** Elysia plugin scoping (`local`/`scoped`/`global`) เปลี่ยนข้าม 1.x minor — เช็ค docs เวอร์ชันที่ติดตั้ง
  - 🧪 test: `bun run` เปิด server ได้, `GET /api/health` → 200
  - 📝 commit: `feat(api): elysia app skeleton with ported middleware plugins`

- [ ] 7.2 Rewrite routes/controllers ทีละไฟล์ (เล็กก่อน) — **ยังไม่ใส่ pagination**
  - ลำดับ: health → auth/category/role/rolePermission/me → user (single upload) → product (multi upload, port `findActivePublic` signature เดิมไว้ก่อน) → admin (auth+requireRole composition)
  - `req.user!.xxx` (~20 จุด) → `ctx.user.xxx` (typed จาก derive, ไม่ต้อง `!`)
  - รักษา envelope `{ data, message: "ok" }` + 201 สำหรับ create เป๊ะ (test assert อยู่)
  - 🧪 test: manual curl ทุก endpoint ตอบ shape เดิม
  - 📝 commit: `feat(api): port all routes and controllers to elysia`

- [ ] 7.3 Test runner Jest → `bun test` (**Checkpoint A**)
  - `bunfig.toml` `[test] preload` (แทน Jest `setupFiles`), `tests/testApp.ts` (boot `app.listen(0)` ephemeral port ต่อไฟล์)
  - `request(app)` → `request(baseUrl)` ทุกไฟล์ (`helpers.ts` + 7 `*.test.ts`) — find/replace ไม่ใช่แก้ logic
  - ลบ `jest.config.js`/`tsconfig.test.json`, package.json: `"test":"bun test"`, ลบ `jest`/`ts-jest`/`@types/jest`, เก็บ `supertest`
  - 🧪 test: `bun test` → **58 เคสเดิมผ่านครบ โดยยังไม่แตะ pagination behavior** ✅
  - 📝 commit: `test(api): migrate jest to bun test runner`

- [ ] 7.4 bcrypt → `Bun.password`
  - `auth.service.ts` swap 4 จุด (login/register/requestOtp/verifyOtp): `Bun.password.hash(pw,{algorithm:"bcrypt",cost:10})` / `Bun.password.verify()`
  - `packages/db/prisma/seed.ts` swap ด้วย (ลบ native dep ออกทั้ง monorepo, รันผ่าน `bun run`)
  - ลบ `bcrypt`/`@types/bcrypt` จาก `apps/api` + `packages/db`
  - 🧪 test: `bun test` ผ่าน + **login ด้วย hash จริงเดิมของ `admin@loop.dev` ผ่าน** (spike 7.0 ยืนยันซ้ำกับ data จริง)
  - 📝 commit: `refactor(api): replace bcrypt with Bun.password (backward-compatible hashes)`

- [ ] 7.5 Pagination — backend (**Checkpoint B**)
  - `apps/api/src/schemas/pagination.schema.ts`: `paginationSchema` (`page` default 1, `pageSize` default 24 max 100, `z.coerce.number`)
  - `product.repository.ts::findActivePublic(filters, {page,pageSize})`: แยก `where` เป็น const ใช้ร่วม, คืน `{rows,total}` ผ่าน `Promise.all([findMany({skip,take}), count])` — ปรับ service/controller ตาม
  - `user.repository.ts::findAll({page,pageSize})`: pattern เดียวกัน (admin users) — ปรับ service/controller ตาม (coupled กับ 7.6 `UserTable.tsx`)
  - envelope: `{ data, message:"ok", total, page, pageSize }`
  - 🧪 test: เพิ่มเคส pagination ใน `product.test.ts` (`total`/`page`/`pageSize` มีจริง, `data.length <= pageSize`) → `bun test` ผ่าน
  - 📝 commit: `feat(api): add pagination to product and admin-user list endpoints`

- [ ] 7.6 Pagination — frontend
  - `apps/web/types/index.ts`: เพิ่ม `message: string` ใน `PaginatedResponse<T>`
  - `productsApi.ts::getProducts` + `adminApi.ts::getUsers`: รับ `page`/`pageSize`, return `PaginatedResponse`
  - `UserTable.tsx`: **บังคับ** เปลี่ยนจาก fetch-all + client-side paginate เป็น server-driven (เรียก API ทุกครั้ง page เปลี่ยน, `total` จาก API) — ต้องลงพร้อม backend 7.5
  - `HomePage.tsx` **B+C** (ยืนยันแล้ว): load more (page=1/pageSize=24 + ปุ่ม "โหลดเพิ่ม" append) + server-side search (พิมพ์ค้นหา/เลือกหมวด → re-query `q`/`category` reset page=1); แทน `countByCategory` client-side ด้วย `_count.products` จาก API (มีอยู่แล้ว ไม่ต้องมี endpoint ใหม่); ลบ filter in-memory
  - 🧪 test: Playwright — หน้าแรกโหลดสินค้า + "โหลดเพิ่ม" + ค้นหา/เลือกหมวดทำงาน, admin users เปลี่ยนหน้าได้ | `npm run build --workspace=apps/web` ผ่าน
  - 📝 commit: `feat(web): server-driven pagination for home and admin users`

- [ ] 7.7 Docker + cutover
  - `apps/api/Dockerfile` ใหม่: base `oven/bun:1-alpine` ทุก stage, เก็บ `apk add openssl` (Prisma engine), `bun build --target=bun` (ไม่ต้อง tsc), CMD `["bun","run","dist/index.js"]` — **⚠️ spike:** อาจต้อง `--external @prisma/client @loop/db` + smoke test bundle หา engine เจอ
  - `docker-compose.yml`: ไม่ต้องแก้ functional (env/port/depends_on เดิม)
  - Tag last-known-good main image ก่อน cutover (rollback = rebuild+restart ระดับนาที); DB schema ไม่ถูกแตะทั้ง phase → rollback ไม่มี data-migration พันกัน
  - 🧪 test: `docker compose build api` + `up` local stack (Postgres จริง) → login seeded admin จริง + `GET /api/products` มี pagination | load test ซ้ำเทียบ before/after | หลัง deploy: verify health + login + product-list, เฝ้า rollback path ชั่วโมงแรก
  - 📝 commit: `build(api): switch to bun+elysia docker image and cut over`