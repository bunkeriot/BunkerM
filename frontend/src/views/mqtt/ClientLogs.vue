<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import UiTitleCard from '@/components/shared/UiTitleCard.vue';

import {
    CheckCircleOutlined,
    StopOutlined
} from '@ant-design/icons-vue';

interface MQTTEvent {
  id: string;
  timestamp: string;
  event_type: string;
  client_id: string;
  details: string;
  status: 'success' | 'warning' | 'error';
  protocol_level: string;
  clean_session: boolean;
  keep_alive: number;
  username: string;
  ip_address: string;
  port: number;
}

const events = ref<MQTTEvent[]>([]);
const search = ref('');
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('');

const API_BASE_URL = import.meta.env.VITE_EVENT_API_URL;

const headers = [
  { title: 'Time', key: 'timestamp', sortable: true },
  { title: 'Event Type', key: 'event_type', sortable: true },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Client ID', key: 'client_id', sortable: true },
  { title: 'Protocol', key: 'protocol_level', sortable: true },
  { title: 'Details', key: 'details', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Action', key: 'actions', sortable: false },
];

const filteredEvents = computed(() => {
  return events.value.filter(event => event.username !== 'bunker');
});


const showNotification = (message: string, color: string = 'success') => {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
};

// Format timestamp to readable format
const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

// Fetch events from the API
const fetchEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events`);  // Changed from /event
    const data = await response.json();
    events.value = data.events;
  } catch (error) {
    console.error('Error fetching MQTT events:', error);
  }
};

const enableClient = async (username: string) => {
  try {
    const encodedUsername = encodeURIComponent(username);
    await fetch(`${API_BASE_URL}/enable/${encodedUsername}`, {
      method: 'POST'
    });
    await fetchEvents();
    showNotification(`Client "${username}" has been successfully enabled`);
  } catch (error) {
    console.error('Error enabling client:', error);
    showNotification('Failed to enable client. Please try again.', 'error');
  }
};

const DisableClient = async (username: string) => {
  try {
    const encodedUsername = encodeURIComponent(username);
    await fetch(`${API_BASE_URL}/disable/${encodedUsername}`, {
      method: 'POST'
    });
    await fetchEvents();
    showNotification(`Client "${username}" has been successfully disabled`, 'warning');
  } catch (error) {
    console.error('Error disabling client:', error);
    showNotification('Failed to disable client. Please try again.', 'error');
  }
};

// Set up polling for updates
onMounted(() => {
  fetchEvents();
  setInterval(fetchEvents, 5000); // Poll every 5 seconds
});
</script>

<template>
  <UiTitleCard title="Recent MQTT Events" class-name="px-0 pb-0 rounded-md">
    <!-- Search Bar -->
    <div class="px-4 py-3">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        variant="outlined"
        density="compact"
      ></v-text-field>
    </div>

    <v-data-table
      :headers="headers"
      :items="filteredEvents"
      :search="search"
      hover
      class="elevation-1"
      :items-per-page="10"
      :items-per-page-options="[5, 10, 20, 50]"
    >
      <template v-slot:item.timestamp="{ item }">
        {{ formatTimestamp(item.timestamp) }}
      </template>

      <template v-slot:item.client_id="{ item }">
        <router-link to="/dashboard/default" class="text-secondary link-hover">
          {{ item.client_id }}
        </router-link>
      </template>

      <template v-slot:item.status="{ item }">
        <div class="flex items-center">
          <component
            :is="item.event_type === 'Client Connection' ? CheckCircleOutlined : StopOutlined"
            :style="{ 
              color: item.event_type === 'Client Connection' ? '#52c41a' : '#ff4d4f',
              fontSize: '16px'
            }"
          />
        </div>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          v-if="item.status === 'success'"
          color="error"
          size="small"
          @click="DisableClient(item.username)"
        >
          Disable
        </v-btn>
        <v-btn
          v-if="item.status === 'warning'"
          color="success"
          size="small"
          @click="enableClient(item.username)"
        >
          Enable
        </v-btn>
      </template>
    </v-data-table>
    
    <!-- Notification Snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </v-snackbar>
  </UiTitleCard>
</template>