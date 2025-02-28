<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        Import Mosquitto Password File
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
          <p>This feature allows you to import users from a <code>mosquitto_passwd</code> file while keeping their original passwords.</p>
        </div>

        <v-form ref="form" @submit.prevent="uploadFile">
          <v-file-input
            v-model="file"
            accept=".txt"
            label="Select mosquitto_passwd file"
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
              :disabled="!file || loading"
            >
              <UploadIcon v-if="!loading" stroke-width="1.5" size="22" class="me-2" />
              Import Users
            </v-btn>
          </div>
        </v-form>

        <v-divider class="my-6"></v-divider>

        <div v-if="processingResults.total > 0" class="mt-4">
          <h3 class="text-h6 mb-3">Import Results</h3>
          
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex flex-wrap gap-4">
                <div>
                  <div class="text-h5 font-weight-bold text-primary">{{ processingResults.total }}</div>
                  <div class="text-caption">Total Users</div>
                </div>
                
                <div>
                  <div class="text-h5 font-weight-bold text-success">{{ processingResults.imported }}</div>
                  <div class="text-caption">Successfully Imported</div>
                </div>
                
                <div>
                  <div class="text-h5 font-weight-bold text-warning">{{ processingResults.skipped }}</div>
                  <div class="text-caption">Skipped</div>
                </div>
                
                <div>
                  <div class="text-h5 font-weight-bold text-error">{{ processingResults.failed }}</div>
                  <div class="text-caption">Failed</div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="tonal" @click="showRestartDialog = true">
                <RefreshIcon stroke-width="1.5" size="22" class="me-2" />
                Restart Mosquitto
              </v-btn>
            </v-card-actions>
          </v-card>

          <div v-if="processingResults.details.length > 0">
            <h4 class="text-subtitle-1 mb-2">Processing Details</h4>
            <v-data-table
              :headers="detailsHeaders"
              :items="processingResults.details"
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                  label
                >
                  {{ item.status }}
                </v-chip>
              </template>
            </v-data-table>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Restart Confirmation Dialog -->
    <v-dialog v-model="showRestartDialog" max-width="500px">
      <v-card>
        <v-card-title>Restart Mosquitto Broker</v-card-title>
        <v-card-text>
          <p>The password file has been successfully imported. For the changes to take effect, the Mosquitto broker needs to be restarted.</p>
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
          <p>The uploaded file could not be processed because it doesn't match the expected mosquitto_passwd format.</p>
          <p class="mt-2">Please check that your file:</p>
          <ul class="mt-2">
            <li>Contains entries in the format <code>username:$hashtype$hashvalue</code></li>
            <li>Was generated using the mosquitto_passwd utility</li>
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
import { ref, reactive, onMounted } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';
import { UploadIcon, RefreshIcon } from 'vue-tabler-icons';

const { showSuccess, showError } = useSnackbar();

// Form state
const form = ref(null);
const file = ref(null);
const loading = ref(false);

// Removing role & group assignment functionality
// Showing format error dialog
const showFormatErrorDialog = ref(false);

// Restart dialog state
const showRestartDialog = ref(false);
const showRestartResultDialog = ref(false);
const restarting = ref(false);
const restartSuccess = ref(false);
const restartMessage = ref('');

// Processing results
const processingResults = reactive({
  total: 0,
  imported: 0,
  skipped: 0,
  failed: 0,
  details: []
});

// Alert state
const alert = reactive({
  show: false,
  type: 'info',
  message: ''
});

// Table headers for details
const detailsHeaders = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Message', key: 'message', sortable: false }
];

// Validation rules
const rules = {
  required: value => !!value || 'File is required'
};

// Get color based on status
function getStatusColor(status) {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'UPDATED':
      return 'info';
    case 'SKIPPED':
      return 'warning';
    case 'ERROR':
      return 'error';
    default:
      return 'grey';
  }
}

// Upload the password file
async function uploadFile() {
  if (!file.value) return;
  
  try {
    loading.value = true;
    
    // Clear previous results
    processingResults.total = 0;
    processingResults.imported = 0;
    processingResults.skipped = 0;
    processingResults.failed = 0;
    processingResults.details = [];
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file.value);
    
    // Send to backend
    const response = await mqttService.importPasswordFile(formData);
    
    // Update processing results
    if (response && response.results) {
      processingResults.total = response.results.total || 0;
      processingResults.imported = response.results.imported || 0;
      processingResults.skipped = response.results.skipped || 0;
      processingResults.failed = response.results.failed || 0;
      processingResults.details = response.results.details || [];
      
      // Check if any users were imported
      if (processingResults.total === 0 || processingResults.imported === 0) {
        // Show format error dialog
        showFormatErrorDialog.value = true;
        alert.show = true;
        alert.type = 'error';
        alert.message = 'Import failed: No users were imported. The file format may be invalid.';
      } else {
        // Show success message
        showSuccess(`Successfully processed ${processingResults.imported} users from password file`);
        alert.show = true;
        alert.type = 'success';
        alert.message = `File processed: ${processingResults.imported} users imported, ${processingResults.skipped} skipped, ${processingResults.failed} failed.`;
        
        // If users were successfully imported, prompt for restart
        if (processingResults.imported > 0) {
          // Wait a short delay before showing restart dialog to let user see the results first
          setTimeout(() => {
            showRestartDialog.value = true;
          }, 1000);
        }
      }
    } else if (!response.success) {
      // Handle explicit failure response
      showError(response.message || 'Import failed');
      alert.show = true;
      alert.type = 'error';
      alert.message = response.message || 'Failed to process password file. Please check the file format.';
      showFormatErrorDialog.value = true;
    }
    
    // Reset file input
    file.value = null;
    
  } catch (error) {
    console.error('Error uploading password file:', error);
    showError('Failed to process password file');
    alert.show = true;
    alert.type = 'error';
    alert.message = error.message || 'Failed to process password file. Please check the file format.';
    showFormatErrorDialog.value = true;
  } finally {
    loading.value = false;
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