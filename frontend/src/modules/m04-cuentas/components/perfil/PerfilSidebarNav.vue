<template>
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
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Button } from '@/core/components';
import {
  User as UserIcon,
  Package as PackageIcon,
} from 'lucide-vue-next';

const router = useRouter();

function irA(path: string): void {
  router.push(path);
}
</script>
