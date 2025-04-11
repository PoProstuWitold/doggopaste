# --- Stage: base (Node.js v22 LTS Alpine) ---
FROM node:jod-alpine AS base

RUN apk update \
  && apk add --no-cache libc6-compat \
  && npm install -g pnpm turbo pm2

# --- Stage: builder (turbo prune) ---
FROM base AS builder
WORKDIR /app

COPY . .
RUN turbo prune web --docker

## --- Stage: installer (deps + build) ---
FROM base AS installer
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PRIVATE_STANDALONE=true
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_HONO_API_URL=http://localhost:3001

COPY --from=builder /app/out/json/ ./
RUN pnpm install

COPY --from=builder /app/out/full/ ./
RUN pnpm turbo build --filter=web...

# --- Stage: runner (final image) ---
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p .turbo/cache && chown -R nextjs:nodejs .turbo

# Next.js standalone output
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

COPY --chmod=755 apps/web/entrypoint.sh ./entrypoint.sh

USER nextjs

CMD ["./entrypoint.sh"]
