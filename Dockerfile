# syntax=docker/dockerfile:1
#
# Multi-stage build for the IGH Hannover website (Astro + @astrojs/node standalone).
# Result: a small image that runs `node ./dist/server/entry.mjs`, which serves the
# prerendered pages from dist/client and the /api/* routes.

ARG NODE_IMAGE=node:22-slim

# --- 1. Production dependencies only (needed at runtime by dist/server) --------
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# --- 2. Build ----------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# PUBLIC_* variables are inlined into the static pages at build time, so they
# must be present now. docker-compose passes the server's .env as a build
# secret; only its PUBLIC_* lines are exported. Secrets such as
# STRIPE_SECRET_KEY are read at runtime (env_file) and never enter the image.
# Without the secret (plain `docker build .`), the code defaults are used.
RUN --mount=type=secret,id=dotenv \
    if [ -f /run/secrets/dotenv ]; then \
      grep -E '^PUBLIC_[A-Za-z0-9_]*=' /run/secrets/dotenv | tr -d '\r' > /tmp/public.env; \
      set -a; . /tmp/public.env; set +a; \
    fi && \
    npm run build

# --- 3. Runtime --------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
WORKDIR /app
# Files stay owned by root (read-only for the app); the process runs as `node`.
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 4321) + '/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "./dist/server/entry.mjs"]
