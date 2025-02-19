<script setup lang="ts">
import { computed, ref } from 'vue';
import { getInfo, getdarkPrimary, getLightBorder, getSecondary } from './UpdateColors';

interface ByteStats {
  timestamps: string[];
  bytes_received: number[];
  bytes_sent: number[];
}

interface Props {
  byteStats: ByteStats;
}

const props = withDefaults(defineProps<Props>(), {
  byteStats: () => ({
    timestamps: [],
    bytes_received: [],
    bytes_sent: []
  })
});

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format time for display
const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return timestamp;
  }
};

// Helper function to format date for display
const formatDate = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit'
    });
  } catch (e) {
    return timestamp;
  }
};

// Helper function to filter data points by time range
const filterDataByTimeRange = (data: ByteStats, hours: number) => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);

  const filteredIndexes = data.timestamps
    .map((timestamp, index) => ({ timestamp, index }))
    .filter(({ timestamp }) => new Date(timestamp) >= cutoffTime)
    .map(({ index }) => index);

  return {
    timestamps: filteredIndexes.map(i => data.timestamps[i]),
    bytes_received: filteredIndexes.map(i => data.bytes_received[i]),
    bytes_sent: filteredIndexes.map(i => data.bytes_sent[i])
  };
};


// Helper function to filter timestamps for x-axis labels (15-minute intervals)
const filterTimestampsForLastSixHours = (timestamps: string[]): string[] => {
  const times = timestamps.map(ts => new Date(ts).getTime());
  const filtered: string[] = [];
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  let lastTimestamp = 0;
  timestamps.forEach((ts, index) => {
    const currentTime = times[index];
    if (index === 0 || (currentTime - lastTimestamp) >= FIFTEEN_MINUTES) {
      filtered.push(ts);
      lastTimestamp = currentTime;
    } else {
      filtered.push('');
    }
  });

  return filtered;
};

// Helper function to filter timestamps for daily view
const filterTimestampsForDaily = (timestamps: string[]): string[] => {
  const filtered: string[] = [];
  let lastDate = '';

  timestamps.forEach(ts => {
    const currentDate = formatDate(ts);
    if (currentDate !== lastDate) {
      filtered.push(ts);
      lastDate = currentDate;
    } else {
      filtered.push('');
    }
  });

  return filtered;
};

// Last 6 hours view chart options
const chartOptions1 = computed(() => {
  const sixHourData = filterDataByTimeRange(props.byteStats, 6);
  const filteredTimestamps = filterTimestampsForLastSixHours(sixHourData.timestamps);
  return {
    chart: {
      type: 'area',
      height: 450,
      fontFamily: `inherit`,
      foreColor: getSecondary.value,
      toolbar: false
    },
    colors: [getInfo.value, getdarkPrimary.value],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.4,
        stops: [0, 100]
      }
    },
    grid: {
      borderColor: getLightBorder.value,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      categories: filteredTimestamps.map(formatTime),
      axisBorder: {
        show: true,
        color: getLightBorder.value
      },
      axisTicks: {
        color: getLightBorder.value
      },
      labels: {
        rotateAlways: true,
        rotate: -45,
        style: {
          fontSize: '12px'
        },
        formatter: function (value: string): string {
          return value || '';  // Hide empty labels
        }
      },
      tickAmount: 8
    },
    yaxis: {
      labels: {
        formatter: (value: number) => formatBytes(value)
      }
    },
    legend: {
      show: true,
      position: 'top'
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value: number) => formatBytes(value)
      }
    }
  };
});

// Daily view chart options
const chartOptions2 = computed(() => {
  const sevenDayData = filterDataByTimeRange(props.byteStats, 24 * 7);
  const filteredTimestamps = filterTimestampsForDaily(sevenDayData.timestamps);
  return {
    chart: {
      type: 'area',
      height: 450,
      fontFamily: `inherit`,
      foreColor: '#a1aab2',
      toolbar: false
    },
    colors: [getInfo.value, getdarkPrimary.value],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.4,
        stops: [0, 100]
      }
    },
    grid: {
      borderColor: getLightBorder.value,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      categories: filteredTimestamps.map(formatDate),
      axisBorder: {
        show: true,
        color: getLightBorder.value
      },
      axisTicks: {
        color: getLightBorder.value
      },
      labels: {
        rotateAlways: true,
        rotate: -45,
        style: {
          fontSize: '12px'
        },
        formatter: function (value: string): string {
          return value || '';  // Hide empty labels
        }
      },
      tickAmount: 7
    },
    yaxis: {
      labels: {
        formatter: (value: number) => formatBytes(value)
      }
    },
    legend: {
      show: true,
      position: 'top'
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value: number) => formatBytes(value)
      }
    }
  };
});

// Chart series data for both views
const dailySeriesData = computed(() => {
  // Filter last 6 hours of data
  const sixHourData = filterDataByTimeRange(props.byteStats, 6);
  return [
    {
      name: 'Bytes Received',
      data: sixHourData.bytes_received
    },
    {
      name: 'Bytes Sent',
      data: sixHourData.bytes_sent
    }
  ];
});

const weeklySeriesData = computed(() => {
  // Filter last 7 days of data
  const sevenDayData = filterDataByTimeRange(props.byteStats, 24 * 7);
  return [
    {
      name: 'Bytes Received',
      data: sevenDayData.bytes_received
    },
    {
      name: 'Bytes Sent',
      data: sevenDayData.bytes_sent
    }
  ];
});

const tab = ref('one');
</script>

<template>
  <v-card class="title-card" variant="text">
    <v-card-item class="pb-2 px-0 pt-0">
      <div class="d-flex justify-space-between">
        <v-card-title class="text-h5">Byte Transfer Rate (15min intervals)</v-card-title>
        <div class="d-flex flex-wrap">
          <v-tabs v-model="tab" color="primary" class="tabBtn" density="compact" hide-slider>
            <v-tab value="one" class="mr-1" variant="outlined" rounded="md">Last 6h</v-tab>
            <v-tab value="two" variant="outlined" rounded="md">Daily</v-tab>
          </v-tabs>
        </div>
      </div>
    </v-card-item>
    <v-card-text class="rounded-md overflow-hidden">
      <v-window v-model="tab">
        <v-window-item value="one">
          <apexchart type="area" height="450" :options="chartOptions1" :series="dailySeriesData" />
        </v-window-item>
        <v-window-item value="two">
          <apexchart type="area" height="450" :options="chartOptions2" :series="weeklySeriesData" />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>