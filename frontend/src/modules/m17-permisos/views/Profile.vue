<script setup lang="ts">
import { Button, Icon, Modal, PageHeader, Input, Badge } from "@/core/components";
import { ref, reactive } from "vue";
import { service } from "../services/m17.service";
import { useM17, message, notify } from "../store/useM17";
import { cambiarContrasenaSchema } from "../dtos/perfil.dto";
const { state, isAdmin, refresh } = useM17();
const form = reactive({ current: "", next: "", repeat: "" });
const busy = ref(false);
const error = ref("");
const confirm = ref(false);
const logoutConfirm = ref(false);
function validate() {
  error.value = "";
  const result = cambiarContrasenaSchema.safeParse(form);
  if (!result.success) {
    error.value = result.error.issues[0]?.message || 'Revisa la contraseña.';
    return;
  }
  confirm.value = true;
}
async function password() {
  busy.value = true;
  try {
    await service.password(form.current, form.next);
    localStorage.removeItem("access_token");
    Object.assign(form, { current: "", next: "", repeat: "" });
    confirm.value = false;
    notify("Contraseña actualizada. Inicia sesión de nuevo.");
    await refresh();
  } catch (e) {
    error.value = message(e);
    confirm.value = false;
  } finally {
    busy.value = false;
  }
}
async function logout() {
  busy.value = true;
  error.value = "";
  try {
    await service.logout();
    logoutConfirm.value = false;
    await refresh();
  } catch (e) {
    error.value = message(e);
    logoutConfirm.value = false;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <PageHeader title="Mi perfil" description="Consulta tu sesión y administra tu seguridad." />
  <div class="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
    <aside class="space-y-5">
      <section
        class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6 text-center"
      >
        <span
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-corporate text-2xl font-bold text-neutral-white"
          >{{ isAdmin ? "AD" : "MI" }}</span
        >
        <h2 class="font-title mt-5 text-lg font-bold text-corporate">
          {{ isAdmin ? "Administrador" : "Mi cuenta" }}
        </h2>
        <p class="mt-2 text-sm text-neutral-medium">
          {{ isAdmin ? "Acceso completo al sistema" : "Accesos individuales" }}
        </p>
        <Badge class="mt-4" tone="success" :dot="true">Sesión activa</Badge>
        <dl
          class="mt-6 space-y-3 border-t border-neutral-light pt-5 text-left text-sm"
        >
          <div class="flex justify-between">
            <dt class="text-neutral-medium">Identificador</dt>
            <dd>#{{ state.session?.id_usuario }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-medium">Entorno</dt>
            <dd>Servidor</dd>
          </div>
        </dl>
        <Button variant="outline"
          icon="logout"
          class="mt-6 w-full"
          @click="logoutConfirm = true"
          >Cerrar sesión</Button
        >
      </section>
      <div
        v-if="isAdmin"
        class="rounded-xl border border-action/10 bg-subaction/40 p-5"
      >
        <Icon name="shield" class="mb-3 text-action" />
        <h3 class="font-title text-sm font-bold text-corporate">Una cuenta protegida</h3>
        <p class="mt-2 text-sm leading-6 text-neutral-medium">
          El administrador es único. Su rol, permisos y estado no se pueden
          modificar desde el panel.
        </p>
      </div>
    </aside>
    <div class="space-y-6">
      <form
        class="rounded-xl border border-neutral-light bg-neutral-white"
        @submit.prevent="validate"
      >
        <header class="border-b border-neutral-light p-4 sm:p-6">
          <h2
            class="font-title flex items-center gap-3 text-lg font-bold text-corporate"
          >
            <Icon name="key" class="text-action" />Cambiar contraseña
          </h2>
          <p class="mt-2 text-sm text-neutral-medium">
            El cambio cerrará todas las sesiones de esta cuenta.
          </p>
        </header>
        <fieldset :disabled="busy" class="grid min-w-0 grid-cols-1 gap-5 p-4 sm:p-6">
          <div class="text-sm font-semibold"
            ><Input label="Contraseña actual" v-model="form.current"
              type="password"
              autocomplete="current-password"
              required
              maxlength="128"
               /></div><div class="text-sm font-semibold"
            ><Input label="Nueva contraseña" v-model="form.next"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              maxlength="128"

            /><span class="mt-2 block text-xs font-normal text-neutral-medium"
              >Entre 8 y 128 caracteres; incluye mayúsculas, minúsculas y
              números.</span
            ></div><div class="text-sm font-semibold"
            ><Input label="Confirmar nueva contraseña" v-model="form.repeat"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              maxlength="128"

          /></div>
        </fieldset>
        <p v-if="error" role="alert" class="mx-6 mb-5 text-sm text-neutral-dark">
          {{ error }}
        </p>
        <footer class="flex flex-col sm:flex-row justify-end border-t border-neutral-light p-4 sm:p-6">
          <Button
            type="submit"
            variant="action"
            icon="lock"
            :disabled="busy"
            >Actualizar contraseña</Button
          >
        </footer>
      </form>
      <section
        class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
      >
        <h2 class="font-title font-bold text-corporate">Auditoría de la cuenta</h2>
        <p class="mt-3 text-sm leading-6 text-neutral-medium">La consulta del historial de auditoría no está expuesta por el backend actual.</p>
      </section>
    </div>
  </div>
  <Modal
    v-if="confirm"
    title="Actualizar contraseña"
    @close="!busy && (confirm = false)"
    ><p class="text-sm leading-6">
      Se cerrarán todas tus sesiones y tendrás que acceder con la nueva
      contraseña.
    </p>
    <div class="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
      <Button variant="outline" :disabled="busy" @click="confirm = false">Cancelar</Button
      ><Button variant="action" :disabled="busy" @click="password">{{
        busy ? "Actualizando…" : "Confirmar cambio"
      }}</Button>
    </div></Modal
  ><Modal
    v-if="logoutConfirm"
    title="Cerrar sesión"
    @close="!busy && (logoutConfirm = false)"
    ><p class="text-sm leading-6">
      Tendrás que iniciar sesión de nuevo para acceder al panel.
    </p>
    <div class="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
      <Button variant="outline" :disabled="busy" @click="logoutConfirm = false">Cancelar</Button
      ><Button variant="danger" :disabled="busy" @click="logout">Cerrar sesión</Button>
    </div></Modal
  >
</template>
