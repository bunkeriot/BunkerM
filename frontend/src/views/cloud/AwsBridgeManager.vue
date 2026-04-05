<!-- Copyright (c) 2025 BunkerM

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
        AWS IoT Bridge Configuration
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="submitForm" ref="form">
          <!-- AWS IoT Endpoint -->
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.awsEndpoint" label="AWS IoT Endpoint"
                placeholder="example.iot.region.amazonaws.com" variant="outlined" density="compact"
                :rules="[v => !!v || 'AWS IoT Endpoint is required']" required></v-text-field>
            </v-col>
          </v-row>

          <!-- Client ID -->
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="formData.clientId" label="MQTT Client ID" placeholder="my-bridge-client"
                variant="outlined" density="compact" :rules="[v => !!v || 'Client ID is required']"
                required></v-text-field>
            </v-col>
          </v-row>

          <!-- Topics -->
          <v-row>
            <v-col cols="12">
              <v-textarea v-model="formData.topics" label="Topics (one per line)" placeholder="sensor/#&#10;control/#"
                variant="outlined" density="compact" :rules="[v => !!v || 'At least one topic is required']"
                required></v-textarea>
            </v-col>
          </v-row>

          <!-- Certificate Files -->
          <v-row>
            <v-col cols="12">
              <v-file-input v-model="files.cert" label="Certificate File (.pem)" accept=".pem,.crt" variant="outlined"
                density="compact" :rules="[v => !!v || 'Certificate file is required']"
                @change="handleFileInput('cert', $event)" required></v-file-input>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-file-input v-model="files.key" label="Private Key File (.pem)" accept=".pem,.key" variant="outlined"
                density="compact" :rules="[v => !!v || 'Private key file is required']"
                @change="handleFileInput('key', $event)" required></v-file-input>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-file-input v-model="files.ca" label="CA Certificate File (.pem)" accept=".pem" variant="outlined"
                density="compact" :rules="[v => !!v || 'CA certificate file is required']"
                @change="handleFileInput('ca', $event)" required></v-file-input>
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
import { awsBridgeService } from '@/services/awsBridgeService';
import UpgradeModal from '@/views/upgrade/UpgradeModal.vue';

const form = ref(null);
const isSubmitting = ref(false);
const alert = ref(null);

const showUpgradeModal = ref(false);


const formData = reactive({
  awsEndpoint: '',
  clientId: '',
  topics: ''
});

const files = reactive({
  cert: null,
  key: null,
  ca: null
});

const handleFileInput = (type, event) => {
  files[type] = event?.target?.files?.[0] || null;
};

const resetForm = () => {
  formData.awsEndpoint = '';
  formData.clientId = '';
  formData.topics = '';
  files.cert = null;
  files.key = null;
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

    // Create the bridge config object
    const bridgeConfigData = {
      aws_endpoint: formData.awsEndpoint.trim(),
      client_id: formData.clientId.trim(),
      topics: formData.topics.split('\n').filter(t => t.trim())
    };

    // Create FormData
    const formDataToSend = new FormData();

    // Add bridge_config as a JSON string
    formDataToSend.append('bridge_config', JSON.stringify(bridgeConfigData));

    // Append certificate files
    if (files.cert) {
      formDataToSend.append('cert_file', files.cert);
    }
    if (files.key) {
      formDataToSend.append('key_file', files.key);
    }
    if (files.ca) {
      formDataToSend.append('ca_file', files.ca);
    }

    // Debug log
    console.log('Sending bridge_config:', bridgeConfigData);
    console.log('Files:', {
      cert: files.cert?.name,
      key: files.key?.name,
      ca: files.ca?.name
    });

    const result = await awsBridgeService.configureBridge(formDataToSend);

    alert.value = {
      type: 'success',
      message: result.message || 'Bridge configured successfully!'
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