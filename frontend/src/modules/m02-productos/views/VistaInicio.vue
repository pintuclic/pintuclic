<template>
  <DisenoTienda @openLogin="showLogin = true">
    <!-- Catálogo Dummy -->
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white p-8 rounded-2xl shadow-sm text-center">
        <h1 class="text-3xl font-bold text-corporate mb-4">Bienvenido a PintuClic</h1>
        <p class="text-neutral-medium max-w-2xl mx-auto mb-8">
          Explora nuestro catálogo de productos. Haz clic en "Iniciar sesión" en la barra superior para ver el flujo completo de autenticación y registro.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="h-64 bg-neutral-lightest rounded-xl border border-neutral-light flex items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer">
            <span class="text-neutral-medium font-medium">Producto de prueba</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ModalLogin 
      v-model="showLogin" 
      @goToRegister="openRegister" 
      @success="handleLoginSuccess" 
    />
    
    <RegistroWizard 
      v-model="showWizard" 
      @irALogin="openLogin" 
      @exito="handleWizardSuccess" 
    />
  </DisenoTienda>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DisenoTienda from '@/core/layouts/DisenoTienda.vue';
import ModalLogin from '@/modules/m04-cuentas/components/ModalLogin.vue';
import RegistroWizard from '@/modules/m04-cuentas/components/RegistroWizard.vue';
import type { TipoCuentaRegistro } from '@/modules/m04-cuentas/interfaces/registro.interface';

const showLogin = ref(false);
const showWizard = ref(false);

const closeAllModals = () => {
  showLogin.value = false;
  showWizard.value = false;
};

const openLogin = () => {
  closeAllModals();
  showLogin.value = true;
};

const openRegister = () => {
  closeAllModals();
  showWizard.value = true;
};

const handleLoginSuccess = () => {
  console.log('Login exitoso');
  closeAllModals();
};

const handleWizardSuccess = (tipoCuenta: TipoCuentaRegistro) => {
  console.log('Registro finalizado exitosamente. Tipo de cuenta:', tipoCuenta);
  // Aquí más adelante guardaremos sesión o redireccionaremos
  closeAllModals();
};
</script>
