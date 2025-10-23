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

  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
    <!-- Header -->
    <h2 class="text-center text-3xl font-semibold text-gray-800 mb-8">หน้าแสดงข้อมูลจาก Sensor</h2>

    <!-- Live Sensor Data Card -->
    <div class="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6 mb-8 max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-center text-xl font-bold text-gray-800">ข้อมูลจากเซนเซอร์</h3>
        <button class="px-4 py-1 bg-red-600 text-white rounded-full font-semibold uppercase animate-pulse">สด</button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
        <div>
          <p class="text-blue-600 font-medium">แรงดันไฟฟ้า (Voltage)</p>
          <p class="text-2xl font-bold text-gray-800">{{ liveData.voltage }} V</p>
        </div>
        <div>
          <p class="text-blue-600 font-medium">กระแสไฟฟ้า (Current)</p>
          <p class="text-2xl font-bold text-gray-800">{{ liveData.current }} A</p>
        </div>
        <div>
          <p class="text-blue-600 font-medium">กำลังไฟฟ้า (Power)</p>
          <p class="text-2xl font-bold text-gray-800">{{ liveData.power }} W</p>
        </div>
        <div>
          <p class="text-blue-600 font-medium">พลังงานสะสม (Energy)</p>
          <p class="text-2xl font-bold text-gray-800">{{ liveData.energy }} kWh</p>
        </div>
        <div>
          <p class="text-blue-600 font-medium">ความถี่ (Frequency)</p>
          <p class="text-2xl font-bold text-gray-800">{{ liveData.frequency }} Hz</p>
        </div>
        <div>
          <p class="text-blue-600 font-medium">ตัวประกอบกำลัง (Power Factor)</p>
          <p class="text-2xl font-bold text-gray-800">{{ liveData.pf }}</p>
        </div>
      </div>
    </div>

    <!-- Historical Sensor Data Table -->
    <div class="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6 max-w-5xl mx-auto">
      <h3 class="text-center text-xl font-bold text-gray-800 mb-6">ข้อมูลประวัติการวัด (10 รายการล่าสุด)</h3>
      <div class="overflow-x-auto">
        <table class="table-auto w-full">
          <thead>
            <tr class="bg-indigo-100 font-semibold text-gray-800">
              <th class="text-left px-4 py-2">เวลาที่บันทึก</th>
              <th class="text-left px-4 py-2">แรงดันไฟฟ้า (V)</th>
              <th class="text-left px-4 py-2">กระแสไฟฟ้า (A)</th>
              <th class="text-left px-4 py-2">กำลังไฟฟ้า (W)</th>
              <th class="text-left px-4 py-2">พลังงานสะสม (kWh)</th>
              <th class="text-left px-4 py-2">ความถี่ (Hz)</th>
              <th class="text-left px-4 py-2">ตัวประกอบกำลัง</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in historicalData.slice(-10)" :key="record.timestamp" class="odd:bg-white even:bg-gray-400">
              <td class="px-4 py-2">{{ formatTimestamp(record.timestamp) }}</td>
              <td class="px-4 py-2">{{ record.voltage }} V</td>
              <td class="px-4 py-2">{{ record.current }} A</td>
              <td class="px-4 py-2">{{ record.power }} W</td>
              <td class="px-4 py-2">{{ record.energy }} kWh</td>
              <td class="px-4 py-2">{{ record.frequency }} Hz</td>
              <td class="px-4 py-2">{{ record.pf }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const liveData = ref({
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  frequency: 0,
  pf: 0,
});

const historicalData = ref([]);

// Format timestamp to Thai time and format
const formatTimestamp = (timestamp: string) => {
  return format(new Date(timestamp), "dd MMM yyyy HH:mm:ss", { locale: th });
};

// Fetch the latest live data
const fetchLiveData = async () => {
  try {
    const response = await fetch('http://localhost:4000/get-latest-sensor-data');
    liveData.value = await response.json();
  } catch (error) {
    console.error("Error fetching live data:", error);
  }
};

// Fetch historical data
const fetchHistoricalData = async () => {
  try {
    const response = await fetch('http://localhost:4000/get-sensor-history?limit=10');
    historicalData.value = await response.json();
  } catch (error) {
    console.error("Error fetching historical data:", error);
  }
};

// Fetch live data and historical data together
const fetchAllData = async () => {
  await fetchLiveData();
  await fetchHistoricalData();
};

// Fetch data on mount and set up periodic updates for live data
onMounted(() => {
  fetchAllData(); // Fetch both live data and historical data when mounted

  // Update both live data and historical data every second
  setInterval(fetchAllData, 1000);
});
</script>

<style scoped>
.table-auto thead tr th {
  @apply bg-indigo-100 text-gray-800 px-4 py-2;
}

.table-auto tbody tr td {
  @apply px-4 py-2 text-gray-800;
}

.table-auto tbody tr:nth-child(odd) {
  @apply bg-white;
}

.table-auto tbody tr:nth-child(even) {
  @apply bg-gray-50;
}
</style>
