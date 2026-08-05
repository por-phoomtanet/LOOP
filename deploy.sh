#!/usr/bin/env bash
# Deploy script — รันไฟล์เดียวจบ: pull โค้ดล่าสุด, apply migration ที่ค้างอยู่ทั้งหมด,
# แล้วค่อย rebuild+restart container ด้วยโค้ดใหม่ (เรียงแบบนี้เพื่อไม่ให้ api container
# ที่มี Prisma Client รุ่นใหม่ (จาก build) ไปชนกับ database ที่ schema ยังเก่าอยู่)
#
# ใช้ .env (ไม่ใช่ .env.prod) — .env บนเซิร์ฟเวอร์นี้คือค่า prod จริงอยู่แล้ว (ดู
# CLAUDE.md Dev Standard #26 หมายเหตุเรื่อง .env.prod เป็นแค่ template สำหรับ copy)
#
# รองรับ migration ใหม่โดยอัตโนมัติเสมอ — prisma migrate deploy apply ทุก migration
# ที่ยังไม่เคยรันบน database นี้ (เทียบกับ _prisma_migrations table) ไม่ต้องแก้ script นี้เลย
# แค่มี migration ใหม่ในโฟลเดอร์ packages/db/prisma/migrations/ ก็พอ
#
# วิธีใช้ (บนเซิร์ฟเวอร์):
#   chmod +x deploy.sh   (ครั้งแรกครั้งเดียว)
#   ./deploy.sh

set -euo pipefail
cd "$(dirname "$0")"

echo "==> [1/5] git pull"
git pull

echo "==> [2/5] npm install (เผื่อ package.json เปลี่ยน)"
npm install

echo "==> [3/5] build image ใหม่ (ยังไม่ restart container ที่รันอยู่)"
docker compose build

echo "==> [4/5] apply database migration ที่ค้างอยู่ทั้งหมด (ก่อน swap โค้ดใหม่เข้าไป)"
docker compose up -d db
npm run migrate:deploy

echo "==> [5/5] restart container ด้วย image ใหม่"
docker compose up -d

echo "==> เช็ค health"
sleep 3
PORT_VALUE=$(grep -E '^PORT=' .env | cut -d= -f2)
if curl -fsS "http://localhost:${PORT_VALUE}/api/health" > /dev/null; then
  echo "Deploy สำเร็จ — API ตอบ /api/health ปกติ"
else
  echo "⚠️  Deploy เสร็จแต่ /api/health ไม่ตอบ — เช็ค: docker compose logs api"
fi
