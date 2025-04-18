# --- Stage: base (Node.js v22 LTS Alpine) ---
FROM node:jod-alpine AS base
ENV NODE_ENV=production

RUN apk update \
  && apk add --no-cache libc6-compat postgresql-client \
  && npm install -g pnpm turbo pm2

# --- Stage: builder (prune) ---
FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune api --docker

# --- Stage: installer (deps + build) ---
FROM base AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ ./
RUN pnpm install
COPY --from=builder /app/out/full/ ./
RUN pnpm turbo build --filter=api...

# --- Stage: runner (final image) ---
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 doggo \
  && adduser --system --uid 1001 doggo \
  && mkdir -p .turbo && chown -R doggo:doggo .turbo

COPY --from=installer /app ./
COPY --chmod=755 apps/api/entrypoint.sh ./entrypoint.sh

USER doggo

CMD ["./entrypoint.sh"]
