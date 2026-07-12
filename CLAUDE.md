# LOOP — Peer-to-Peer Rental Marketplace

แพลตฟอร์มให้เช่าสินค้าระหว่างบุคคล (P2P rental marketplace) แบบ C2C — ผู้ใช้นำของที่มีอยู่มาปล่อยเช่าเป็นรายวันแทนการขายขาด ทุกการเช่ามีเงินประกันความเสียหาย (refundable deposit) และผ่านการยืนยันตัวตน (KYC) รองรับ 2 ภาษา (ไทย/อังกฤษ) สกุลเงินบาท (฿) เอกสารนี้อ้างอิง scope จาก [`requirement.md`](./requirement.md) ซึ่งสรุปมาจาก prototype ใน `Prototype เว็บ C2C/`

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
| Signup + KYC | สมัครสมาชิก, OTP (email/phone), อัปโหลดบัตรประชาชน, ยืนยันใบหน้า (เริ่มจาก mock ก่อน ต่อ provider จริงภายหลัง) |
| Admin | Dashboard, Category CRUD, Users (approve/reject), Products (read-only), Payments, Settings |
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
