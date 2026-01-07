FROM node:24-alpine
RUN corepack enable
WORKDIR /aw3
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["node", "./build"]
