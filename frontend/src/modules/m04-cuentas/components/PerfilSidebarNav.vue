<template>
  <div class="flex flex-col gap-6">
    <!-- 1. NAVEGACIÓN -->
    <div class="bg-white rounded-2xl shadow-sm border border-neutral-light p-2">
      <nav class="flex flex-row lg:flex-col gap-2">
        <Button
          variant="subaction"
          class="flex-1 lg:w-full !rounded-xl !justify-center lg:!justify-start !px-2 lg:!px-4 !py-3 font-semibold transition-all"
          @click="irA('/perfil')"
        >
          <UserIcon class="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 lg:mr-3" />
          <span class="text-xs lg:text-sm whitespace-nowrap">Mi Perfil</span>
        </Button>
        <Button
          variant="outline"
          class="flex-1 lg:w-full !rounded-xl !justify-center lg:!justify-start !px-2 lg:!px-4 !py-3 !text-neutral-medium hover:!text-corporate hover:!bg-neutral-lightest !no-underline font-medium transition-all"
          @click="irA('/pedidos')"
        >
          <PackageIcon class="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 lg:mr-3" />
          <span class="text-xs lg:text-sm whitespace-nowrap">Mis Pedidos</span>
        </Button>
      </nav>
    </div>

    <!-- 2. TARJETA DE SOPORTE -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-neutral-light text-center">
      <div class="w-10 h-10 bg-neutral-lightest rounded-full flex items-center justify-center mx-auto mb-3">
        <HeadphonesIcon class="w-5 h-5 text-neutral-dark" />
      </div>
      <h3 class="text-corporate font-bold text-base mb-1">¿Necesitas ayuda?</h3>
      <p class="text-neutral-medium text-xs mb-4">Nuestro equipo está listo para asesorarte.</p>
      <Button variant="corporate" class="w-full text-xs shadow-sm">
        Contactar soporte
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Button } from '@/core/components';
import {
  User as UserIcon,
  Package as PackageIcon,
  Headphones as HeadphonesIcon,
} from 'lucide-vue-next';

const router = useRouter();

function irA(path: string): void {
  router.push(path);
}
</script>
