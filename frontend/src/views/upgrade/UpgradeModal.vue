<template>
    <v-dialog :model-value="show" @update:model-value="$emit('close')" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Upgrade Required</v-card-title>
        <v-card-text>
          This feature requires a Pro subscription. Upgrade now to access advanced bridge configuration capabilities.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="handleUpgrade">Upgrade to Pro</v-btn>
          <v-btn color="grey" variant="text" @click="$emit('close')">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  const props = defineProps({
    show: Boolean
  });
  
  defineEmits(['close']);
  
  const handleUpgrade = () => {
    window.location.href = 'https://bunkeriot.com/#product';
  };
  </script>