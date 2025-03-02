/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts"></script>

<template>
  <v-row no-gutters class="overflow-hidden bg-containerBg" style="min-height: 100vh">
    <v-col class="d-flex align-center justify-center">
      <div class="text-center">
        <div class="errorMedia">
          <img src="@/assets/images/maintenance/Error500.png" alt="404" />
        </div>
        <h1 class="text-h1 mt-2 mb-1">Internal Server Error</h1>
        <p class="text-caption text-lightText">Server error 500. we fixing the problem. please try <br />again at a later stage.</p>
        <v-btn variant="flat" color="primary" class="mt-4" to="/dashboard/analytics"> Back To Home</v-btn>
      </div>
    </v-col>
  </v-row>
</template>
<style lang="scss">
.errorMedia {
  > img {
    @media (min-width: 0px) {
      width: 350px;
    }
    @media (min-width: 768px) {
      width: 396px;
    }
  }
}
</style>
