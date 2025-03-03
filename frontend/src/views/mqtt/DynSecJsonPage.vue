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
          Import/export ACL
          <v-spacer></v-spacer>
        </v-card-title>
  
        <v-card-text>
          <v-alert
            v-if="alert.show"
            :type="alert.type"
            variant="tonal"
            class="mb-4"
            dismissible
            @click:close="alert.show = false"
          >
            {{ alert.message }}
          </v-alert>
  
          <div class="mb-4">
            <p>Easily import /export ACL from and into BunkerM.</p>
          </div>
  
          <v-row>
            <v-col cols="12" sm="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Import ACL</v-card-title>
                <v-card-text>
                  <p>Upload BunkerM ACL JSON file to import client lists, roles, and groups.</p>
                  <v-form ref="importForm" @submit.prevent="uploadFile">
                    <v-file-input
                      v-model="importFile"
                      accept=".json"
                      label="Select dynamic security JSON file"
                      :rules="[rules.required]"
                      show-size
                      prepend-icon="mdi-file-upload"
                      :disabled="loading"
                    >
                      <template v-slot:selection="{ fileNames }">
                        <template v-for="(fileName, index) in fileNames" :key="index">
                          <v-chip
                            class="me-2"
                            label
                            size="small"
                          >
                            {{ fileName }}
                          </v-chip>
                        </template>
                      </template>
                    </v-file-input>
  
                    <div class="d-flex justify-end mt-4">
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                        :disabled="!importFile || loading"
                      >
                        <UploadIcon v-if="!loading" stroke-width="1.5" size="22" class="me-2" />
                        Import ACL
                      </v-btn>
                    </div>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Export ACL</v-card-title>
                <v-card-text>
                  <p>Download the current BunkerM ACL file.</p>
                  <p class="mt-4">This will export all clients, roles, and groups currently configured in the system.</p>
                  
                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      color="secondary"
                      @click="exportDynSecJson"
                      :loading="exporting"
                      :disabled="exporting"
                    >
                      <DownloadIcon v-if="!exporting" stroke-width="1.5" size="22" class="me-2" />
                      Export ACL
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
  
          <v-divider class="my-6"></v-divider>
  
          <div v-if="importResults.show" class="mt-4">
            <h3 class="text-h6 mb-3">Import Results</h3>
            
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex flex-wrap gap-4">
                  <div>
                    <div class="text-h5 font-weight-bold text-primary">{{ importResults.stats.users }}</div>
                    <div class="text-caption">Users</div>
                  </div>
                  
                  <div>
                    <div class="text-h5 font-weight-bold text-info">{{ importResults.stats.groups }}</div>
                    <div class="text-caption">Groups</div>
                  </div>
                  
                  <div>
                    <div class="text-h5 font-weight-bold text-success">{{ importResults.stats.roles }}</div>
                    <div class="text-caption">Roles</div>
                  </div>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" variant="tonal" @click="showResetDialog = true" class="me-2">
                  <AlertTriangleIcon stroke-width="1.5" size="22" class="me-2" />
                  Reset to Default
                </v-btn>
                <v-btn color="primary" variant="tonal" @click="showRestartDialog = true">
                  <RefreshIcon stroke-width="1.5" size="22" class="me-2" />
                  Restart Mosquitto
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
  
          <div v-if="currentConfig" class="mt-6">
            <h3 class="text-h6 mb-3">Current ACL Summary</h3>
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex flex-wrap gap-4">
                  <div>
                    <div class="text-h5 font-weight-bold text-primary">{{ currentConfigStats.users }}</div>
                    <div class="text-caption">Users</div>
                  </div>
                  
                  <div>
                    <div class="text-h5 font-weight-bold text-info">{{ currentConfigStats.groups }}</div>
                    <div class="text-caption">Groups</div>
                  </div>
                  
                  <div>
                    <div class="text-h5 font-weight-bold text-success">{{ currentConfigStats.roles }}</div>
                    <div class="text-caption">Roles</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- Reset Confirmation Dialog -->
      <v-dialog v-model="showResetDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-error">Reset Dynamic Security Configuration</v-card-title>
          <v-card-text>
            <p>You are about to reset the dynamic security configuration to its default state.</p>
            <p class="mt-2 text-warning">Warning: This will remove all custom users, groups, and roles. Only the admin user and role will remain.</p>
            <p class="mt-2">Are you sure you want to proceed?</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" text @click="showResetDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="resetDynSecJson" :loading="resetting">
              <AlertTriangleIcon v-if="!resetting" stroke-width="1.5" size="18" class="me-2" />
              Reset Configuration
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <!-- Restart Confirmation Dialog -->
      <v-dialog v-model="showRestartDialog" max-width="500px">
        <v-card>
          <v-card-title>Restart Mosquitto Broker</v-card-title>
          <v-card-text>
            <p>The dynamic security configuration has been successfully imported. For the changes to take effect, the Mosquitto broker needs to be restarted.</p>
            <p class="mt-2 text-warning">Note: Restarting the broker will temporarily disconnect all MQTT clients.</p>
            <p class="mt-2">Would you like to restart the Mosquitto broker now?</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" text @click="showRestartDialog = false">Later</v-btn>
            <v-btn color="primary" @click="restartMosquitto" :loading="restarting">
              <RefreshIcon v-if="!restarting" stroke-width="1.5" size="18" class="me-2" />
              Restart Now
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <!-- Restart Result Dialog -->
      <v-dialog v-model="showRestartResultDialog" max-width="500px">
        <v-card>
          <v-card-title>
            <span :class="restartSuccess ? 'text-success' : 'text-error'">
              {{ restartSuccess ? 'Restart Successful' : 'Restart Failed' }}
            </span>
          </v-card-title>
          <v-card-text>
            <p>{{ restartMessage }}</p>
            <v-alert v-if="!restartSuccess" type="warning" variant="tonal" class="mt-2">
              You may need to restart the Mosquitto broker manually to apply the changes.
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="showRestartResultDialog = false">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Format Error Dialog -->
      <v-dialog v-model="showFormatErrorDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-error">
            Invalid File Format
          </v-card-title>
          <v-card-text>
            <p>The uploaded file could not be processed because it doesn't match the expected dynamic security JSON format.</p>
            <p class="mt-2">Please check that your file:</p>
            <ul class="mt-2">
              <li>Is a valid JSON file</li>
              <li>Contains the required sections: defaultACLAccess, clients, groups, and roles</li>
              <li>Has not been corrupted or modified manually</li>
            </ul>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="showFormatErrorDialog = false">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, computed } from 'vue';
  import { mqttService } from '@/services/mqtt.service';
  import { useSnackbar } from '@/composables/useSnackbar';
  import { UploadIcon, DownloadIcon, RefreshIcon, AlertTriangleIcon } from 'vue-tabler-icons';
  
  const { showSuccess, showError } = useSnackbar();
  
  // Form state
  const importForm = ref(null);
  const importFile = ref(null);
  const loading = ref(false);
  const exporting = ref(false);
  const currentConfig = ref(null);
  
  // Dialog states
  const showFormatErrorDialog = ref(false);
  const showRestartDialog = ref(false);
  const showRestartResultDialog = ref(false);
  const showResetDialog = ref(false);
  const restarting = ref(false);
  const resetting = ref(false);
  const restartSuccess = ref(false);
  const restartMessage = ref('');
  
  // Import results
  const importResults = reactive({
    show: false,
    stats: {
      users: 0,
      groups: 0,
      roles: 0
    }
  });
  
  // Alert state
  const alert = reactive({
    show: false,
    type: 'info',
    message: ''
  });
  
  // Computed properties
  const currentConfigStats = computed(() => {
    if (!currentConfig.value) return { users: 0, groups: 0, roles: 0 };
    
    // Count non-admin users
    const users = currentConfig.value.clients
      ? currentConfig.value.clients.filter(client => client.username !== 'bunker').length
      : 0;
    
    // Count groups
    const groups = currentConfig.value.groups ? currentConfig.value.groups.length : 0;
    
    // Count non-admin roles
    const roles = currentConfig.value.roles
      ? currentConfig.value.roles.filter(role => role.rolename !== 'admin').length
      : 0;
    
    return { users, groups, roles };
  });
  
  // Validation rules
  const rules = {
    required: value => !!value || 'File is required'
  };
  
  // Fetch current configuration on component mount
  onMounted(async () => {
    await fetchCurrentConfig();
  });
  
  async function fetchCurrentConfig() {
    try {
      const response = await mqttService.getDynSecJson();
      
      if (response && response.success) {
        currentConfig.value = response.data;
      } else {
        console.error('Failed to fetch dynamic security configuration');
      }
    } catch (error) {
      console.error('Error fetching dynamic security configuration:', error);
    }
  }
  
  // Upload the dynamic security JSON file
  async function uploadFile() {
    if (!importFile.value) return;
    
    try {
      loading.value = true;
      
      // Create form data
      const formData = new FormData();
      formData.append('file', importFile.value);
      
      // Send to backend
      const response = await mqttService.importDynSecJson(formData);
      
      if (response && response.success) {
        // Update import results
        importResults.show = true;
        importResults.stats = response.stats || { users: 0, groups: 0, roles: 0 };
        
        // Show success message
        showSuccess(`Successfully imported dynamic security configuration`);
        alert.show = true;
        alert.type = 'success';
        alert.message = `Configuration imported: ${importResults.stats.users} users, ${importResults.stats.groups} groups, ${importResults.stats.roles} roles.`;
        
        // Prompt for restart
        setTimeout(() => {
          showRestartDialog.value = true;
        }, 1000);
        
        // Refresh current config
        await fetchCurrentConfig();
      } else {
        // Handle failure response
        showError(response.message || 'Import failed');
        alert.show = true;
        alert.type = 'error';
        alert.message = response.message || 'Failed to process dynamic security JSON file. Please check the file format.';
        showFormatErrorDialog.value = true;
      }
    } catch (error) {
      console.error('Error uploading dynamic security JSON file:', error);
      showError('Failed to process dynamic security JSON file');
      alert.show = true;
      alert.type = 'error';
      alert.message = error.message || 'Failed to process dynamic security JSON file. Please check the file format.';
      showFormatErrorDialog.value = true;
    } finally {
      loading.value = false;
      importFile.value = null;
    }
  }
  
 // Export the dynamic security JSON file
 async function exportDynSecJson() {
  try {
    exporting.value = true;
    
    // Use the mqtt service's exportDynSecJson method
    const result = await mqttService.exportDynSecJson();
    
    if (result.success) {
      showSuccess('Dynamic security configuration exported successfully');
    } else {
      throw new Error(result.message || 'Export failed');
    }
  } catch (error) {
    console.error('Error exporting dynamic security JSON:', error);
    showError(`Failed to export dynamic security configuration: ${error.message}`);
    alert.show = true;
    alert.type = 'error';
    alert.message = `Failed to export dynamic security configuration: ${error.message}. Please try again.`;
  } finally {
    exporting.value = false;
  }
}
  
  // Reset dynamic security JSON to default
  async function resetDynSecJson() {
    try {
      resetting.value = true;
      
      const response = await mqttService.resetDynSecJson();
      
      if (response && response.success) {
        showSuccess('Dynamic security configuration reset to default');
        
        // Show restart dialog
        showResetDialog.value = false;
        setTimeout(() => {
          showRestartDialog.value = true;
        }, 500);
        
        // Reset import results
        importResults.show = false;
        
        // Refresh current config
        await fetchCurrentConfig();
      } else {
        showError(response.message || 'Failed to reset dynamic security configuration');
      }
    } catch (error) {
      console.error('Error resetting dynamic security JSON:', error);
      showError('Failed to reset dynamic security configuration');
    } finally {
      resetting.value = false;
    }
  }
  
  // Restart Mosquitto broker
  async function restartMosquitto() {
    try {
      restarting.value = true;
      
      // Call the restart endpoint
      const response = await mqttService.restartMosquitto();
      
      // Set result state
      restartSuccess.value = response.success;
      restartMessage.value = response.message || (response.success ? 
        'Mosquitto broker restarted successfully.' : 
        'Failed to restart Mosquitto broker.');
        
      // Close the confirmation dialog and show result dialog
      showRestartDialog.value = false;
      
      // Small delay before showing result
      setTimeout(() => {
        showRestartResultDialog.value = true;
      }, 500);
      
      if (response.success) {
        showSuccess('Mosquitto broker restarted successfully');
      } else {
        showError('Failed to restart Mosquitto broker');
      }
      
    } catch (error) {
      console.error('Error restarting Mosquitto broker:', error);
      restartSuccess.value = false;
      restartMessage.value = error.message || 'An error occurred while restarting the Mosquitto broker.';
      
      showRestartDialog.value = false;
      showRestartResultDialog.value = true;
      showError('Failed to restart Mosquitto broker');
    } finally {
      restarting.value = false;
    }
  }
  </script>