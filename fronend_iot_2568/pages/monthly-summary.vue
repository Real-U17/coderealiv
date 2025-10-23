<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'vue-chartjs';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface SensorData {
  timestamp: string;
  voltage: number;
  current: number;
  power: number; // Power in watts
  energy: number; // Energy in Wh
  frequency: number;
  pf: number;
}

// State
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
const selectedMonth = ref(new Date().toISOString().substr(0, 7));
const isLoading = ref(false);
const sensorData = ref<SensorData[]>([]);
const monthlyData = ref<SensorData[]>([]);
const error = ref<string | null>(null);
const availableDates = ref<string[]>([]);

const predictedEnergy = ref(0);
const predictedCost = ref(0);
const lightStatus = ref(false);

const toggleLight = async () => {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const response = await fetch('http://localhost:4000/api/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: lightStatus.value ? 0 : 1, device: 'sw01' }),
    });
    if (response.ok) {
      const result = await response.json();
      lightStatus.value = result.status === 1;
    }
  } catch (error) {
    console.error('Error toggling light:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchSwitchStatus = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/switch-status');
    if (response.ok) {
      const { status } = await response.json();
      lightStatus.value = status === 1;
    }
  } catch (error) {
    console.error('Error fetching switch status:', error);
  }
};

const predictNextMonth = async () => {
  if (monthlyData.value.length === 0) return;

  const lastMonthData = monthlyData.value[monthlyData.value.length - 1];
  try {
    const response = await fetch('http://localhost:4000/predict-power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ power: lastMonthData.power }),
    });
    if (response.ok) {
      const { energy } = await response.json();
      predictedEnergy.value = Number(energy.toFixed(2));
      predictedCost.value = calculateMonthlyCost(predictedEnergy.value);
    } else {
      console.error('Error fetching prediction:', response.statusText);
    }
  } catch (error) {
    console.error('Error in prediction:', error);
  }
};

