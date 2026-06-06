# CI image — a reproducible, pinned environment for the verification gate.
#
# Contains the full toolchain (vitest, eslint, prettier, tsc) so the pipeline can
# run lint, type-check, and tests against the exact Node 20 userland that the
# production image is built on. The build (`npm run build`) and tests run here,
# not on the host runner, which removes "works on the runner" drift.
#
# CI overrides the default CMD per job (e.g. `npm run lint`, `npm run typecheck`,
# `npm run test:coverage`). The default below runs the test suite.

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=test
ENV CI=true

CMD ["npm", "run", "test"]
