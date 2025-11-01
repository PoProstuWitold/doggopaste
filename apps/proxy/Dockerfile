# --- Stage: base ---
FROM node:krypton-alpine AS base

ENV NODE_ENV=production \
    DOCKER=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PRIVATE_STANDALONE=1 \
    HOSTNAME="0.0.0.0" \
    TZ=Europe/Warsaw

RUN apk add --no-cache libc6-compat tzdata curl \
  && corepack enable pnpm \
  && npm install -g turbo pm2

# --- Stage: builder (turbo prune) ---
FROM base AS builder
WORKDIR /app
COPY . .

RUN turbo prune api --docker \
  && turbo prune web --docker \
  && turbo prune proxy --docker

# --- Stage: installer (deps + build) ---
FROM base AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ ./
COPY --from=builder /app/out/pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile

COPY --from=builder /app/out/full/ ./
RUN pnpm turbo run build --filter=api... --filter=web... --filter=proxy

# --- Stage: runner (final image) ---
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 doggo \
  && adduser --system --uid 1001 doggo

# api: Hono
COPY --from=installer --chown=doggo:doggo /app/apps/api/build ./apps/api/build
COPY --from=installer --chown=doggo:doggo /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=installer --chown=doggo:doggo /app/apps/api/package.json ./apps/api/package.json
COPY --from=installer --chown=doggo:doggo /app/apps/api/drizzle.config.ts ./apps/api/drizzle.config.ts
COPY --from=installer --chown=doggo:doggo /app/apps/api/src/db/schema.ts ./apps/api/src/db/schema.ts

# web: Next.js (standalone)
COPY --from=installer --chown=doggo:doggo /app/apps/web/.next/standalone ./
COPY --from=installer --chown=doggo:doggo /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=doggo:doggo /app/apps/web/public ./apps/web/public

# proxy: connect & finalhandler
COPY --from=installer --chown=doggo:doggo /app/apps/proxy/build ./apps/proxy/build
COPY --from=installer --chown=doggo:doggo /app/apps/proxy/node_modules ./apps/proxy/node_modules
COPY --from=installer --chown=doggo:doggo /app/apps/proxy/package.json ./apps/proxy/package.json

# global dependencies
COPY --from=installer --chown=doggo:doggo /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=installer --chown=doggo:doggo /app/package.json ./package.json
COPY --from=installer --chown=doggo:doggo /app/pnpm-lock.yaml ./pnpm-lock.yaml

COPY --chmod=755 apps/proxy/entrypoint.sh ./entrypoint.sh

USER doggo
EXPOSE 3002

# healthcheck
ENV HEALTHCHECK_URL=http://localhost:3002/api/health
HEALTHCHECK --interval=120s --timeout=10s --start-period=30s --retries=3 \
CMD curl --fail --silent --show-error "$HEALTHCHECK_URL" >/dev/null || exit 1

CMD ["./entrypoint.sh"]
