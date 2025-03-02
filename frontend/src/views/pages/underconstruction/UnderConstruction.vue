/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts"></script>

<template>
  <v-row no-gutters class="bg-containerBg" style="min-height: 100vh">
    <v-col class="d-flex align-center justify-center">
      <div class="text-center">
        <div class="constructionWrapper">
          <img src="@/assets/images/maintenance/under-construction.svg" alt="under construction" />
        </div>
        <h1 class="text-h1 mt-9 mb-3">Under Construction</h1>
        <p class="text-h6 text-lightText constructionContent">
          Hey! Please check out this site later. We are doing some maintenance on it right now.
        </p>
        <v-btn variant="flat" color="primary" to="/dashboard/analytics">Back To Home</v-btn>
      </div>
    </v-col>
  </v-row>
</template>
<style lang="scss">
.constructionWrapper {
  @media (min-width: 0px) {
    width: 300px;
    margin-inline: auto;
  }
  @media (min-width: 768px) {
    width: 480px;
  }
}
.constructionContent {
  width: 83%;
  margin-inline: auto;
}
</style>
