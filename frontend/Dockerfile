# ------------------------------------------------------------------------------
# Fase 1: Build (Compilación de Vue y TypeScript a JavaScript estático con Vite)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias mediante npm ci de forma determinística y rápida
RUN npm ci

# Copiar archivos del proyecto (excluyendo lo indicado en .dockerignore)
COPY . .

# Inyección de variables de entorno para Vite en tiempo de compilación
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Compilación de producción (vue-tsc y vite build) generando /app/dist
RUN npm run build

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
