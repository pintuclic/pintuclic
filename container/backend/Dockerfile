FROM node:22-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]