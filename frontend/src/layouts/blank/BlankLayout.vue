// ===============================|| Blank Layout ||=============================== //
<template>
  <v-app>
    <!-- Loader start -->
    <LoaderWrapper />
    <!-- Loader end -->
    <RouterView />
  </v-app>
</template>
<script setup lang="ts">
import { RouterView } from 'vue-router';
import LoaderWrapper from '../dashboard/LoaderWrapper.vue';
</script>
