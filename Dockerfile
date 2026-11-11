# Multi-stage Dockerfile for MockLab NestJS API
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

# Copy monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared library first
RUN pnpm --filter @mocklab/shared build

# Generate Prisma Client and build NestJS API
RUN pnpm --filter @mocklab/api exec prisma generate
RUN pnpm --filter @mocklab/api build

# Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl dumb-init

# Copy runtime artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001

USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/api/dist/main"]
