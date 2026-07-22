// ใช้ Bun.password แทน npm bcrypt (เลี่ยง native-binding บน Bun/Alpine)
// algorithm: "bcrypt" + cost 10 → output เป็น $2b$ format เดิม verify hash เก่าในฐานข้อมูลได้
// โดยไม่ต้อง reset password (ยืนยันแล้วใน spike 7.0 กับ hash จริงของ admin@loop.dev)
export function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plain, hash);
}
