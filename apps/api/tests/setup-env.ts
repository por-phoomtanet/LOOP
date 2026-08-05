// บังคับให้ bun test ต่อ database แยก (loop_test) เสมอ ไม่ว่า .env ที่โหลดมาจะตั้ง DATABASE_URL
// เป็นอะไรก็ตาม — กันไม่ให้ test สร้างขยะปนกับ dev database จริงที่เปิดดูผ่าน Prisma Studio
// (เคยเกิดปัญหานี้มาแล้วหลายรอบ) ต้องสร้าง database นี้ + รัน migrate deploy ใส่ครั้งแรกเองก่อน
// (ดู CLAUDE.md Dev Standard #26) — hardcode ตรงๆ แทนอ่านจาก process.env.DB_USER/DB_PASSWORD
// เพราะ bunfig.toml preload รันก่อน --env-file inject ค่าเข้า process.env เสร็จ (อ่านไม่ทันจริง)
process.env.DATABASE_URL =
  "postgresql://loop:727edf5e4001d5a881ff607c@localhost:5433/loop_test?schema=public";
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.JWT_SECRET ??= "test-secret";
