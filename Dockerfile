# --- Builder stage ---
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL for the build stage — Prisma's schema parser and Next.js'
# page-collection both require it to be a parseable URL, but no actual connection
# is made at build time. The real DATABASE_URL comes from Railway at runtime.
ENV DATABASE_URL="postgresql://build:build@build:5432/build?schema=public"
ENV JWT_SECRET="build-time-placeholder-overwritten-at-runtime"
RUN npx prisma generate
RUN npm run build

# --- Runner stage ---
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
