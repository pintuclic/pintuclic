# Controles oficiales de formularios

Importar `Input`, `Select`, `Textarea` y `Checkbox` desde `@/core/components`.

- `Input`: con `name` se integra con `useForm` de VeeValidate, conservando valores iniciales y errores del esquema. Sin `name` admite `v-model` independiente, sin registrar campos en un formulario VeeValidate. Soporta `label`, `id`, `type`, `placeholder`, `disabled`, `error` e `icon` como string o componente. Los campos de contraseña incluyen botón accesible de visibilidad.
- `Select`: `v-model` de string o número, `label`, `id`, `name`, `disabled` y `error`. Las opciones se pasan mediante el slot con etiquetas nativas `option`; conserva sus valores numéricos. Emite `change` con el evento nativo, además de `update:modelValue`, para selección controlada con confirmación.
- `Textarea`: `v-model` de string, `label`, `id`, `name`, `disabled` y `error`. Admite atributos nativos como `rows`, `required`, `minlength`, `maxlength` y `placeholder`.
- `Checkbox`: `v-model` booleano o `:model-value` controlado. Admite `label`, `id`, `disabled` y slot descriptivo. Emite `update:modelValue`; la casilla vuelve al valor del padre cuando este difiere la actualización para solicitar confirmación.

Los atributos nativos y de accesibilidad se reenvían al control real. `class` se aplica al contenedor para tamaño y distribución. Un `label` enlazado al `id` permite activar y enfocar el control; los errores usan `aria-invalid`, `aria-describedby` y `role="alert"`. No colocar estos componentes dentro de otro `label` cuando se usa su prop `label`.

Los controles usan Inter y tokens oficiales. La validación de negocio y los esquemas Zod permanecen en los DTOs de sus módulos. Pruebas de regresión: `npm run test:core` desde `frontend/`.
