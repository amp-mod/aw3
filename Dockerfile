FROM node:24-alpine AS builder
WORKDIR /aw3-bundle

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM node:24-alpine
WORKDIR /aw3-bundle

RUN adduser -D -S aw3

COPY --from=builder /aw3-bundle/COPYING ./
COPY --from=builder /aw3-bundle/build ./build
COPY --from=builder /aw3-bundle/package.json ./
COPY --from=builder /aw3-bundle/node_modules ./node_modules

USER aw3
EXPOSE 3000

CMD ["node", "build/index.js"]