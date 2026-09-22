# ------------------------------------------------------------------------------
# Fase 1: Build (pnpm + compilación estricta de TypeScript a JavaScript)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Activar pnpm mediante corepack (sin npm y con versión fija)
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate

# Toolchain requerida para compilar la dependencia nativa bcrypt
RUN apk add --no-cache python3 make g++

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Aprobar explícitamente solo los scripts de build auditados (bcrypt, esbuild)
# y convertir package-lock.json a pnpm-lock.yaml dentro de la imagen
RUN printf 'allowBuilds:\n  bcrypt: true\n  esbuild: true\n' > pnpm-workspace.yaml \
    && pnpm import \
    && pnpm install --frozen-lockfile

# Copiar configuración de TypeScript y código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript sin declaraciones .d.ts (no portables con pnpm) y podar
# devDependencies para dejar solo dependencias de producción
RUN pnpm exec tsc --declaration false --declarationMap false \
    && pnpm install --prod --frozen-lockfile

# ------------------------------------------------------------------------------
# Fase 2: Producción (runtime mínimo y seguro, sin npm ni pnpm)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifiesto, dependencias de producción ya compiladas y código compilado
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Quitar npm/corepack del runtime (las dependencias se gestionan con pnpm en build)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Seguridad: Ejecutar como usuario no-root 'node'
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
