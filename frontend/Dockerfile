FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

COPY package.json package-lock.json ./
RUN pnpm import && pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
