# Documentación Técnica y Funcional - Pintu Clic

Bienvenido al repositorio de documentación centralizada del equipo de desarrollo de **Pintu Clic**.

Esta documentación está organizada bajo una arquitectura modular y transversal, diseñada tanto para lectura del equipo humano como para el consumo directo por **Agentes de Inteligencia Artificial (IA)** durante la fase de codificación.

---

## 📂 Organización de la Documentación

```text
equipo-2-doc/
├── README.md                         <-- Este archivo (índice general)
├── AGENTS.md                         <-- Protocolo obligatorio para agentes de IA
├── CHANGELOG.md                      <-- Registro central de versiones SemVer
│
├── 00_SISTEMA/                       <-- Gobernanza, arquitectura y plantillas del sistema
│   ├── 01_ARQUITECTURA/              <-- Diseño estructural y dependencias
│   │   ├── ARQUITECTURA_GENERAL.md   <-- Visión general, actores, mapa de dominios y principios
│   │   ├── ARQUITECTURA_BACKEND.md   <-- Stack oficial: TS, Express, Kysely, Zod, JWT, BCrypt, SMTP, CORS
│   │   └── MATRIZ_TRAZABILIDAD.md    <-- Mapeo HU <-> Requisitos de Seguridad <-> Diagramas
│   │
│   ├── 02_GUIAS_Y_ESTANDARES/        <-- Normativas de trabajo y contribución
│   │   ├── GUIA_VERSIONADO_Y_WALKTHROUGHS.md <-- Normativa de SemVer y protocolo de walkthroughs
│   │   └── ESTANDAR_Y_GUIA_INCORPORACION.md  <-- Guía para agregar o refactorizar módulos
│   │
│   └── 03_PLANTILLAS_Y_CHECKLISTS/   <-- Formatos de entrega y control de calidad
│       ├── CHECKLIST_CIERRE_MODULOS.md       <-- Checklist de validación de Definition of Done
│       ├── PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md / .docx <-- Plantilla de entrega post-implementación
│       └── PLANTILLA_REPORTE_QA_MODULO.md / .docx          <-- Plantilla estándar de pruebas QA
│
├── 01_TRANSVERSALES/                 <-- Capa de políticas globales (aplican a todo el sistema)
│   ├── M20_SEGURIDAD_Y_AUDITORIA.md  <-- Cifrado, sesiones, autorización y protección de datos
│   ├── M17_PERMISOS_Y_ROLES.md       <-- Modelo de permisos granulares por empleado
│   ├── M18_NOTIFICACIONES.md         <-- Sistema de eventos y correos transaccionales
│   └── POLITICAS/                    <-- Políticas transversales (Unicidad, Control Servidor, Datos Sensibles)
│
├── 02_MODULOS_FUNCIONALES/           <-- Especificación funcional detallada por módulo
│   ├── M04_CUENTAS_Y_PERFIL.md       <-- Registro, login B2C/B2B, perfil, direcciones y aprobación
│   └── ...                           <-- Futuros módulos funcionales (M07, M08, M12...)
│
└── assets/                           <-- Recursos visuales y diagramas
    ├── diagrams/                     <-- Diagramas en formato imagen (PNG/SVG) organizados por módulo
    │   ├── M04/
    │   ├── M17/
    │   ├── M18/
    │   └── M20/
    └── raw_drawio/                   <-- Archivos originales editables de Diagrams.net (.drawio)
```

---

## 🚀 Guías de Inicio Rápido

- **Si eres un desarrollador del equipo:** Consulta primero la [Matriz de Trazabilidad](./00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md) para ver el alcance de tu módulo y las políticas de seguridad asociadas.
- **Si eres un Agente de IA (Copilot / Assistant):** Consulta obligatoriamente [AGENTS.md](./AGENTS.md) antes de proponer cambios de código o generar nuevos módulos.
