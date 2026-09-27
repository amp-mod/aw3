# 1. BUILD STAGE
FROM node:24-slim AS builder
WORKDIR /app/aw3

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && pnpm prune --prod

FROM node:24-slim AS runner
WORKDIR /app/aw3

ENV NODE_ENV=production \
    PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --system --group aw3

COPY --chown=aw3:aw3 --from=builder /app/aw3/LICENSE ./
COPY --chown=aw3:aw3 --from=builder /app/aw3/build ./build
COPY --chown=aw3:aw3 --from=builder /app/aw3/package.json ./
COPY --chown=aw3:aw3 --from=builder /app/aw3/node_modules ./node_modules
COPY --chown=aw3:aw3 --from=builder /app/aw3/drizzle ./drizzle
COPY --chown=aw3:aw3 --from=builder /app/aw3/migrate.js ./migrate.js
COPY --chown=aw3:aw3 --from=builder /app/aw3/scripts ./scripts

RUN chmod +x ./scripts/*.sh

USER aw3
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) process.exit(1);})"

ENTRYPOINT ["/usr/bin/tini", "--", "/app/aw3/scripts/entrypoint.sh"]
CMD ["node", "build/index.js"]