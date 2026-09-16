// ==============================================================================
// DESIGN SYSTEM PINTUCLIC - BARRIL CENTRAL DE COMPONENTES CORE
// Exportación unificada de todos los componentes por categoría
// ==============================================================================

// 1. Botones y disparadores de acción
export { default as Button } from './buttons/Button.vue';
export { default as IconButton } from './buttons/IconButton.vue';

// 2. Formularios y controles de entrada de datos
export { default as Input } from './forms/Input.vue';
export { default as Textarea } from './forms/Textarea.vue';
export { default as Select } from './forms/Select.vue';
export { default as Checkbox } from './forms/Checkbox.vue';
export { default as Switch } from './forms/Switch.vue';
export { default as GrupoOpciones } from './forms/GrupoOpciones.vue';

// 3. Feedback, estados del sistema y notificaciones
export { default as Alert } from './feedback/Alert.vue';
export { default as Toast } from './feedback/Toast.vue';
export { default as ToastContainer } from './feedback/ToastContainer.vue';
export { default as Spinner } from './feedback/Spinner.vue';
export { default as Skeleton } from './feedback/Skeleton.vue';
export { default as SinResultados } from './feedback/SinResultados.vue';

// 4. Overlays, modales, drawers y diálogos
export { default as Modal } from './overlays/Modal.vue';
export { default as Drawer } from './overlays/Drawer.vue';
export { default as Dropdown } from './overlays/Dropdown.vue';
export { default as Tooltip } from './overlays/Tooltip.vue';
export { default as ConfirmarAccion } from './overlays/ConfirmarAccion.vue';

// 5. Navegación, indicadores y paginación
export { default as Tabs } from './navigation/Tabs.vue';
export { default as Migas } from './navigation/Migas.vue';
export { default as Paginacion } from './navigation/Paginacion.vue';
export { default as PasosProceso } from './navigation/PasosProceso.vue';
export { default as LineaTiempo } from './navigation/LineaTiempo.vue';

// 6. Visualización y presentación de datos
export { default as Card } from './data-display/Card.vue';
export { default as Table } from './data-display/Table.vue';
export { default as Badge } from './data-display/Badge.vue';
export { default as Avatar } from './data-display/Avatar.vue';
export { default as Icon } from './data-display/Icon.vue';

// 7. Piezas estructurales y de layout
export { default as PageHeader } from './layout/PageHeader.vue';
export { default as FooterPrincipal } from '../layouts/FooterPrincipal.vue';

// 8. Herramientas de soporte y depuración interna
export { default as DevRoleSwitcher } from './dev/DevRoleSwitcher.vue';

