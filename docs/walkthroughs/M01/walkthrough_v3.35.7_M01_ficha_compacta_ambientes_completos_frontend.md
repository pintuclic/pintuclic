# Walkthrough v3.35.7 — Simulador de ambientes y ficha compacta

## 1. Metadatos
M01 Catálogo / Vistas Públicas, frontend. Versión v3.35.7 (PATCH de la ficha existente). Fecha: 2026-09-20. Responsable de consolidación: Codex, implementador frontend. Entrega parcial del detalle público, no cierre completo del módulo.

## 2. Historia y alcance
Ajuste asociado a HU-CAT-06: Consulta pública del catálogo. Para pinturas, la ficha alterna entre Simular en Ambientes y Ver Envase. El simulador recibe color, nombre y código de la variante seleccionada y permite cambiar entre sala, cocina, habitación, baño y fachada. Las muestras usan el color comercial mediante MuestraColor, sustituyendo los colores decorativos por índice.

Se consolida el estado final de los cambios locales de esta entrega en un único commit. Los borradores intermedios no se presentan como versiones publicadas.

## 3. Reglas y alcance del rol
Código y recursos exclusivamente en frontend/src/modules/m01-dashboardcatalogo, más el changelog y este walkthrough exigidos por las guías de versionado. Se consumen MuestraColor y tokens oficiales de core sin modificarlos. El color dinámico procede de la variante. No se agregan datos maestros, endpoints, DTOs inline ni dependencias.

No se incluyen cambios en Dockerfile, backend, base de datos, core, otros módulos ni docs/reviews. Los archivos ajenos al alcance conservan su estado local. Sin cambios a cuentas, permisos o payloads; las políticas HU-CUE-08, HU-ADM-03 y HU-SEG-06 no se reimplementan ni se declaran auditadas globalmente.

## 4. Implementación y verificación
- Ficha más compacta: max-w-6xl, dos columnas iguales en escritorio, gap-6 y sm:p-5.
- Cinco PNG RGBA de 1024 × 1024 dentro de assets/ambientes de M01. Se conserva el estado local actual de los recursos, incluido el baño nuevo.
- El visor actual usa aspect-square, ancho completo y altura máxima de 384 px; la imagen usa object-cover y fondo del color seleccionado. El límite de altura puede producir recorte cuando el ancho supera 384 px: no se afirma que la imagen se vea siempre completa ni que la caja sea cuadrada en todos los tamaños.
- Selectores de ambiente con nombre visible, aria-pressed y foco de teclado; indicador del ambiente y muestra del tono activo. Se conserva el aviso de aproximación del color.
- TypeScript de toda la aplicación: vue-tsc --noEmit --incremental false -p tsconfig.app.json, exit 0.
- ESLint de todo src: eslint src --max-warnings 0, exit 0.
- No existe script de pruebas unitarias en frontend/package.json. No se inventan resultados de pruebas.
- Compilación Vite completa y prueba visual del estado final pendientes por las limitaciones del entorno y acceso a Docker ya observadas. No se declara despliegue ni cierre total de los criterios de HU-CAT-06.

## 5. Dependencias y limitaciones
Requiere los datos de variante que ya consume la ficha pública, MuestraColor y el empaquetado de los recursos locales por Vite. No modifica la lógica de carrito, precios, disponibilidad ni servicios del catálogo.
Los PNG editados conservan transparencias y sombreado, pero pueden presentar variaciones respecto de las fotografías y no garantizan exactitud colorimétrica.
La especificación consultada referencia HU-CAT-06.png, ausente en este checkout; se inspeccionó el diagrama disponible Entonado durante la compra.drawio.png. No se modifica el flujo de selección comercial existente.

## 6. Archivos incluidos
- frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue.
- frontend/src/modules/m01-dashboardcatalogo/components/publicas/VisualizadorAmbientesPublico.vue.
- frontend/src/modules/m01-dashboardcatalogo/assets/ambientes/sala.png.
- frontend/src/modules/m01-dashboardcatalogo/assets/ambientes/cocina.png.
- frontend/src/modules/m01-dashboardcatalogo/assets/ambientes/habitacion.png.
- frontend/src/modules/m01-dashboardcatalogo/assets/ambientes/bano.png.
- frontend/src/modules/m01-dashboardcatalogo/assets/ambientes/fachada.png.
- docs/CHANGELOG.md.
- docs/walkthroughs/M01/walkthrough_v3.35.7_M01_ficha_compacta_ambientes_completos_frontend.md.

## 7. Publicación y reversión
Destino autorizado: feature/m01-vistas-publicas. Commit único bajo Conventional Commits con v3.35.7. Sin push forzado ni cambios en otras ramas. Una vez publicado, se puede deshacer con git revert del commit correspondiente y un push normal, conservando el historial. Un push no respalda archivos excluidos, secretos locales ni volúmenes de base de datos.
