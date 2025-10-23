<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
const isLoading = ref(false);
const sensorData = ref<SensorData[]>([]);
const monthlyData = ref<SensorData[]>([]);
const error = ref<string | null>(null);

// คำนวณพลังงานรายวันจากกำลังไฟฟ้าทุก 1 นาที
const dailyEnergy = computed(() => {
  if (!sensorData.value.length) return 0;

  // คำนวณพลังงานในหน่วย Wh จากข้อมูลกำลังไฟฟ้า (กำลัง W * เวลา (1/60 ชั่วโมง))
  const totalEnergy = sensorData.value.reduce((sum, reading) => sum + (reading.power / 60), 0);
  return Number((totalEnergy / 1000).toFixed(4)); // แปลงเป็น kWh
});

// คำนวณพลังงานรายเดือนจากกำลังไฟฟ้าทุก 1 นาที
const monthlyEnergy = computed(() => {
  if (!monthlyData.value.length) return 0;

  // คำนวณพลังงานในหน่วย Wh จากข้อมูลกำลังไฟฟ้า (กำลัง W * เวลา (1/60 ชั่วโมง))
  const totalEnergy = monthlyData.value.reduce((sum, reading) => sum + (reading.power / 60), 0);
  return Number((totalEnergy / 1000).toFixed(4)); // แปลงเป็น kWh
});

// คำนวณค่าใช้จ่ายรายวัน (ไม่รวมค่าบริการรายเดือน)
const dailyCost = computed(() => {
  const energy = dailyEnergy.value;
  return energy > 0 ? calculateDailyCost(energy) : 8.19;
});


// คำนวณค่าใช้จ่ายรายเดือน (รวมค่าบริการรายเดือน)
const monthlyCost = computed(() => {
  return calculateMonthlyCost(monthlyEnergy.value);
});

// ฟังก์ชันคำนวณค่าไฟฟ้าจากพลังงานที่ใช้ (หน่วย kWh) สำหรับรายวัน
function calculateDailyCost(energy: number) {
  if (energy === 0) return 0;

  let cost = 0;

  if (energy <= 15) {
    cost = energy * 2.3488;
  } else if (energy <= 25) {
    cost = (15 * 2.3488) + ((energy - 15) * 2.9882);
  } else if (energy <= 35) {
    cost = (15 * 2.3488) + (10 * 2.9882) + ((energy - 25) * 3.2405);
  } else if (energy <= 100) {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + ((energy - 35) * 3.6237);
  } else if (energy <= 150) {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + (65 * 3.6237) + ((energy - 100) * 3.7171);
  } else if (energy <= 400) {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + (65 * 3.6237) + (50 * 3.7171) + ((energy - 150) * 4.2218);
  } else {
    cost = (15 * 2.3488) + (10 * 2.9882) + (10 * 3.2405) + (65 * 3.6237) + (50 * 3.7171) + (250 * 4.2218) + ((energy - 400) * 4.4217);
  }

  return Number(cost.toFixed(4));
}
  

// ฟังก์ชันคำนวณค่าไฟฟ้ารายเดือน (รวมค่าบริการ)
function calculateMonthlyCost(energy: number): number {
  if (energy === 0) return 8.19; // กรณีใช้พลังงานเป็น 0 หน่วย

  let cost = 0;

  if (energy <= 150) {
    // ใช้พลังงานไม่เกิน 150 หน่วย
    cost = (Math.min(energy, 15) * 2.3488) +
           (Math.max(0, Math.min(energy - 15, 10)) * 2.9882) +
           (Math.max(0, Math.min(energy - 25, 10)) * 3.2405) +
           (Math.max(0, Math.min(energy - 35, 65)) * 3.6237) +
           (Math.max(0, Math.min(energy - 100, 50)) * 3.7171);
    cost += 8.19; // รวมค่าบริการขั้นต่ำ
  } else {
    // ใช้พลังงานเกิน 150 หน่วย
    cost = (150 * 3.2484) +
           (Math.max(0, Math.min(energy - 150, 250)) * 4.2218) +
           (Math.max(0, energy - 400) * 4.4217);
    cost += 24.62; // รวมค่าบริการคงที่
  }

  return Number(cost.toFixed(4));
}


