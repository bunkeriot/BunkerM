/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
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
