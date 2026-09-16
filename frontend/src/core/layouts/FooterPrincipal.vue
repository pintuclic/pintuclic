<template>
  <footer class="bg-corporate text-neutral-white pt-12 pb-6 px-6 lg:px-12 w-full mt-auto">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

        <!-- Columna 1: Logo y texto -->
        <div class="flex flex-col gap-4">
          <img :src="logoSrc" alt="Pintu Clic" class="h-12 object-contain self-start" />
          <p class="text-neutral-light text-sm max-w-[250px] leading-relaxed">
            Todo para tu proyecto en un solo lugar.<br/>Calidad y asesoría.
          </p>
          <div class="flex items-center gap-4 mt-2">
            <a href="#" class="text-neutral-light hover:text-white transition-colors">
              <FacebookIcon class="w-5 h-5" />
            </a>
            <a href="#" class="text-neutral-light hover:text-white transition-colors">
              <InstagramIcon class="w-5 h-5" />
            </a>
            <a href="#" class="text-neutral-light hover:text-white transition-colors">
              <YoutubeIcon class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Columna 2: Categorías -->
        <div class="flex flex-col gap-4">
          <h3 class="font-bold text-lg mb-2">Categorías</h3>
          <ul class="flex flex-col gap-3 text-sm text-neutral-light">
            <li><a href="#" class="hover:text-white transition-colors">Pinturas interiores</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Pinturas exteriores</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Herramientas</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Accesorios</a></li>
          </ul>
        </div>

        <!-- Columna 3: Servicios -->
        <div class="flex flex-col gap-4">
          <h3 class="font-bold text-lg mb-2">Servicios</h3>
          <ul class="flex flex-col gap-3 text-sm text-neutral-light">
            <li><a href="#" class="hover:text-white transition-colors">Asesoría de color</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Calculadora de pintura</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Directorio de pintores</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Centro de ayuda</a></li>
          </ul>
        </div>

        <!-- Columna 4: Contacto -->
        <div class="flex flex-col gap-4">
          <h3 class="font-bold text-lg mb-2">Contacto</h3>
          <ul class="flex flex-col gap-4 text-sm text-neutral-light">
            <li class="flex items-center gap-3">
              <MapPinIcon class="w-4 h-4 shrink-0" />
              <span>Florencia-Caquetá</span>
            </li>
            <li class="flex items-center gap-3">
              <PhoneIcon class="w-4 h-4 shrink-0" />
              <span>322 123 4567</span>
            </li>
            <li class="flex items-center gap-3">
              <MailIcon class="w-4 h-4 shrink-0" />
              <span>contacto@pintuclic.com</span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Divider y Copyright -->
      <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-light">
        <p>© 2026 PintuClic. Todos los derechos reservados.</p>
        <div class="flex items-center gap-4 flex-wrap justify-center">
          <a href="#" class="hover:text-white transition-colors">Términos y condiciones</a>
          <a href="#" class="hover:text-white transition-colors">Política de privacidad</a>
          <a href="#" class="hover:text-white transition-colors">Políticas de envío</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Youtube as YoutubeIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon
} from 'lucide-vue-next';

// El usuario pidi la imagen de las letras blancas
import logoSrc from '@/assets/Pintu_Blanco.png';
</script>
