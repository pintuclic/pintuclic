import axios from "axios";
import { defineStore, storeToRefs } from "pinia";
import { computed, reactive, watch } from "vue";
import type { Persona, Permiso, Sesion } from "../interfaces";
import { service } from "../services/m17.service";

const PERMISSION_REQUEST_LIMIT = 4;

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
  const permissionCache = new Map<number, string[]>();
  const permissionRequests = new Map<number, Promise<string[]>>();
  const permissionVersions = new Map<number, symbol>();
  let cacheGeneration = 0;
  const cacheTimes = new Map<number, number>();
  let activeRequests = 0;
  const requestQueue: Array<() => void> = [];
  let toastTimer: ReturnType<typeof setTimeout>;

  const isAdmin = computed(() => state.session?.id_rol === 1);
  const canAttend = computed(
    () => isAdmin.value || !!state.session?.permisos.includes("personal.ver"),
  );

  function clearPermissionCache() {
    cacheGeneration++;
    permissionCache.clear();
    cacheTimes.clear();
    permissionRequests.clear();
    permissionVersions.clear();
  }
  watch(() => state.session?.id_usuario, clearPermissionCache, { flush: "sync" });

  function message(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        state.session = null;
        state.ready = false;
        state.employees = [];
        state.clients = [];
        state.catalog = [];
        clearPermissionCache();
        state.error =
          "La sesión ha finalizado. Inicia sesión de nuevo para continuar.";
        return state.error;
      }
      if (error.response?.status === 403) {
        state.ready = false;
        state.employees = [];
        state.clients = [];
        state.catalog = [];
        clearPermissionCache();
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

  async function permissions(id: number, force = false): Promise<string[]> {
    const cached = permissionCache.get(id);
    if (!force && cached && Date.now() - (cacheTimes.get(id) ?? 0) < 60000) return [...cached];

    const pending = permissionRequests.get(id);
    if (pending) return [...(await pending)];

    const generation = cacheGeneration;
    const version = Symbol();
    permissionVersions.set(id, version);
    const request = (async () => {
      if (activeRequests >= PERMISSION_REQUEST_LIMIT) {
        await new Promise<void>((resolve) => requestQueue.push(resolve));
      } else {
        activeRequests++;
      }
      try {
        if (generation !== cacheGeneration) throw new Error("La consulta de permisos ha caducado.");
        const values = await service.permissions(id);
        if (generation !== cacheGeneration) throw new Error("La consulta de permisos ha caducado.");
        if (permissionVersions.get(id) !== version) return [...(permissionCache.get(id) ?? [])];
        const normalized = [...new Set(values)].sort();
        permissionCache.set(id, normalized);
        cacheTimes.set(id, Date.now());
        return normalized;
      } finally {
        const next = requestQueue.shift();
        if (next) next();
        else activeRequests--;
      }
    })();
    permissionRequests.set(id, request);
    try {
      return [...(await request)];
    } finally {
      if (permissionRequests.get(id) === request) permissionRequests.delete(id);
    }
  }

  function cachePermissions(id: number, values: string[]) {
    permissionVersions.delete(id);
    permissionRequests.delete(id);
    permissionCache.set(id, [...new Set(values)].sort());
    cacheTimes.set(id, Date.now());
  }

  async function permissionHolders(permission: string): Promise<string[]> {
    if (!permission) return [];
    let cursor = 0;
    const generation = cacheGeneration;
    const employees = [...state.employees];
    const results = new Map<number, string[]>();

    async function worker() {
      while (cursor < employees.length) {
        if (generation !== cacheGeneration) throw new Error("La consulta de permisos ha caducado.");
        const employee = employees[cursor++];
        if (!employee) return;
        results.set(employee.id_usuario, await permissions(employee.id_usuario));
      }
    }

    const workerCount = Math.min(PERMISSION_REQUEST_LIMIT, employees.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return employees
      .filter((employee) => results.get(employee.id_usuario)?.includes(permission))
      .map((employee) => employee.nombre);
  }

  async function refreshPeople(kind: "empleados" | "clientes") {
    state.loading = true;
    state.error = "";
    try {
      if (kind === "empleados") {
        state.employees = isAdmin.value ? await service.employees() : [];
      } else {
        state.clients = canAttend.value ? await service.clients() : [];
      }
    } catch (error) {
      state.error = message(error);
    } finally {
      state.loading = false;
    }
  }

  async function refresh() {
    clearPermissionCache();
    state.loading = true;
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
    } catch (error) {
      state.error = message(error);
    } finally {
      state.loading = false;
    }
  }

  return {
    state,
    isAdmin,
    canAttend,
    refresh,
    refreshPeople,
    permissions,
    permissionHolders,
    cachePermissions,
    clearPermissionCache,
    message,
    notify,
  };
});

export function useM17() {
  const store = useM17Store();
  const { isAdmin, canAttend } = storeToRefs(store);
  return {
    state: store.state,
    isAdmin,
    canAttend,
    refresh: store.refresh,
    refreshPeople: store.refreshPeople,
    permissions: store.permissions,
    permissionHolders: store.permissionHolders,
    cachePermissions: store.cachePermissions,
    clearPermissionCache: store.clearPermissionCache,
  };
}

export function message(error: unknown) {
  return useM17Store().message(error);
}

export function notify(text: string) {
  useM17Store().notify(text);
}
