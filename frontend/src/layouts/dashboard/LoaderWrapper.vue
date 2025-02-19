<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
const { isLoading } = storeToRefs(uiStore);
</script>

<template>
  <div
    :class="{
      'page-loader': true,
      loading: isLoading,
      hidden: !isLoading
    }"
  >
    <div class="bar" />
  </div>
</template>

<style scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10000000;
  pointer-events: none;
  opacity: 0;
  transition:
    width 1350ms ease-in-out,
    opacity 350ms linear,
    left 50ms ease-in-out;
}

.bar {
  background-color: rgb(var(--v-theme-primary));
  height: 5px;
  width: 100%;
}

.hidden {
  opacity: 0;
}

.loading {
  opacity: 1;
  animation: loading 2000ms ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes loading {
  0% {
    width: 0;
    left: 0;
  }
  50% {
    width: 100%;
    left: 0;
  }
  100% {
    width: 100%;
    left: 100%;
  }
}
</style>
