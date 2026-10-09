# Plan de trabajo del flujo de tarjeta pública

Fecha: 9 de octubre de 2026. Alcance autorizado: M01 y M05, versión y changelog. Versión de entrega: 0.4.6.4.

| Paso | Trabajo y criterio de cierre | Estado |
| --- | --- | --- |
| 1 | Publicación M01: rechazar sin variante activa o imagen y no cambiar publicado al fallar | Implementado; suite de 125 comprobaciones |
| 2 | Respuesta M05: identidad real de producto y presentación en todas las líneas | Implementado; integración PostgreSQL con rollback |
| 3 | Frontend M05: retirar mocks y conservar identidad al agregar y recargar | Implementado; regresiones superadas |
| 4 | Frontend M01: mostrar el precio de la misma variante que agrega la tarjeta, incluido el color del abanico | Implementado en inicio, catálogo, paleta y complementarios |
| 5 | Pruebas, versión, changelog y walkthroughs por módulo y capa | Completados en el alcance; cierre global condicionado al lint compartido |

Validación: 125 comprobaciones backend M01 y 72 M05; 27 pruebas frontend M01/M05; integración de identidad con base real, revirtiendo las escrituras; backend lint y TypeScript limpios; frontend build y ESLint de M01/M05 limpios.

Pendiente externo: el lint global frontend tiene 2 errores en core/components/forms/SearchableSelect.vue y 1 advertencia en core/components/overlays/Tooltip.vue. No se modifican por aislamiento de módulos. El usuario solicitó expresamente el commit local con este control pendiente; la limitación queda registrada. Sin push. Los contenedores actuales no fueron desplegados de nuevo; los cambios están en el código local.

Datos: cargar fotografías reales sigue siendo tarea del gestor; no se inventan imágenes ni se cambian registros publicados históricos. La retirada de referencias de galería de demostración se incorpora al commit para compilar; los ajustes visuales locales previos se conservan fuera de él. El informe Word del 9 de octubre se conserva como evidencia del estado anterior.
