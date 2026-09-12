# Pintuclic - Frontend

Cliente web oficial para la plataforma **Pintuclic**.

## 🛠️ Stack Tecnológico

- **Framework:** Vue 3 (`<script setup lang="ts">`, Composition API)
- **Bundler:** Vite 8
- **Lenguaje:** TypeScript (Strict mode)
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Enrutamiento:** Vue Router 4
- **Cliente HTTP:** Axios (con interceptores centralizados en `src/core/api/axios.ts`)

## 🚀 Scripts Disponibles

```bash
# Servidor de desarrollo
npm run dev

# Compilación y verificación de tipos
npm run build

# Previsualización de producción
npm run preview
```

## 📖 Arquitectura y Guía de Estilos

Para detalles completos sobre la arquitectura modular (`m[xx]-[nombre-modulo]`), convenciones de diseño y directrices de Tailwind CSS para agentes y desarrolladores, consulta:
- [Documentación de Infraestructura Frontend](./infraestructura.md)
