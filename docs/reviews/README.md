# 🔍 Registro de Revisiones de Código y Auditoría Técnica (Code Reviews) - PINTUCLIC

> ⛔ **DIRECTIVA OBLIGATORIA DE ROL (TECH LEAD ONLY):**  
> Este directorio y sus subcarpetas son de uso **EXCLUSIVO para Líderes Técnicos (Tech Leads)**.  
> Los desarrolladores de módulos y Agentes de IA que actúen como implementadores tienen **TERMINANTEMENTE PROHIBIDO** crear, editar o alterar archivos en esta carpeta. Su alcance de entrega finaliza en [`docs/walkthroughs/`](../walkthroughs/).  
> **Si no estás desempeñando explícitamente el rol de Líder Técnico, NO HAGAS REVIEWS.**

Este directorio almacena las auditorías técnicas formales realizadas por el **Tech Lead / Arquitecto de Software** sobre los módulos desarrollados en **Backend** y **Frontend**.

A diferencia de los [Walkthroughs](../walkthroughs/) (que son redactados por los desarrolladores como evidencia de entrega), los **Reviews** son dictámenes de calidad, escalabilidad, adherencia a principios SOLID y cumplimiento de los estándares del sistema.

---

## 📂 Organización

```text
docs/reviews/
├── README.md               # Este archivo (normativa y criterios de revisión)
├── backend/                # Revisiones técnicas y auditorías de módulos backend
└── frontend/               # Revisiones técnicas y auditorías de módulos frontend
```

---

## 📋 Criterios de Evaluación Obligatorios

Toda revisión debe contrastar el código contra las siguientes dimensiones:

1. **Aislamiento Modular y Fronteras:** El módulo no debe modificar ni invadir carpetas ajenas ni romper la encapsulación.
2. **Separación de Responsabilidades (SOLID):**
   - `controllers/`: Solo transporte HTTP y delegación.
   - `dtos/`: Schemas Zod de entrada y validación en tiempo de ejecución.
   - `interfaces/`: Contratos de tipos estáticos TypeScript (sin lógica de runtime).
   - `services/`: Reglas de negocio puras.
   - `repositories/`: Exclusivos para consultas Kysely fuertemente tipadas.
3. **Seguridad y Auditoría:** Cumplimiento de políticas M20 (sin datos sensibles en respuestas ni logs, validación estricta de autorización en servidor).
4. **Calidad de Código y Tipado:** Cero uso de `any`, TypeScript estricto y sin advertencias de linter (`npm run lint`).

---

## 🏷️ Dictámenes de Aprobación

- **✅ APROBADO:** El módulo cumple con todos los estándares y criterios de aceptación.
- **⚠️ APROBADO CON OBSERVACIONES:** El módulo es funcional pero requirió ajustes arquitectónicos menores (e.g. desacoplamiento de DTOs).
- **🛑 RECHAZADO / REQUIERE CAMBIOS:** Se detectaron violaciones graves de seguridad, tipos `any`, dependencias cruzadas indebidas o incumplimiento de Criterios de Aceptación.

---

## 📌 Histórico de Revisiones y Verificaciones del Esquema de Base de Datos

| Versión | Fecha | Entregable / Walkthrough de Base de Datos | Dictamen | Resumen de Cambios Estructurales |
| :---: | :---: | :--- | :---: | :--- |
| **v3.29.0** | 2026-09-22 | [`walkthrough_v3.29.0_DATABASE_actualizacion_esquema_diagrama_er_backend.md`](../walkthroughs/DATABASE/walkthrough_v3.29.0_DATABASE_actualizacion_esquema_diagrama_er_backend.md) | **✅ APROBADO** | Sincronización completa de DDL (`schema_pintuclic.sql`), seed (`seed_pintuclic.sql`), tipos Kysely (`types.ts`) y documentación (`DOCUMENTACION_BASE_DATOS.md`) según el diagrama ER oficial (`variante` $\rightarrow$ `base` $\rightarrow$ `color` $\rightarrow$ `tonos`, `linea_carrito.ref_viva`, `cotizacion.id_usuario/id_rol`, `orden.carrito_o_cotizacion`). |
| **v2.4** | 2026-09-05 | [`WALKTHROUGH_DATABASE.md`](../../bd/docs/WALKTHROUGH_DATABASE.md#-versión-24-2026-09-05) | **✅ APROBADO** | Incorporación de 5 tablas relacionales para M04 Cuentas y Perfil (`direccion_cliente`, `solicitud_empresa`, `solicitud_actualizacion_nit`, `usuario_identidad_externa`, `codigo_verificacion`). |

