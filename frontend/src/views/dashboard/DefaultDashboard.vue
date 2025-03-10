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

// DefaultDashboard.vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';  // Remove Ref import
import WidgetFive from './components/WidgetFive.vue';
import UniqueVisitor from './components/UniqueVisitor.vue';
import IncomeOverview from './components/IncomeOverview.vue';
import { generateNonce } from '../../utils/security';
import { getRuntimeConfig } from '@/config/runtime';

const config = getRuntimeConfig();
// API configuration
const API_BASE_URL = config.MONITOR_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

interface HistoricalData {
  timestamps: string[];
  bytes_received: number[];
  bytes_sent: number[];
}

interface MessageStats {
  dates: string[];
  counts: number[];
}

interface ByteStats {
  timestamps: string[];
  bytes_received: number[];
  bytes_sent: number[];
}

interface Stats {
  total_messages_received: number;
  total_subscriptions: number;
  retained_messages: number;
  total_connected_clients: number;
  bytes_stats: ByteStats;      // For UniqueVisitor component
  daily_message_stats: {       // For IncomeOverview component
    dates: string[];
    counts: number[];
  };
}

// Default state
const defaultStats: Stats = {
  total_messages_received: 0,
  total_subscriptions: 0,
  retained_messages: 0,
  total_connected_clients: 0,
  bytes_stats: {
    timestamps: [],
    bytes_received: [],
    bytes_sent: []
  },
  daily_message_stats: {
    dates: [],
    counts: []
  }
};

const stats = ref(defaultStats as Stats);
const error = ref(null as string | null);
let intervalId: number | null = null;

// Update the computed property for weekly stats
const transformedWeeklyStats = computed(() => ({
  dates: stats.value.daily_message_stats.dates,
  counts: stats.value.daily_message_stats.counts
}));

const fetchStats = async () => {
  try {
    const timestamp = Date.now() / 1000;
    const nonce = generateNonce();

    const headers = {
      'X-API-Key': API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    const response = await fetch(
      `${API_BASE_URL}/stats?nonce=${nonce}&timestamp=${timestamp}`,
      {
        method: 'GET',
        headers: headers,
        mode: 'cors',
        credentials: 'omit'
      }
    );

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response body:', text);

      if (response.status === 403) {
        throw new Error('Authentication failed. Please check API key.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Update stats with the received data
    stats.value = {
      ...defaultStats,
      ...data
    };

    console.log("Stats updated:", stats.value);


  } catch (err) {
    console.error('Error fetching MQTT stats:', err);
    error.value = err instanceof Error ? err.message : 'MQTT Broker Disconnected';
  }

};

// Start polling when component mounts
onMounted(() => {
  // Remove HTTPS check since we're now using HTTP
  fetchStats();
  intervalId = window.setInterval(fetchStats, 2000);//15 min
});

// Clean up when component unmounts
onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div class="dashboard-container">
    <!-- Error alert -->
    <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4">
      {{ error }}
    </v-alert>

    <!-- MQTT Stats Cards -->
    <WidgetFive :total-messages-received="stats.total_messages_received"
      :total-connected-clients="stats.total_connected_clients" :total-subscriptions="stats.total_subscriptions"
      :retained-messages="stats.retained_messages" />

    <v-row>
      <!-- Message Rates Chart -->
      <v-col cols="12" sm="12" lg="12">
        <UniqueVisitor :byte-stats="stats.bytes_stats" />
      </v-col>

      <!-- Weekly Stats -->
<!--             <v-col cols="12" sm="12" lg="4">
        <IncomeOverview :message-stats="transformedWeeklyStats" />
      </v-col> -->
    </v-row>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>