/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { computed } from 'vue';
import UiTitleCard from '@/components/shared/UiTitleCard.vue';

interface MQTTEvent {
  id: string;
  timestamp: string;
  event_type: string;
  client_id: string;
  details: string;
  status: 'success' | 'warning' | 'error';
}

interface Props {
  events: MQTTEvent[];
}

const props = withDefaults(defineProps<Props>(), {
  events: () => ([
    {
      id: 'evt-001',
      timestamp: new Date().toISOString(),
      event_type: 'Client Connection',
      client_id: 'mqtt-client-1',
      details: 'New client connected',
      status: 'success'
    }
  ])
});

// Format timestamp to readable format
const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

const events = computed(() => {
  return props.events.map(event => ({
    ...event,
    formatted_time: formatTimestamp(event.timestamp)
  }));
});

</script>

<template>
  <UiTitleCard title="Recent MQTT Events" class-name="px-0 pb-0 rounded-md">
    <v-table class="bordered-table" hover density="comfortable">
      <thead class="bg-containerBg">
        <tr>
          <th class="text-left text-caption font-weight-bold text-uppercase">Time</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Event Type</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Client ID</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Details</th>
          <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in events" :key="item.id">
          <td class="py-3">{{ item.formatted_time }}</td>
          <td class="py-3">{{ item.event_type }}</td>
          <td class="py-3">
            <router-link to="/dashboard/default" class="text-secondary link-hover">
              {{ item.client_id }}
            </router-link>
          </td>
          <td class="py-3">{{ item.details }}</td>
          <td class="py-3">
            <v-chip 
              variant="text" 
              size="small" 
              class="px-0"
            >
              <v-avatar 
                size="8" 
                :color="item.status === 'success' ? 'success' : item.status === 'warning' ? 'warning' : 'error'" 
                variant="flat" 
                class="mr-2"
              />
              <p class="text-h6 mb-0">{{ item.status.charAt(0).toUpperCase() + item.status.slice(1) }}</p>
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>
  </UiTitleCard>
</template>