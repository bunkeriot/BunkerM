/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
// icons
import {
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  CommentOutlined,
  UnorderedListOutlined,
  EditOutlined,
  ProfileOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  RedditOutlined,
  PlayCircleOutlined,
  PoweroffOutlined
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';

const tab = ref("111");
const authStore = useAuthStore();
const router = useRouter();
const { showSuccess, showError } = useSnackbar();

// Dialog state for restart confirmation
const showRestartDialog = ref(false);
const showRestartResultDialog = ref(false);
const restarting = ref(false);
const restartSuccess = ref(false);
const restartMessage = ref('');

// Computed property for result title class
const resultTitleClass = computed(() => restartSuccess.value ? 'text-success' : 'text-error');

// Add logout handler
const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/auth/login'); // Redirect to login page after logout
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Open restart confirmation dialog
const openRestartDialog = () => {
  showRestartDialog.value = true;
};

// Restart Mosquitto broker
const restartMosquitto = async () => {
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

    // Add a small delay before showing result
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
};
</script>

<template>
  <div>
    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="111">
        <PlayCircleOutlined class="v-icon--start" /> Actions
      </v-tab>
      <v-tab value="222">
        <QuestionCircleOutlined class="v-icon--start" /> Support
      </v-tab>
    </v-tabs>

    <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 240px">
      <v-window v-model="tab">
        <v-window-item value="222">
          <v-list class="py-0" aria-label="profile list">
            <v-list-item color="primary" rounded="0" value="Support" href="https://bunkeriot.com/" target="_blank"
              rel="noopener noreferrer">
              <template v-slot:prepend>
                <InfoCircleOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">BunkerM</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Discussions"
              href="https://github.com/bunkeriot/BunkerM/discussions" target="_blank" rel="noopener noreferrer">
              <template v-slot:prepend>
                <CommentOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Discussions</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Releases"
              href="https://github.com/bunkeriot/BunkerM/releases" target="_blank" rel="noopener noreferrer">
              <template v-slot:prepend>
                <UnorderedListOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Releases</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Documentation" href="https://docs.bunkeriot.com/bunkerm/"
              target="_blank" rel="noopener noreferrer">
              <template v-slot:prepend>
                <ProfileOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Documentation</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Reddit" href="https://www.reddit.com/r/BunkerM/"
              target="_blank" rel="noopener noreferrer">
              <template v-slot:prepend>
                <RedditOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Reddit</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>

        <v-window-item value="111">
          <v-list class="py-0" aria-label="profile list">
            
            <v-list-item @click="$router.push('/mqtt/config')" color="primary" rounded="0" value="Broker Config">
              <template v-slot:prepend>
                <SettingOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Broker Config</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$router.push('/mqtt/dynsec-config')" color="primary" rounded="0" value="ACL">
              <template v-slot:prepend>
                <UploadOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Import/Export ACL</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openRestartDialog" color="primary" rounded="0" value="Restart Broker">
              <template v-slot:prepend>
                <PoweroffOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Restart Broker</v-list-item-title>
            </v-list-item>

            <v-list-item @click="handleLogout" color="secondary" rounded="0">
              <template v-slot:prepend>
                <LogoutOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>
      </v-window>
    </perfect-scrollbar>

    <!-- Restart Confirmation Dialog -->
    <v-dialog v-model="showRestartDialog" max-width="500px">
      <v-card>
        <v-card-title>Restart Mosquitto Broker</v-card-title>
        <v-card-text>
          <p>Are you sure you want to restart the Mosquitto broker?</p>
          <p class="mt-2 text-warning">Note: Restarting the broker will temporarily disconnect all MQTT clients.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="showRestartDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="restartMosquitto" :loading="restarting">
            <PoweroffOutlined v-if="!restarting" :style="{ fontSize: '14px' }" class="mr-2" />
            Restart Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restart Result Dialog -->
    <v-dialog v-model="showRestartResultDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="result-title" :class="resultTitleClass">
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
  </div>
</template>