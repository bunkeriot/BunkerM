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

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import UiTitleCard from '@/components/shared/UiTitleCard.vue';
import { mdiReload, mdiDownload, mdiMagnify, mdiClose } from '@mdi/js';

interface LogEntry {
  id: number;
  timestamp: number | null;
  level: string;
  message: string;
}

interface LogData {
  timestamp?: string;
  level?: string;
  message?: string;
}

const logs = ref<LogEntry[]>([]);
const filteredLogs = ref<LogEntry[]>([]);
const search = ref<string>('');
const isLoading = ref<boolean>(false);
const autoRefresh = ref<boolean>(true);
const refreshInterval = ref<number | null>(null);
const levelFilter = ref<string>('all');

// Fetch logs from the backend
const fetchLogs = async () => {
  isLoading.value = true;
  try {
    const response = await fetch('/api/logs/broker');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    
    // Process log entries
    logs.value = data.logs.map((log: string | LogData, index: number): LogEntry => {
      // Extract timestamp and level from the log entry
      const timestampMatch = typeof log === 'string' ? log.match(/^(\d+):/) : null;
      const levelMatch = typeof log === 'string' ? log.match(/\[(INFO|WARNING|ERROR|DEBUG)\]/i) : null;
      
      // If log is a string (old format), parse it. Otherwise, use the new format
      if (typeof log === 'string') {
        const messageWithoutTimestamp = timestampMatch 
          ? log.replace(/^\d+:\s*/, '') 
          : log;
        
        return {
          id: index,
          timestamp: timestampMatch ? parseInt(timestampMatch[1], 10) * 1000 : null,
          level: levelMatch ? levelMatch[1].toUpperCase() : 'INFO',
          message: messageWithoutTimestamp
        };
      } else {
        // New format where log is an object
        return {
          id: index,
          timestamp: log.timestamp ? new Date(log.timestamp).getTime() : null,
          level: log.level || 'INFO',
          message: log.message || ''
        };
      }
    });
    
    applyFilters();
  } catch (error) {
    console.error('Error fetching broker logs:', error);
  } finally {
    isLoading.value = false;
  }
};

// Apply filters to logs
const applyFilters = () => {
  filteredLogs.value = logs.value.filter(log => {
    // Apply search filter
    const searchMatch = search.value === '' || 
      log.message.toLowerCase().includes(search.value.toLowerCase());
    
    // Apply level filter
    const levelMatch = levelFilter.value === 'all' || 
      log.level.toLowerCase() === levelFilter.value.toLowerCase();
    
    return searchMatch && levelMatch;
  });
};

// Watch for changes in search or level filter
const onSearchChange = () => {
  applyFilters();
};

const onLevelFilterChange = () => {
  applyFilters();
};

// Toggle auto refresh
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    refreshInterval.value = window.setInterval(fetchLogs, 5000);
  } else if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// Download logs
const downloadLogs = () => {
  // Create CSV header
  const csvHeader = 'Timestamp,Level,Message\n';
  
  // Create CSV rows with properly formatted timestamps
  const csvRows = logs.value.map(log => {
    // Format the timestamp
    const timestamp = formatTimestamp(log.timestamp);
    
    // Escape any commas in the message to maintain CSV structure
    const escapedMessage = log.message.replace(/"/g, '""');
    
    // Return CSV row with quotes around the message to handle commas and newlines
    return `${timestamp},${log.level},"${escapedMessage}"`;
  }).join('\n');
  
  // Combine header and rows
  const csvContent = csvHeader + csvRows;
  
  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mosquitto_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Clear search
const clearSearch = () => {
  search.value = '';
  applyFilters();
};

// Get log level color
const getLogLevelColor = (level: string) => {
  switch (level.toUpperCase()) {
    case 'ERROR':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'info';
    case 'DEBUG':
      return 'success';
    default:
      return 'default';
  }
};

// Format timestamp
const formatTimestamp = (timestamp: number | null) => {
  if (!timestamp) return '';
  try {
    // Convert milliseconds to seconds (JavaScript Date uses milliseconds)
    const timestampInSeconds = Math.floor(timestamp / 1000);
    
    // Create a UTC date string in the format YYYY-MM-DD HH:MM:SS UTC
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  } catch (e) {
    console.error('Error formatting timestamp:', e);
    return '';
  }
};

// Setup on component mount
onMounted(() => {
  fetchLogs();
  if (autoRefresh.value) {
    refreshInterval.value = window.setInterval(fetchLogs, 5000);
  }
});

// Cleanup on component unmount
onUnmounted(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <UiTitleCard title="Mosquitto Broker Logs" class-name="px-0 pb-0 rounded-md">
    <!-- Toolbar -->
    <div class="px-4 py-3 d-flex align-center">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search logs"
        single-line
        hide-details
        variant="outlined"
        density="compact"
        class="flex-grow-1 mr-2"
        @input="onSearchChange"
      >
        <template v-slot:append>
          <v-icon
            v-if="search"
            :icon="mdiClose"
            @click="clearSearch"
            style="cursor: pointer;"
          />
        </template>
      </v-text-field>
      
      <v-select
        v-model="levelFilter"
        :items="['all', 'info', 'warning', 'error', 'debug']"
        label="Log Level"
        variant="outlined"
        density="compact"
        hide-details
        class="mx-2"
        style="max-width: 150px;"
        @update:model-value="onLevelFilterChange"
      ></v-select>
      
      <v-btn
        :color="autoRefresh ? 'primary' : 'default'"
        variant="outlined"
        size="small"
        class="ml-2"
        @click="toggleAutoRefresh"
        :title="autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'"
      >
        <v-icon :icon="mdiReload" />
        <span class="ml-1">{{ autoRefresh ? 'Auto' : 'Manual' }}</span>
      </v-btn>
      
      <v-btn
        color="primary"
        variant="outlined"
        size="small"
        class="ml-2"
        @click="fetchLogs"
        :loading="isLoading"
        :disabled="isLoading"
      >
        <v-icon :icon="mdiReload" />
        <span class="ml-1">Refresh</span>
      </v-btn>
      
      <v-btn
        color="secondary"
        variant="outlined"
        size="small"
        class="ml-2"
        @click="downloadLogs"
      >
        <v-icon :icon="mdiDownload" />
        <span class="ml-1">Download</span>
      </v-btn>
    </div>

    <!-- Log Display -->
    <v-card-text class="pa-0">
      <v-data-table
        :headers="[
          { title: 'Time', key: 'timestamp', sortable: true, width: '20%' },
          { title: 'Level', key: 'level', sortable: true, width: '10%' },
          { title: 'Message', key: 'message', sortable: false, width: '70%' }
        ]"
        :items="filteredLogs"
        :loading="isLoading"
        hover
        class="elevation-1"
        :items-per-page="10"
        :items-per-page-options="[5, 10, 20, 50]"
      >
        <template v-slot:item.timestamp="{ item }">
          {{ formatTimestamp(item.timestamp) }}
        </template>
        
        <template v-slot:item.level="{ item }">
          <v-chip
            :color="getLogLevelColor(item.level)"
            size="small"
            text-color="white"
          >
            {{ item.level }}
          </v-chip>
        </template>
        
        <template v-slot:item.message="{ item }">
          <div class="log-message">{{ item.message }}</div>
        </template>
        
        <template v-slot:no-data>
          <div class="d-flex justify-center align-center pa-4">
            <p v-if="isLoading">Loading logs...</p>
            <p v-else>No logs available</p>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </UiTitleCard>
</template>

<style scoped>
.log-message {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 