import { defineStore, storeToRefs } from "pinia";
import { computed, reactive } from "vue";
import axios from "axios";
import { service } from "../services/m17.service";
import type { Persona, Permiso, Sesion } from "../interfaces";
export const useM17Store = defineStore("m17", () => {
const state = reactive({
  employees: [] as Persona[],
  clients: [] as Persona[],
  catalog: [] as Permiso[],
  session: null as Sesion | null,
  loading: false,
  ready: false,
  error: "",
  toast: "",
});
let toastTimer: ReturnType<typeof setTimeout>;
function message(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      state.session = null;
      state.ready = false;
      state.employees = [];
      state.clients = [];
      state.catalog = [];
      state.error =
        "La sesión ha finalizado. Inicia sesión de nuevo para continuar.";
      return state.error;
    }
    if (error.response?.status === 403) {
      state.ready = false;
      state.employees = [];
      state.clients = [];
      state.catalog = [];
      state.error =
        "Acceso denegado. Tu sesión permanece abierta. Actualiza para consultar tus accesos vigentes.";
      return state.error;
    }
    if (!error.response)
      return "No se pudo conectar con el servidor. Comprueba la conexión y vuelve a intentar.";
    return error.response.data?.message || "No se pudo guardar el cambio.";
  }
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}
function notify(text: string) {
  state.toast = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (state.toast = ""), 6000);
}
  const isAdmin = computed(() => state.session?.id_rol === 1);
  const canAttend = computed(
    () => isAdmin.value || !!state.session?.permisos.includes("personal.ver"),
  );
  async function refresh(options?: { background?: boolean } | unknown) {
    const isBackground = Boolean(
      typeof options === 'object' &&
      options !== null &&
      'background' in options &&
      (options as { background?: boolean }).background
    );
    if (!isBackground) {
      state.loading = true;
    }
    state.error = "";
    try {
      state.session = await service.session();
      const results = await Promise.all([
        isAdmin.value ? service.employees() : Promise.resolve([]),
        canAttend.value ? service.clients() : Promise.resolve([]),
        isAdmin.value ? service.catalog() : Promise.resolve([]),
      ]);
      [state.employees, state.clients, state.catalog] = results;
      state.ready = true;
    } catch (e) {
      state.error = message(e);
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        state.session = null;
        state.employees = [];
        state.clients = [];
        state.catalog = [];
        state.ready = false;
      }
    } finally {
      if (!isBackground) {
        state.loading = false;
      }
    }
  }
  return { state, isAdmin, canAttend, refresh, message, notify };
});

export function useM17() {
  const store = useM17Store();
  const { isAdmin, canAttend } = storeToRefs(store);
  return { state: store.state, isAdmin, canAttend, refresh: store.refresh };
}
export function message(error: unknown) { return useM17Store().message(error); }
export function notify(text: string) { useM17Store().notify(text); }
