FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001

# Create data directory for SQLite
RUN mkdir -p /data && chown -R bun:bun /data

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

USER bun
EXPOSE 3001

CMD ["bun", "start"]
