<script setup lang="ts">
import { computed } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'vue-chartjs';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import type { SensorData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  data: SensorData[];
}>();

const chartData = computed(() => ({
  labels: props.data.map(d => {
    const date = toZonedTime(new Date(d.timestamp), 'Asia/Bangkok');
    return format(date, 'd MMM yy HH:mm', { locale: th });
  }),
  datasets: [{
    label: 'กำลังไฟฟ้า (W)',
    data: props.data.map(d => d.power),
    borderColor: 'hsl(var(--p))',
    backgroundColor: 'hsla(var(--p), 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 5,
  }]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'hsl(var(--b1))',
      titleColor: 'hsl(var(--bc))',
      bodyColor: 'hsl(var(--bc))',
      borderColor: 'hsl(var(--b3))',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        title: (items: any[]) => {
          if (items.length > 0) {
            const date = toZonedTime(new Date(props.data[items[0].dataIndex].timestamp), 'Asia/Bangkok');
            return format(date, 'PPPp', { locale: th });
          }
          return '';
        },
        label: (item: any) => `กำลังไฟฟ้า: ${item.raw} วัตต์`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: 'hsl(var(--bc))',
        maxRotation: 45,
        minRotation: 45,
        maxTicksLimit: 12,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'hsl(var(--b3))',
      },
      ticks: {
        color: 'hsl(var(--bc))',
        callback: (value: number) => `${value}W`,
      },
    },
  },
};
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">กราฟแสดงการใช้พลังงาน</h2>
      <div class="h-[400px]">
        <Line
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>
  </div>
</template>