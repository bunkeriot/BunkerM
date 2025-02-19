<template>
  <v-alert
    v-if="showCertWarning"
    type="info"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="dismissWarning"
  >
    This application uses a self-signed certificate for local HTTPS. If you see a certificate warning, this is normal.
  </v-alert>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ref, onMounted } from 'vue';

const showCertWarning = ref(false);

onMounted(() => {
  if (window.location.protocol === 'https:') {
    const warningDismissed = localStorage.getItem('certWarningDismissed');
    showCertWarning.value = !warningDismissed;
  }
});

function dismissWarning() {
  showCertWarning.value = false;
  localStorage.setItem('certWarningDismissed', 'true');
}

</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>