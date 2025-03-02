// AzureBridgeManager.vue
<!-- Copyright (c) 2025 BunkerIoT

Licensed under the Apache License, Version 2.0 (the "License");  
you may not use this file except in compliance with the License.  
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software  
distributed under the License is distributed on an "AS IS" BASIS,  
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
See the License for the specific language governing permissions and  
limitations under the License. -->
<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        Azure IoT Hub Bridge Configuration
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="submitForm" ref="form">
          <!-- IoT Hub Name -->
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.hubName" label="IoT Hub Name" placeholder="myhub" variant="outlined"
                density="compact" :rules="[v => !!v || 'IoT Hub Name is required']" required></v-text-field>
            </v-col>
          </v-row>

          <!-- Device ID -->
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.deviceId" label="Device ID" placeholder="mydevice" variant="outlined"
                density="compact" :rules="[v => !!v || 'Device ID is required']" required></v-text-field>
            </v-col>
          </v-row>

          <!-- SAS Token -->
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.sasToken" label="SAS Token" placeholder="SharedAccessSignature sr=..."
                variant="outlined" density="compact" :rules="[v => !!v || 'SAS Token is required']" type="password"
                required></v-text-field>
            </v-col>
          </v-row>

          <!-- API Version -->
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.apiVersion" label="API Version" placeholder="2019-03-31"
                variant="outlined" density="compact" :rules="[v => !!v || 'API Version is required']"
                required></v-text-field>
            </v-col>
          </v-row>

          <!-- Topics -->
          <v-row>
            <v-col cols="12">
              <v-textarea v-model="formData.topics" label="Topics (one per line)"
                placeholder="devices/mydevice/messages/events/#" variant="outlined" density="compact"
                :rules="[v => !!v || 'At least one topic is required']" required></v-textarea>
            </v-col>
          </v-row>

          <!-- CA Certificate File -->
          <v-row>
            <v-col cols="12">
              <v-file-input v-model="files.ca" label="Azure IoT Hub Root CA Certificate (.pem)" accept=".pem"
                variant="outlined" density="compact" :rules="[v => !!v || 'Root CA certificate is required']"
                required></v-file-input>
            </v-col>
          </v-row>

          <!-- Submit Button -->
          <v-row>
            <v-col cols="12" class="d-flex justify-end">
              <v-btn color="primary" @click="showUpgradeModal = true">
                Configure Bridge
              </v-btn>
            </v-col>
          </v-row>

        </v-form>
        <UpgradeModal :show="showUpgradeModal" @close="showUpgradeModal = false" />
        <!-- Alert Messages -->
        <v-row v-if="alert">
          <v-col cols="12">
            <v-alert :type="alert.type" variant="tonal" closable @click:close="alert = null">
              {{ alert.message }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAzureBridge } from '@/composables/useAzureBridge';
import UpgradeModal from '@/views/upgrade/UpgradeModal.vue';

const form = ref(null);
const isSubmitting = ref(false);
const alert = ref(null);

const showUpgradeModal = ref(false);
const formData = reactive({
  hubName: '',
  deviceId: '',
  sasToken: '',
  apiVersion: '2019-03-31',
  topics: 'devices/mydevice/messages/events/#'
});

const files = reactive({
  ca: null
});

const { configureBridge } = useAzureBridge();

const resetForm = () => {
  formData.hubName = '';
  formData.deviceId = '';
  formData.sasToken = '';
  formData.apiVersion = '2019-03-31';
  formData.topics = 'devices/mydevice/messages/events/#';
  files.ca = null;
  if (form.value) {
    form.value.reset();
  }
};

const submitForm = async () => {
  if (!form.value) return;

  const { valid } = await form.value.validate();

  if (!valid) return;

  try {
    isSubmitting.value = true;
    alert.value = null;

    const formDataToSend = new FormData();
    formDataToSend.append('bridge_config', JSON.stringify({
      hub_name: formData.hubName,
      device_id: formData.deviceId,
      sas_token: formData.sasToken,
      api_version: formData.apiVersion,
      topics: formData.topics.split('\n').filter(t => t.trim())
    }));

    // Append CA file
    if (files.ca) {
      formDataToSend.append('ca_file', files.ca);
    }

    const result = await configureBridge(formDataToSend);

    alert.value = {
      type: 'success',
      message: result.message || 'Azure IoT Hub bridge configured successfully!'
    };

    resetForm();

  } catch (error) {
    console.error('Error configuring bridge:', error);
    alert.value = {
      type: 'error',
      message: error.response?.data?.detail || error.message || 'Failed to configure bridge'
    };
  } finally {
    isSubmitting.value = false;
  }
};
</script>