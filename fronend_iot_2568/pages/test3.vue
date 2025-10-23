<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "vue-chartjs";
import { format, startOfDay, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { th } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Constants for pricing
const PEAK_RATE = 5.7982;
const OFF_PEAK_RATE = 2.6369;
const FT_RATE = 0.5;
const SERVICE_CHARGE = 38.22;

// Data interfaces
interface SensorData {
  timestamp: string;
  power: number;
  energy?: number;
}

// State management
const startDate = ref<string>("2024-11-01T00:00");
const endDate = ref<string>("2024-11-30T23:59");
const isLoading = ref<boolean>(false);
const selectedPeriod = ref<string>("1D");
const sensorData = ref<SensorData[]>([]);
const allMonthData = ref<SensorData[]>([]);

// Computed: Calculate average power
const averagePower = computed(() => {
  if (sensorData.value.length === 0) return 0;
  const totalPower = sensorData.value.reduce((sum, reading) => sum + (reading.power || 0), 0);
  return totalPower / sensorData.value.length;
});

// Computed: Calculate energy usage (kWh) based on average power
const periodKwh = computed(() => {
  if (!startDate.value || !endDate.value) return 0;
  const avgPower = averagePower.value;
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Total hours
  return avgPower > 0 ? (avgPower * hours) / 1000 : 0; // Convert to kWh
});

// Computed: Calculate electricity cost based on periodKwh
const periodCost = computed(() => {
  const kwh = periodKwh.value;
  if (kwh === 0) return 0;
  const peakKwh = kwh * 0.7;
  const offPeakKwh = kwh * 0.3;
  return peakKwh * PEAK_RATE + offPeakKwh * OFF_PEAK_RATE + kwh * FT_RATE;
});

// Monthly details
const currentMonthLabel = computed(() => {
  if (!startDate.value) return "";
  const date = new Date(startDate.value);
  return `เดือน${format(date, "MMMM yyyy", { locale: th })}`;
});

// Computed: Calculate electricity cost for the month
const currentMonthCost = computed(() => {
  if (allMonthData.value.length === 0) return SERVICE_CHARGE;
  const totalEnergy = allMonthData.value.reduce((sum, reading) => sum + (reading.power || 0), 0);
  const monthKwh = (totalEnergy / allMonthData.value.length) * 24 * 30 / 1000;
  const peakKwh = monthKwh * 0.7;
  const offPeakKwh = monthKwh * 0.3;
  return peakKwh * PEAK_RATE + offPeakKwh * OFF_PEAK_RATE + monthKwh * FT_RATE + SERVICE_CHARGE;
});

// Chart data configuration
const chartData = computed(() => ({
  labels: sensorData.value.map((d) => format(new Date(d.timestamp), 'HH:mm dd/MM', { locale: th })),
  datasets: [
    {
      label: "กำลังไฟฟ้า (W)",
      data: sensorData.value.map((d) => d.power),
      borderColor: "rgb(37, 99, 235)",
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      fill: true,
      tension: 0.4,
    },
  ],
}));

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
    },
  },
  animation: {
    duration: 800,
    easing: 'easeInOutCubic',
  },
};

// Initialize with a 1-day view
onMounted(() => {
  setQuickPeriod("1D");
});

const setQuickPeriod = (period: string) => {
  selectedPeriod.value = period;
  const now = new Date();
  let start, end;
  switch (period) {
    case "1D":
      start = startOfDay(now);
      end = addDays(start, 1);
      break;
    case "1W":
      start = addDays(now, -6);
      end = now;
      break;
    case "1M":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    default:
      return;
  }
  startDate.value = start.toISOString().slice(0, 16);
  endDate.value = end.toISOString().slice(0, 16);
  fetchData();
};

const fetchData = async () => {
  if (!startDate.value || !endDate.value) {
    alert("กรุณาระบุช่วงเวลาที่ต้องการ");
    return;
  }
  isLoading.value = true;

  try {
    const response = await fetch(
      `http://localhost:4000/get-sensor-history?start=${startDate.value}&end=${endDate.value}`
    );

    if (!response.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลได้");
    }

    const data = await response.json();
    if (Array.isArray(data) && data.every((item) => "timestamp" in item && "power" in item)) {
      sensorData.value = data;

      const monthStart = startOfMonth(new Date(startDate.value));
      const monthEnd = endOfMonth(new Date(startDate.value));
      const monthResponse = await fetch(
        `http://localhost:4000/get-sensor-history?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      );

      if (monthResponse.ok) {
        allMonthData.value = await monthResponse.json();
      }
    } else {
      throw new Error("ข้อมูลไม่ถูกต้อง");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-blue-50 p-4 md:p-8">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-gray-800 mb-3">ระบบคำนวณค่าไฟฟ้ารายเดือน</h1>
        <p class="text-md text-gray-600">เลือกช่วงวันที่ที่ต้องการเพื่อดูรายละเอียดการคำนวณค่าไฟฟ้าของคุณ</p>
      </div>

      <!-- Date Range Selector -->
      <div class="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
        <div class="flex flex-wrap gap-4 items-end justify-center">
          <div class="form-control">
            <label class="block text-sm font-semibold text-gray-700 mb-1">วันที่เริ่มต้น</label>
            <input 
              type="datetime-local" 
              v-model="startDate"
              class="input input-bordered w-full bg-white max-w-xs border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50" 
            />
          </div>
          <div class="form-control">
            <label class="block text-sm font-semibold  text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input 
              type="datetime-local" 
              v-model="endDate"
              class="input input-bordered w-full max-w-xs bg-white border-gray-300 rounded-md shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50" 
            />
          </div>
          <button 
            @click="fetchData" 
            class="btn-primary px-6 py-2 font-semibold text-md rounded-lg transition-all"
            :class="{ 'opacity-50 cursor-wait': isLoading }"
          >
            {{ isLoading ? 'กำลังโหลด...' : 'อัปเดตข้อมูล' }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Energy Usage for Selected Period -->
        <div class="stat bg-gradient-to-r from-white to-purple-50 rounded-md shadow-lg p-4">
          <div class="flex flex-col mb-4">
            <div class="text-sm font-semibold text-gray-700">การใช้พลังงานในช่วงที่เลือก</div>
            <div class="text-3xl font-bold text-purple-700 mt-2">{{ periodKwh.toFixed(2) }} kWh</div>
            <div class="text-sm text-gray-500 mt-1">ค่าไฟฟ้า: ฿{{ periodCost.toFixed(2) }}</div>
          </div>
        </div>

        <!-- Monthly Cost Details -->
        <div class="stat bg-gradient-to-r from-white to-blue-50 rounded-md shadow-lg p-4">
          <div class="flex flex-col">
            <div class="text-sm font-semibold text-gray-700">ค่าไฟฟ้าประมาณการรายเดือน</div>
            <div class="text-3xl font-bold text-blue-700 mt-2">฿{{ currentMonthCost.toFixed(2) }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ currentMonthLabel }}</div>
          </div>
        </div>
      </div>

      <!-- Power Consumption Graph -->
      <div class="bg-white rounded-md shadow-lg p-6 mb-8">
        <div class="p-4">
          <h2 class="text-lg font-bold text-gray-800 mb-4">กราฟแสดงการใช้พลังงาน</h2>
          <div class="w-full h-[400px] bg-white/90 rounded-lg p-4 overflow-auto">
            <Line :data="chartData" :options="chartOptions" class="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.form-control input {
  @apply px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
  box-shadow: 0px 8px 12px -3px rgba(37, 99, 235, 0.1), 0px 4px 6px -2px rgba(37, 99, 235, 0.05);
}
</style>