// กำหนดข้อมูลสำหรับกราฟ
const chartData = computed(() => ({
  labels: sensorData.value.map(d => {
    const date = toZonedTime(new Date(d.timestamp), 'Asia/Bangkok');
    return format(date, 'd MMM yy HH:mm', { locale: th });
  }),
  datasets: [{
    label: 'กำลังไฟฟ้า (W)',
    data: sensorData.value.map(d => d.power),
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
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

// ฟังก์ชันดึงข้อมูล
// ฟังก์ชันดึงข้อมูล
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const start = startOfDay(new Date(selectedDate.value));
    const end = endOfDay(new Date(selectedDate.value));
    const response = await fetch(
      `http://localhost:4000/get-sensor-history?start=${start.toISOString()}&end=${end.toISOString()}`
    );

    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้ เกิดข้อผิดพลาดในการดึงข้อมูล');
    let data = await response.json();

    if (data.length === 0) {
      sensorData.value = []; // ล้างข้อมูลเก่าเมื่อไม่มีข้อมูลใหม่
    } else {
      data = data.sort((a: SensorData, b: SensorData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      sensorData.value = data;
    }

    // ดึงข้อมูลสำหรับเดือนปัจจุบัน
    const monthStart = startOfMonth(new Date(selectedDate.value));
    const monthEnd = endOfMonth(new Date(selectedDate.value));
    const monthResponse = await fetch(
      `http://localhost:4000/get-sensor-history?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
    );

    if (monthResponse.ok) {
      let monthData = await monthResponse.json();
      if (monthData.length === 0) {
        monthlyData.value = []; // ล้างข้อมูลเก่าเมื่อไม่มีข้อมูลใหม่
      } else {
        monthlyData.value = monthData.sort((a: SensorData, b: SensorData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    } else {
      monthlyData.value = []; // ล้างข้อมูลเก่าในกรณีไม่สามารถดึงข้อมูลได้
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
    sensorData.value = []; // ล้างข้อมูลเก่าเมื่อเกิดข้อผิดพลาด
    monthlyData.value = []; // ล้างข้อมูลเก่าเมื่อเกิดข้อผิดพลาด
  } finally {
    isLoading.value = false;
  }
};

// Watchers และ Lifecycle hooks
watch(selectedDate, () => {
  fetchData();
});

onMounted(() => {
  fetchData();
  setInterval(fetchData, 30000);
});
</script>

<template>
  <nav class="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg p-4 md:p-6">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo Section -->
      <div class="flex items-center gap-3">
        <img src="../assets/images/electricity.png" alt="Logo" class="h-10 w-10" />
        <span class="text-xl md:text-2xl font-bold text-blue-600">
          ระบบติดตามพลังงาน
        </span>
      </div>

      <!-- Navigation Links -->
      <div class="hidden md:flex space-x-6">
        <router-link
          to="/"
          class="text-gray-600 font-medium hover:text-blue-600 transition-colors duration-200"
          :class="{ 'text-blue-600 font-bold': $route.path === '/' }"
        >
          หน้าหลัก
        </router-link>
        <router-link
          to="/monthly-summary"
          class="text-gray-600 font-medium hover:text-blue-600 transition-colors duration-200"
          :class="{ 'text-blue-600 font-bold': $route.path === '/monthly-summary' }"
        >
          สรุปรายเดือน
        </router-link>
      </div>

      
    </div>

    
  </nav>


  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-error mb-6 bg-red-100 text-red-800 border border-red-400 rounded-lg p-4">
        <span>{{ error }}</span>
      </div>

      <!-- Header Section -->
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          ระบบติดตามการใช้พลังงาน
        </h1>
        <p class="text-gray-600">ติดตามและวิเคราะห์การใช้พลังงานไฟฟ้าของคุณ</p>
      </div>

      <!-- Main Card Section -->
      <div class="bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-6 mb-8">

        <!-- Date Selection Section -->
        <div class="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <label class="text-gray-600 font-semibold">เลือกวันที่:</label>
          <input
            type="date"
            v-model="selectedDate"
            class="input input-bordered w-full max-w-xs border-gray-300 bg-white/90 rounded-lg focus:ring focus:ring-blue-500"
          />
          <button
            @click="fetchData"
            class="btn btn-primary bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            อัปเดตข้อมูล
          </button>
        </div>

        <!-- Alert when no data is found -->
        <div v-if="!isLoading && !sensorData.length" class="alert alert-info bg-blue-100 text-blue-800 border border-blue-400 rounded-lg p-4 mb-8">
          <span>ไม่พบข้อมูลสำหรับวันที่เลือก กรุณาเลือกวันที่อื่น</span>
        </div>

        <!-- Stats Cards Section -->
        <div v-if="!isLoading && sensorData.length" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Daily Energy Card -->
          <div class="bg-white p-6 rounded-lg shadow-md flex items-center">
            <div class="mr-4">
              <img src="../assets/images/calendar.png" alt="Daily Energy Icon" class="h-12 w-12" />
            </div>
            <div>
              <div class="text-lg font-semibold text-gray-700">การใช้พลังงานในช่วงที่เลือก</div>
              <div class="text-3xl font-bold text-blue-600">{{ dailyEnergy }} kWh</div>
              <div class="text-md text-gray-500 mt-2">ค่าไฟฟ้า: {{ dailyCost }} บาท (ต่อวัน)</div>
            </div>
          </div>

          <!-- Monthly Energy Card -->
          <div class="bg-white p-6 rounded-lg shadow-md flex items-center">
            <div class="mr-4">
              <img src="../assets/images/month (1).png" alt="Monthly Energy Icon" class="h-12 w-12" />
            </div>
            <div>
              <div class="text-lg font-semibold text-gray-700">ค่าไฟฟ้าประมาณการรายเดือน</div>
              <div class="text-3xl font-bold text-pink-600">{{ monthlyEnergy }} kWh</div>
            </div>
          </div>

          <!-- Summary Electricity Cost Card -->
          <div class="bg-white p-6 rounded-lg shadow-md flex items-center">
            <div class="mr-4">
              <img src="../assets/images/eco-house.png" alt="Electricity Summary Icon" class="h-12 w-12" />
            </div>
            <div>
              <div class="text-lg font-semibold text-gray-700">ค่าไฟฟ้าสรุป</div>
              <div class="text-3xl font-bold text-green-600">{{ monthlyCost }} บาท</div>
              <div class="text-md text-gray-500 mt-2">ค่าไฟฟ้า (รวมค่าบริการต่างๆ)</div>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="relative bg-white p-6 rounded-lg shadow-md h-[400px]">
          <Line :data="chartData" :options="chartOptions" />
          <div v-if="!isLoading && !sensorData.length" class="absolute inset-0 flex items-center justify-center bg-white/50">
            <span class="text-gray-500 text-lg">ไม่พบข้อมูลสำหรับวันที่เลือก กรุณาเลือกวันที่อื่น</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>




<style scoped>
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.btn {
  @apply font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
</style>
