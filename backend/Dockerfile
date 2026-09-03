FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY package.json package-lock.json ./
RUN pnpm import && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]
