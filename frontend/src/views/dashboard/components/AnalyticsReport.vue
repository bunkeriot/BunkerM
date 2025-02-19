<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useTheme } from 'vuetify';
import { getLightBorder } from './UpdateColors';
import UiTitleCard from '@/components/shared/UiTitleCard.vue';

const theme = useTheme();
const WarningColor = theme.current.value.colors.warning;

const chartOptions1 = computed(() => {
  return {
    chart: {
      type: 'line',
      height: 340,
      fontFamily: `inherit`,
      foreColor: '#a1aab2',
      toolbar: {
        show: false
      }
    },
    colors: [WarningColor],
    dataLabels: {
      enabled: false
    },
    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    xaxis: {
      crosshairs: {
        width: 1
      },
      labels: {
        offsetX: 8
      },
      axisTicks: {
        show: false
      },
      axisBorder: {
        show: false
      }
    },
    yaxis: {
      show: false
    },
    stroke: {
      curve: 'smooth',
      width: 1.5
    },
    grid: {
      strokeDashArray: 4,
      borderColor: getLightBorder.value
    },
    tooltip: {
      fixed: {
        enabled: false
      },
      x: {
        show: false
      },
      marker: {
        show: false
      }
    }
  };
});

// chart 1
const lineChart1 = {
  series: [
    {
      name: 'Income',
      data: [58, 90, 38, 83, 63, 75, 35, 55]
    }
  ]
};

const reports = shallowRef([
  {
    name: 'Company Finance Growth',
    percent: '+45.14%'
  },
  {
    name: 'Company Expenses Ratio',
    percent: '0.58%'
  },
  {
    name: 'Business Risk Cases',
    percent: 'Low'
  }
]);
</script>

<template>
  <UiTitleCard title="Analytics Report" class-name="px-0 rounded-md overflow-hidden">
    <v-list class="py-0" aria-busy="true" aria-label="Report list" border>
      <v-list-item :value="item.name" v-for="(item, i) in reports" :key="i">
        <div class="d-inline-flex align-center justify-space-between w-100 ga-2">
          <h6 class="text-h6 mb-0">{{ item.name }}</h6>
          <h5 class="ml-auto text-h5 mb-0">{{ item.percent }}</h5>
        </div>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <apexchart type="line" height="340" :options="chartOptions1" :series="lineChart1.series"> </apexchart>
  </UiTitleCard>
</template>
