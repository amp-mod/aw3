FROM node:24-alpine AS builder
WORKDIR /aw3-bundle

COPY package.json pnpm-lock.yaml ./
RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM gcr.io/distroless/nodejs:20
WORKDIR /aw3-bundle

COPY --from=builder /aw3-bundle/LICENSE /aw3-bundle/LICENSE
COPY --from=builder /aw3-bundle/build /aw3-bundle/build
COPY --from=builder /aw3-bundle/package.json /aw3-bundle/package.json
COPY --from=builder /aw3-bundle/node_modules /aw3-bundle/node_modules

RUN useradd -m aw3
USER aw3

EXPOSE 3000

CMD ["build/index.js"]