const fetchMonthlyData = async () => {
  try {
    const monthStart = startOfMonth(new Date(selectedMonth.value));
    const monthEnd = endOfMonth(new Date(selectedMonth.value));
    const response = await fetch(`http://localhost:4000/get-sensor-history?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`);
    if (response.ok) {
      const monthData = await response.json();
      monthlyData.value = monthData.sort((a: SensorData, b: SensorData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      await predictNextMonth();
    }
  } catch (error) {
    console.error('Error fetching monthly data:', error);
  }
};

const fetchAvailableDates = async () => {
  try {
    const response = await fetch('http://localhost:4000/get-available-dates');
    if (response.ok) {
      const dates = await response.json();
      availableDates.value = dates.map((date: string) => format(new Date(date), 'yyyy-MM-dd'));
    }
  } catch (err) {
    console.error('Error fetching available dates:', err);
  }
};

// Calculate energy and costs
const dailyEnergy = computed(() => {
  if (!sensorData.value.length) return 0;
  const totalEnergy = sensorData.value.reduce((sum, reading) => sum + reading.power / 60, 0);
  return Number((totalEnergy / 1000).toFixed(4));
});

const monthlyEnergy = computed(() => {
  if (!monthlyData.value.length) return 0;
  let totalEnergy = 0;
  const dailyEnergies = new Map<string, number>();
  monthlyData.value.forEach(reading => {
    const day = format(new Date(reading.timestamp), 'yyyy-MM-dd');
    const energy = reading.power / 60;
    dailyEnergies.set(day, (dailyEnergies.get(day) ?? 0) + energy);
  });
  dailyEnergies.forEach(energy => {
    totalEnergy += energy;
  });
  return Number((totalEnergy / 1000).toFixed(4));
});

const dailyCost = computed(() => {
  const energy = dailyEnergy.value;
  return energy > 0 ? calculateDailyCost(energy) : 8.19;
});

const monthlyCost = computed(() => {
  const energy = monthlyEnergy.value;
  return calculateMonthlyCost(energy);
});

function calculateDailyCost(energy: number) {
  if (energy === 0) return 0;
  let cost = 0;
  if (energy <= 15) cost = energy * 2.3488;
  else if (energy <= 25) cost = 15 * 2.3488 + (energy - 15) * 2.9882;
  else if (energy <= 35) cost = 15 * 2.3488 + 10 * 2.9882 + (energy - 25) * 3.2405;
  else if (energy <= 100) cost = 15 * 2.3488 + 10 * 2.9882 + 10 * 3.2405 + (energy - 35) * 3.6237;
  else if (energy <= 150) cost = 15 * 2.3488 + 10 * 2.9882 + 10 * 3.2405 + 65 * 3.6237 + (energy - 100) * 3.7171;
  else if (energy <= 400) cost = 15 * 2.3488 + 10 * 2.9882 + 10 * 3.2405 + 65 * 3.6237 + 50 * 3.7171 + (energy - 150) * 4.2218;
  else cost = 15 * 2.3488 + 10 * 2.9882 + 10 * 3.2405 + 65 * 3.6237 + 50 * 3.7171 + 250 * 4.2218 + (energy - 400) * 4.4217;
  return Number(cost.toFixed(4));
}

function calculateMonthlyCost(energy: number): number {
  if (energy === 0) return 8.19;
  let cost = 0;
  if (energy <= 150) {
    cost =
      Math.min(energy, 15) * 2.3488 +
      Math.max(0, Math.min(energy - 15, 10)) * 2.9882 +
      Math.max(0, Math.min(energy - 25, 10)) * 3.2405 +
      Math.max(0, Math.min(energy - 35, 65)) * 3.6237 +
      Math.max(0, Math.min(energy - 100, 50)) * 3.7171 +
      8.19;
  } else {
    cost =
      150 * 3.2484 +
      Math.max(0, Math.min(energy - 150, 250)) * 4.2218 +
      Math.max(0, energy - 400) * 4.4217 +
      24.62;
  }
  return Number(cost.toFixed(4));
}

const chartData = computed(() => ({
  labels: sensorData.value.map(d => {
    const date = toZonedTime(new Date(d.timestamp), 'Asia/Bangkok');
    return format(date, 'd MMM yy HH:mm', { locale: th });
  }),
  datasets: [
    {
      label: 'กำลังไฟฟ้า (W)',
      data: sensorData.value.map(d => d.power),
      borderColor: '#4f46e5', // Indigo color
      backgroundColor: 'rgba(79, 70, 229, 0.1)', // Indigo color with transparency
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#333',
      bodyColor: '#333',
      borderColor: '#ddd',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (item: any) => `กำลังไฟฟ้า: ${item.raw.toFixed(2)} วัตต์`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#333',
        maxRotation: 45,
        minRotation: 45,
        maxTicksLimit: 12,
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#eee' },
      ticks: {
        color: '#333',
        callback: (value: number) => `${value.toFixed(1)}W`,
      },
    },
  },
};

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const start = startOfDay(new Date(selectedDate.value));
    const end = endOfDay(new Date(selectedDate.value));
    const response = await fetch(`http://localhost:4000/get-sensor-history?start=${start.toISOString()}&end=${end.toISOString()}`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
    let data = await response.json();
    sensorData.value = data.length ? data.sort((a: SensorData, b: SensorData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

    const monthStart = startOfMonth(new Date(selectedDate.value));
    const monthEnd = endOfMonth(new Date(selectedDate.value));
    const monthResponse = await fetch(`http://localhost:4000/get-sensor-history?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`);

    if (monthResponse.ok) {
      const monthData = await monthResponse.json();
      monthlyData.value = monthData.sort((a: SensorData, b: SensorData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
    sensorData.value = [];
    monthlyData.value = [];
  } finally {
    isLoading.value = false;
  }
};

watch(selectedDate, fetchData);

onMounted(() => {
  fetchData();
  fetchAvailableDates();
  fetchMonthlyData();
  fetchSwitchStatus();

  const dataInterval = setInterval(fetchData, 60000);
  const statusInterval = setInterval(fetchSwitchStatus, 10000);

  onUnmounted(() => {
    clearInterval(dataInterval);
    clearInterval(statusInterval);
  });
});
</script>

<template>
   <nav class="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg p-4 md:p-6">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo Section -->
      <div class="flex items-center gap-3">
        <img src="../assets/images/1.png" alt="Logo" class="h-10 w-10" />
        <span class="text-xl md:text-2xl font-bold text-blue-600">
          แพลตฟอร์มแสดงผลและจัดการพลังงานผ่านระบบ IOT
        </span>
      </div>
      <div class="hidden md:flex gap-6">
        <router-link
          to="/"
          class="font-medium text-gray-700 hover:text-indigo-600 transition-all duration-300"
          :class="{ 'text-indigo-700 font-bold underline': $route.path === '/' }"
        >
          หน้าหลัก
        </router-link>
        <router-link
          to="/monthly-summary"
          class="font-medium text-gray-700 hover:text-indigo-600 transition-all duration-300"
          :class="{ 'text-indigo-700 font-bold underline': $route.path === '/monthly-summary' }"
        >
          รายละเอียด
        </router-link>
      </div>
    </div>
  </nav>

  <div class="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-200 to-purple-100 p-4 md:p-8 animate-fadeIn">
    <div class="max-w-7xl mx-auto">
      <div v-if="error" class="alert alert-error mb-6 bg-red-100 text-red-800 border border-red-400 rounded-lg p-4">
        <span>{{ error }}</span>
      </div>
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-indigo-900 mb-2 animate-slideUp" style="animation-delay: 0.2s;">
          ระบบติดตามการใช้พลังงาน
        </h1>
        <p class="text-indigo-700">ติดตามและวิเคราะห์การใช้พลังงานไฟฟ้าของคุณ</p>
      </div>
      <div class="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-6 md:p-8 mb-8 animate-slideUp" style="animation-delay: 0.4s;">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div class="flex items-center gap-4">
            <label class="text-gray-600 font-semibold whitespace-nowrap">เลือกวันที่:</label>
            <div class="w-full max-w-xs">
              <CustomDatePicker v-model="selectedDate" :available-dates="availableDates" @date-selected="fetchData" />
            </div>
          </div>

          <div class="flex justify-between items-center bg-gray-100/50 p-4 rounded-2xl shadow-inner w-full md:w-auto">
            <div class="flex items-center gap-4">
              <div :class="[lightStatus ? 'bg-green-200/70' : 'bg-red-200/70']" class="p-2 rounded-full">
                <div class="h-10 w-10 flex items-center justify-center">
                  <svg
                    v-if="lightStatus"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-10 w-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-10 w-10 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-indigo-800">ควบคุมไฟ</h3>
                <p :class="[lightStatus ? 'text-green-600' : 'text-red-600']" class="text-lg font-medium">
                  สถานะ: {{ lightStatus ? '🟢 เปิด' : '🔴 ปิด' }}
                </p>
              </div>
            </div>
            <button
              @click="toggleLight"
              :disabled="isLoading"
              :class="[
                lightStatus ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
                'px-6 ml-4 py-3 rounded-lg font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-1',
              ]"
            >
              <span class="flex items-center gap-2">
                <span v-if="isLoading" class="animate-spin">⌛</span>
                {{ lightStatus ? 'ปิดไฟ' : 'เปิดไฟ' }}
              </span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div class="bg-indigo-50/60 p-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <h2 class="text-xl font-semibold text-indigo-800 mb-3">⚡ พลังงานวันนี้</h2>
            <p class="text-3xl font-bold text-indigo-600">{{ dailyEnergy }} kWh</p>
            <p class="text-indigo-700 mt-1">ค่าไฟ: {{ dailyCost }} บาท</p>
          </div>
          <div class="bg-indigo-50/60 p-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <h2 class="text-xl font-semibold text-indigo-800 mb-3">📅 พลังงานเดือนนี้</h2>
            <p class="text-3xl font-bold text-indigo-600">{{ monthlyEnergy }} kWh</p>
            <p class="text-indigo-700 mt-1">ค่าไฟ: {{ monthlyCost }} บาท</p>
          </div>
          <div class="bg-indigo-50/60 p-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <h2 class="text-xl font-semibold text-indigo-800 mb-3">🔮 พลังงานเดือนถัดไป (ทำนาย)</h2>
            <p class="text-3xl font-bold text-indigo-600">{{ predictedEnergy }} kWh</p>
            <p class="text-indigo-700 mt-1">ค่าไฟ: {{ predictedCost }} บาท</p>
          </div>
        </div>

        <div class="mt-8" style="height: 320px;">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 1s ease-out both;
}
.animate-slideUp {
  animation: slideUp 0.8s ease-out both;
}
</style>