# Walkthrough de Implementación — v3.34.0

## 1. Metadatos de la implementación

- **Versión:** v3.34.0.
- **Módulo de origen:** M01 — Catálogo de Productos.
- **Fecha:** 2026-09-12.
- **Responsable:** Desarrollo frontend asistido por IA.

## 2. Historia de usuario cubierta

- **HU-CAT-06 — Consulta pública del catálogo.**
- Se incorporó el diseño de la carta de colores como modal dentro de la ficha pública del producto.
- La persona puede buscar por nombre, revisar los colores publicados, seleccionar uno y aplicarlo conservando la presentación actual cuando existe una variante compatible.

## 3. Reglas de negocio y políticas aplicadas

- Los colores se deducen exclusivamente de las variantes activas entregadas en la ficha pública; no existen arreglos de catálogo hardcodeados.
- La selección busca primero una variante del nuevo color con la presentación vigente y usa la primera presentación disponible únicamente como respaldo.
- La base de entonado nunca se presenta como alternativa para el cliente, conforme a RF-CAT-12-07.
- Los colores visuales de interfaz usan exclusivamente tokens oficiales del Design System.
- No se modificaron backend, módulos ajenos, componentes globales ni `docs/reviews/`.
- Las políticas HU-SEG-01, HU-ADM-03, HU-NOT-01 y HU-CUE-08 no se activan porque esta entrega es una consulta pública sin credenciales, permisos, notificaciones ni cuentas.

## 4. Criterios de aceptación verificados

| Criterio | Evidencia | Estado |
| --- | --- | --- |
| CA-CAT-06-01 | La carta abre desde la ficha pública sin autenticación y muestra colores/presentaciones de variantes públicas. | Cumplimiento parcial |
| CA-CAT-06-02 | Aplicar un color selecciona la variante compatible con la presentación vigente y actualiza el precio reactivo de la ficha. | Cumple con los datos actuales |
| CA-CAT-06-06 | La interfaz dispone de búsqueda y paginación visual. La carga remota por familia no puede validarse sin endpoint público. | Pendiente de backend |
| RF-CAT-12-07 | La interfaz informa que la base se determina internamente y no permite elegirla. | Cumple |

## 5. Dependencias externas

Para operar al 100% con cartas de miles de colores, M01 backend debe publicar un endpoint paginado por producto que entregue familia cromática, código, muestra visual y compatibilidad color–base activa. Hasta entonces:

- La búsqueda funciona por nombre sobre las variantes ya recibidas en la ficha.
- La paginación organiza localmente hasta doce colores por pantalla, pero no evita que la ficha pública reciba todas sus variantes.
- Los filtros de familia permanecen deshabilitados.
- Las muestras se identifican expresamente como ilustrativas porque la API pública no entrega `muestra_hex`.

El diagrama indicado por la especificación, `docs/assets/diagrams/M01/HU-CAT-06.png`, no existe en el repositorio. Se inspeccionó `Entonado durante la compra.drawio.png`, cuyo contrato exige construir la carta solo con colores compatibles, permitir que el cliente elija color y presentación —nunca base— y determinar internamente la variante consumida. La validación real de compatibilidad sigue dependiendo del contrato pendiente de backend.

Esta interfaz prepara la selección que posteriormente consumirá M07 al agregar el producto al carrito, sin implementar acciones de compra dentro de M01.

## 6. Archivos modificados y creados

- `frontend/src/modules/m01-dashboardcatalogo/components/publicas/CartaColoresProductoPublica.vue`
- `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue`
- `docs/CHANGELOG.md`
- `docs/walkthroughs/M01/walkthrough_v3.34.0_M01_carta_colores_producto_frontend.md`

## 7. Verificación técnica

- `npm run build`: exitoso.
- `npm run lint`: cero errores y cero advertencias.
- Revisión visual local en `/productos/1`: enlace visible, modal responsive, dos colores reales, estado seleccionado, resumen lateral y advertencia de dependencia renderizados correctamente.
