/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup>
const props = defineProps({ item: Object, level: Number });
</script>

<template>
  <!---Single Item-->
  <v-list-item
    :to="item.type === 'external' ? '' : item.to"
    :href="item.type === 'external' ? item.to : ''"
    rounded
    class="mb-1"
    color="primary"
    :disabled="item.disabled"
    :target="item.type === 'external' ? '_blank' : ''"
  >
    <!---If icon-->
    <template v-slot:prepend>
      <component :is="props.item.icon" class="iconClass" :level="props.level"></component>
    </template>
    <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
    <!---If Caption-->
    <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
      {{ item.subCaption }}
    </v-list-item-subtitle>
    <!---If any chip or label-->
    <template v-slot:append v-if="item.chip">
      <v-chip
        label
        :color="item.chipColor"
        class="sidebarchip hide-menu"
        size="small"
        :variant="item.chipVariant"
        :prepend-icon="item.chipIcon"
      >
        {{ item.chip }}
      </v-chip>
    </template>
  </v-list-item>
</template>
