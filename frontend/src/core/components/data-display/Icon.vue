<script setup lang="ts">
import { computed } from "vue";
import {
  House, Users, ShieldCheck, Settings, UserRound, Search, Plus,
  ArrowRight, ArrowLeft, ChevronRight, ChevronDown, Pencil, Power,
  Check, X, Mail, Phone, LockKeyhole, Clock, Info, LayoutGrid,
  Download, Funnel, Menu, LogOut, Building2, KeyRound, Eye, Copy,
  RefreshCw, Bell,
} from "lucide-vue-next";
import type { Component } from "vue";

const props = defineProps<{ name: string }>();
// Explicit imports keep the existing names without bundling the full catalog.
const icons: Record<string, Component> = {
  home: House,
  users: Users,
  shield: ShieldCheck,
  settings: Settings,
  user: UserRound,
  search: Search,
  plus: Plus,
  arrow: ArrowRight,
  back: ArrowLeft,
  chevron: ChevronRight,
  down: ChevronDown,
  edit: Pencil,
  power: Power,
  check: Check,
  close: X,
  mail: Mail,
  phone: Phone,
  lock: LockKeyhole,
  clock: Clock,
  info: Info,
  grid: LayoutGrid,
  download: Download,
  filter: Funnel,
  menu: Menu,
  logout: LogOut,
  building: Building2,
  key: KeyRound,
  eye: Eye,
  copy: Copy,
  refresh: RefreshCw,
  bell: Bell,
};
const icon = computed(() => icons[props.name] ?? LayoutGrid);
</script>
<template>
  <component
    :is="icon"
    class="h-5 w-5 shrink-0"
    :size="20"
    :stroke-width="1.8"
    color="currentColor"
    aria-hidden="true"
    focusable="false"
  />
</template>
