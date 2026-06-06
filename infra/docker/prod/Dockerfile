# syntax=docker/dockerfile:1

# Production image — the deployable artifact referenced by the CD pipeline.
#
# Goals: small, reproducible, and safe to run. Achieved with a multi-stage build
# that compiles TypeScript in one stage, resolves production-only dependencies in
# another, and assembles a final runtime image that contains neither the compiler
# nor the dev/test toolchain. The runtime image runs as a non-root user.
#
# Runtime deps are only express + zod, so the final image is dominated by the
# node:20-alpine base (~50 MB compressed pull). Target: < 100 MB.

# ---- Stage 1: build (compile TS -> dist/) ----------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Full dependency install (dev deps needed for `tsc`). Cached on manifest hash.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: production dependencies only ---------------------------------
# Resolved separately so the runtime image never sees dev dependencies.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 3: runtime ------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# The base image bundles the npm CLI, whose own transitive deps (cross-spawn,
# glob, minimatch, tar) carry HIGH CVEs that Trivy flags. The runtime only ever
# invokes `node` (see CMD) — npm is never used here — so removing it cuts that
# attack surface entirely and clears the image scan.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# node:alpine ships a non-root `node` user (uid 1000). Own the files with it and
# drop privileges — a compromised process never runs as root.
COPY --from=deps    --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist         ./dist
COPY                --chown=node:node package.json       ./

USER node
EXPOSE 3000

# Uses Node 20's built-in fetch — no curl/wget needed in the image.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/infrastructure/server.js"]
