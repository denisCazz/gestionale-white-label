FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable pnpm

# ─── Dipendenze ───────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Genera il client Prisma (non serve DATABASE_URL in questa fase)
RUN pnpm prisma generate
# Build Next.js (senza DATABASE_URL — le pagine sono tutte dinamiche)
RUN pnpm build

# ─── Runner ───────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia app compilata e dipendenze complete (serve prisma CLI + tsx per migrate/seed)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps    /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY messages ./messages
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]

