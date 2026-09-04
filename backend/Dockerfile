# ------------------------------------------------------------------------------
# Fase 1: Build (Compilación estricta de TypeScript a JavaScript)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar configuración de TypeScript y código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript a JavaScript en el directorio dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Fase 2: Producción (Runtime mínimo y seguro)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifiestos
COPY package.json package-lock.json ./

# Instalar EXCLUSIVAMENTE dependencias de producción (sin devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Copiar código JavaScript compilado desde la fase builder
COPY --from=builder /app/dist ./dist

# Seguridad: Ejecutar como usuario no-root 'node'
USER node

EXPOSE 3000

# Ejecutar JavaScript nativo directamente con Node (cero sobrecarga en runtime)
CMD ["node", "dist/index.js"]
