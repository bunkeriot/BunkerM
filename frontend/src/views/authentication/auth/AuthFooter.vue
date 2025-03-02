/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { shallowRef } from 'vue';

const footerLink = shallowRef([
  {
    title: 'Terms and Conditions'
  },
  {
    title: 'Privacy Policy'
  },
  {
    title: 'CA Privacy Notice'
  }
]);
</script>
<template>
  <v-footer class="px-0 pt-2">
    <v-row justify="center" no-gutters>
      <v-col cols="12" md="6" class="text-md-left text-center">
        <p class="text-subtitle-2 text-lightText mb-md-0 mb-4">
          This site is protected by
          <a href="/" class="text-primary">Privacy Policy</a>
        </p>
      </v-col>
      <v-col class="d-flex flex-md-row flex-column justify-md-end align-center" cols="12" md="6">
        <a
          v-for="(item, i) in footerLink"
          :key="i"
          class="mx-md-3 mx-2 mb-md-0 mb-2 text-subtitle-2 text-lightText"
          href="https://codedthemes.com"
          target="_blank"
        >
          {{ item.title }}
        </a>
      </v-col>
    </v-row>
  </v-footer>
</template>
