FROM node:20 AS builder

WORKDIR /aw3

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM gcr.io/distroless/nodejs:20

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

USER nonroot:nonroot

EXPOSE 3000

CMD ["build/index.js"]
