<script setup>
const props = defineProps({ item: Object });
</script>

<template>
  <v-list-subheader color="lightText" class="smallCap text-subtitle-2">{{ $t(props.item.header) }}</v-list-subheader>
</template>
