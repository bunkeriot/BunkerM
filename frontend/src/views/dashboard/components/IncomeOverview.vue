/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import UiTitleCard from '@/components/shared/UiTitleCard.vue';


interface MessageStats {
  dates: string[];
  counts: number[];
}


interface Props {
  messageStats: MessageStats;
}

const props = withDefaults(defineProps<Props>(), {
  messageStats: () => ({
    dates: [],
    counts: []
  })
});

const theme = useTheme();
const InfoColor = theme.current.value.colors.info;

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit'
    });
  } catch (e) {
    return '';
  }
};


const getLastSevenDays = () => {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]); // Format: YYYY-MM-DD
  }
  return dates;
};

const chartOptions1 = computed(() => {

  const displayDates = props.messageStats.dates.length > 0 
    ? props.messageStats.dates 
    : getLastSevenDays();
  return {
    chart: {
      type: 'bar',
     
      fontFamily: `inherit`,
      foreColor: '#a1aab2',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 4
      }
    },
    labels: displayDates.map(formatDate),
    colors: InfoColor,
    stroke: {
      curve: 'smooth'
    },
    fill: {
      opacity: 0.6
    },
    xaxis: {
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      show: false
    },
    grid: {
      show: false
    },
    tooltip: {
      fixed: {
        enabled: false
      }
    }
  };
});

const barChart1 = computed(() => ({
  series: [
    {
      name: 'Messages',
      // If no data, show zeros for all dates
      data: props.messageStats.counts.length > 0 
        ? props.messageStats.counts 
        : new Array(7).fill(0)
    }
  ]
}));

// Calculate total messages
const totalMessages = computed(() => {
  return props.messageStats.counts.reduce((sum, count) => sum + count, 0).toLocaleString();
});
</script>

<template>
  <UiTitleCard title="Total Messages" class-name="pt-5 px-0 rounded-md overflow-hidden">
    <div class="px-5">
      <h6 class="text-h6 text-lightText mb-4">This Week Statistics</h6>
      <h3 class="text-h3 mb-0">{{ totalMessages }}</h3>
    </div>
    <apexchart type="bar" height="365" :options="chartOptions1" :series="barChart1.series" />
  </UiTitleCard>
</template>