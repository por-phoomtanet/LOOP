FROM oven/bun:1-alpine AS base
# openssl: Prisma query engine ต้องใช้ (schema targets linux-musl-openssl-3.0.x)
RUN apk add --no-cache openssl
WORKDIR /repo

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
RUN bun install --frozen-lockfile

FROM deps AS build
COPY packages/db packages/db
COPY apps/api apps/api
# generate prisma client (+ musl engine) และ build @loop/db → dist ที่ apps/api import
RUN cd packages/db && bunx prisma generate && bun run build

FROM base AS runner
WORKDIR /repo
ENV NODE_ENV=production
# ไม่ bundle — รัน source ตรงด้วย bun (ตัดสินใจจาก spike: externalize prisma แล้ว bundle ไม่ได้ประโยชน์)
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/db ./packages/db
COPY --from=build /repo/apps/api ./apps/api
EXPOSE 4000
CMD ["bun", "run", "apps/api/src/index.ts"]
