# Development image — fast feedback, NOT optimised for size.
#
# Ships the full dependency set (including tsx, vitest, eslint) and runs the app
# under `tsx watch`. Intended to be driven by infra/docker-compose.yml, which
# bind-mounts ./src so host edits are visible inside the container.
#
# NOTE on hot reload: tsx reloads on filesystem change *events*, which do not
# propagate across a Docker Desktop bind mount when the repo lives on the Windows
# filesystem. On Windows, use `npm run dev` on the host for the fast edit loop;
# this image is for environment parity/onboarding. See infra/docker/README.md.
#
# This image is for LOCAL DEVELOPMENT ONLY. It is never the deployment artifact —
# see infra/docker/prod/Dockerfile for that.

FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached unless the manifests change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest as a fallback for running the image standalone (without a bind
# mount). When started via docker-compose, ./src is mounted over this copy.
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

CMD ["npm", "run", "dev"]
