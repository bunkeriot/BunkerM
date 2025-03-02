/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup>
const props = defineProps({ item: Object });
</script>

<template>
  <v-list-subheader color="lightText" class="smallCap text-subtitle-2">{{ $t(props.item.header) }}</v-list-subheader>
</template>
