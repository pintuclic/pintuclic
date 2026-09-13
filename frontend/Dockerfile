# ------------------------------------------------------------------------------
# Fase 1: Build (Vue y TypeScript a JavaScript estático con Vite usando pnpm)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Activar pnpm mediante corepack (sin npm y con versión fija)
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Convertir package-lock.json a pnpm-lock.yaml e instalar de forma determinística
RUN pnpm import && pnpm install --frozen-lockfile

# Copiar archivos del proyecto (excluyendo lo indicado en .dockerignore)
COPY . .

# Inyección de variables de entorno para Vite en tiempo de compilación
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Compilación de producción de Vite (genera /app/dist)
RUN pnpm exec vite build

# ------------------------------------------------------------------------------
# Fase 2: Servidor Web Nginx de Producción
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine

# Configuración de Nginx para SPA (Vue Router HTML5 History Mode) y proxy API
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los assets estáticos compilados (HTML, JS y CSS listos para el navegador)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
