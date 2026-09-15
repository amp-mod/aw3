FROM node:24-slim AS builder
WORKDIR /app/aw3

RUN corepack enable

COPY . .
COPY ./.env.example ./.env
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm approve-builds --all && \
    pnpm install --frozen-lockfile --config.ignore-builds=fals
RUN pnpm run build
RUN pnpm prune --prod

FROM node:24-slim
WORKDIR /app/aw3

RUN adduser --system --group aw3

COPY --from=builder /app/aw3/LICENSE ./
COPY --from=builder /app/aw3/build ./build
COPY --from=builder /app/aw3/package.json ./
COPY --from=builder /app/aw3/node_modules ./node_modules

USER aw3
EXPOSE 3000

CMD ["node", "build/index.js"]
