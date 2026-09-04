# 🗄️ Módulo de Base de Datos - PINTUCLIC

Bienvenido al directorio de base de datos de la plataforma **PINTUCLIC**.  
Este módulo centraliza los scripts de definición de datos (DDL), documentación técnica, walkthroughs evolutivos y diagramas de arquitectura.

---

## 📂 Estructura de Carpetas

```text
bd/
├── README.md                      # Este archivo (guía general y mapa del módulo)
│
├── sql/                           # Scripts DDL ejecutables en PostgreSQL
│   └── schema_pintuclic.sql       # Script DDL oficial vigente (PostgreSQL 12+ / 18, 25 tablas)
│
├── docs/                          # Documentación viva, manuales y walkthroughs
│   ├── DOCUMENTACION_BASE_DATOS.md# Especificación activa, ER Mermaid, diccionarios y changelog
│   ├── WALKTHROUGH_DATABASE.md    # Registro cronológico detallado de cada migración y cambio
│   └── GUIA_REFACTORIZACION_BD.md # Guía, protocolo y plantilla oficial para IAs y desarrolladores
│
└── assets/                        # Recursos visuales y diagramas fuente
    ├── ER_Pintuco.png             # Imagen de referencia del diagrama Entidad-Relación
    └── ER_Pintuco.drawio.xml      # Archivo fuente XML/Draw.io editable
```

---

## 🚀 Acceso Rápido a Recursos Clave

- 📄 **Script SQL Oficial:** [`sql/schema_pintuclic.sql`](./sql/schema_pintuclic.sql)  
  *DDL idempotente para PostgreSQL con 25 tablas, 8 tipos `ENUM` y 27 claves foráneas.*
- 📘 **Documentación General y ER:** [`docs/DOCUMENTACION_BASE_DATOS.md`](./docs/DOCUMENTACION_BASE_DATOS.md)  
  *Diagrama interactivo Mermaid, diccionario de tablas/columnas y recomendaciones para Kysely.*
- 🚀 **Walkthroughs de Versiones:** [`docs/WALKTHROUGH_DATABASE.md`](./docs/WALKTHROUGH_DATABASE.md)  
  *Desglose detallado de migraciones (v1.0 $\rightarrow$ v2.0).*
- 🛠️ **Guía para Refactorizar:** [`docs/GUIA_REFACTORIZACION_BD.md`](./docs/GUIA_REFACTORIZACION_BD.md)  
  *Instrucciones paso a paso, checklist y plantilla obligatoria para agentes de IA y desarrolladores.*

---

## 📌 Estado Actual

- **Versión Activa:** `v2.0`
- **Total de Tablas:** 25 tablas normalizadas.
- **Tipos Enumerados (ENUM):** 8 enums nativos para integridad de estados.
- **Restricción de Rol Único:** Forzada mediante `UNIQUE (id_usuario)` en `usuario_rol`.
- **Motor:** PostgreSQL 12+ (Completamente testeado y compatible con PostgreSQL 18).
