<script setup lang="ts">
// assets
import avatarGroup from '@/assets/images/users/cluster.png';
</script>

<template>
  <v-sheet rounded="md" color="gray100" class="pa-4 ExtraBox hide-menu text-center" border>
    <div class="d-flex align-center flex-column">
      <v-img :src="avatarGroup" alt="book" height="58px" width="85px" cover></v-img>
      <div class="px-3">
        <h5 class="text-h5 mb-0 line-height-none"> Scale Your MQTT Workloads</h5>
        <small class="text-lightText text-h6">Get a Custom Edge Cluster!</small>
      </div>
    </div>
    <div class="mt-5">
      <a
        href="https://bunkeriot.com"
        target="_blank"
        class="v-btn v-theme--DefaultTheme bg-primary v-btn--density-default v-btn--size-default v-btn--variant-flat primary-shadow"
        >Reach Out!</a
      >
    </div>
  </v-sheet>
</template>
<style lang="scss">
.ExtraBox {
  position: relative;
  overflow: hidden;
}
.line-height-none {
  line-height: normal;
}
</style>
