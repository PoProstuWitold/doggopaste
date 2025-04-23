# --- Stage: base ---
FROM node:jod-alpine AS base
ENV NODE_ENV=production

RUN apk update \
  && apk add --no-cache libc6-compat postgresql-client \
  && npm install -g pnpm turbo pm2

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
RUN pnpm install

COPY --from=builder /app/out/full/ ./
RUN pnpm turbo run build --filter=api... --filter=web... --filter=proxy

# --- Stage: runner (final image) ---
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 doggo \
  && adduser --system --uid 1001 doggo \
  && mkdir -p .turbo && chown -R doggo:doggo .turbo

# Apps
# COPY --from=installer --chown=doggo:doggo /app/apps ./apps
# API
COPY --from=installer --chown=doggo:doggo /app/apps/api/build ./apps/api/build
COPY --from=installer --chown=doggo:doggo /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=installer --chown=doggo:doggo /app/apps/api/package.json ./apps/api/package.json
# WEB
COPY --from=installer --chown=doggo:doggo /app/apps/web/.next ./apps/web/.next
COPY --from=installer --chown=doggo:doggo /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=doggo:doggo /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=installer --chown=doggo:doggo /app/apps/web/package.json ./apps/web/package.json
# PROXY
COPY --from=installer --chown=doggo:doggo /app/apps/proxy/build ./apps/proxy/build
COPY --from=installer --chown=doggo:doggo /app/apps/proxy/node_modules ./apps/proxy/node_modules
COPY --from=installer --chown=doggo:doggo /app/apps/proxy/package.json ./apps/proxy/package.json
# Turborepo
COPY --from=installer --chown=doggo:doggo /app/node_modules ./node_modules
COPY --from=installer --chown=doggo:doggo /app/package.json ./package.json
COPY --from=installer --chown=doggo:doggo /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Entrypoint
COPY --chmod=755 apps/proxy/entrypoint.sh ./entrypoint.sh

USER doggo
EXPOSE 3002
CMD ["./entrypoint.sh"]
