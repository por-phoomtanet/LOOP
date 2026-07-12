FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm install

FROM deps AS build
COPY packages/db packages/db
COPY apps/api apps/api
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/db ./packages/db
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
