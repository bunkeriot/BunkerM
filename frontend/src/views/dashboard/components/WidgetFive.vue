/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { computed } from 'vue';
import { RiseOutlined, FallOutlined } from '@ant-design/icons-vue';

interface Props {
  totalMessagesReceived: number;
  totalConnectedClients: number;
  totalSubscriptions: number;
  retainedMessages: number;
  messagesTrend?: number;
  subscriptionsTrend?: number;
}

const props = withDefaults(defineProps<Props>(), {
  totalMessagesReceived: 0,
  totalConnectedClients: 0,
  totalSubscriptions: 0,
  retainedMessages: 0,
  messagesTrend: 0,
  subscriptionsTrend: 0
});

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

const cards = computed(() => [
  {
    name: 'Messages Received',
    earn: formatNumber(props.totalMessagesReceived),
    percent: `${Math.abs(props.messagesTrend)}%`,
    color: props.messagesTrend >= 0 ? 'success' : 'error',
    icon: props.messagesTrend >= 0 ? RiseOutlined : FallOutlined,
    text: 'messages from last period'
  },
  {
    name: 'Connected Clients',
    earn: formatNumber(props.totalConnectedClients),
    percent: `${Math.abs(props.messagesTrend)}%`,
    color: props.messagesTrend >= 0 ? 'success' : 'error',
    icon: props.messagesTrend >= 0 ? RiseOutlined : FallOutlined,
    text: 'total connected clients'
  },
  {
    name: 'Active Subscriptions',
    earn: formatNumber(props.totalSubscriptions),
    percent: `${Math.abs(props.subscriptionsTrend)}%`,
    color: props.subscriptionsTrend >= 0 ? 'success' : 'error',
    icon: props.subscriptionsTrend >= 0 ? RiseOutlined : FallOutlined,
    text: 'subscriptions from last check'
  },
  {
    name: 'Retained Messages',
    earn: formatNumber(props.retainedMessages),
    percent: 'Current',
    color: 'primary',
    icon: RiseOutlined,
    text: 'retained messages in broker'
  }
]);
</script>

<template>
  <v-row class="my-0">
    <v-col cols="12" sm="6" md="3" v-for="(card, i) in cards" :key="i" :value="card">
      <v-card elevation="0">
        <v-card variant="outlined">
          <v-card-text>
            <div class="d-flex align-items-center justify-space-between">
              <div>
                <h6 class="text-h6 text-lightText mb-1">{{ card.name }}</h6>
                <h4 class="text-h4 d-flex align-center mb-0">
                  {{ card.earn }}
                  <v-chip 
                    :color="card.color" 
                    :border="`${card.color} solid thin opacity-50`" 
                    class="ml-2" 
                    size="small" 
                    label
                  >
                    <template v-slot:prepend>
                      <component 
                        :is="card.icon" 
                        :style="{ fontSize: '12px' }" 
                        :class="'mr-1 text-' + card.color" 
                      />
                    </template>
                    {{ card.percent }}
                  </v-chip>
                </h4>
                <span class="text-lightText text-caption pt-5 d-block">
                  {{ card.text }}
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-card>
    </v-col>
  </v-row>
</template>