<template>
  <nav class="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg p-4 md:p-6">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
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
    <h2 class="text-center text-3xl md:text-4xl font-bold text-indigo-900 mb-8 animate-slideUp" style="animation-delay: 0.2s;">
      หน้าแสดงข้อมูลจาก Sensor
    </h2>

    <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 mb-8 max-w-4xl mx-auto animate-slideUp" style="animation-delay: 0.4s;">
      <div class="flex justify-between items-center mb-6 border-b border-indigo-200 pb-4">
        <h3 class="text-xl font-bold text-indigo-800">ข้อมูลจากเซนเซอร์แบบเรียลไทม์</h3>
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span class="font-semibold text-green-600">ออนไลน์</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-center">
        <div class="bg-indigo-50/60 rounded-xl p-4 shadow-md hover:shadow-lg hover:bg-indigo-100/70 transition-all duration-300 transform hover:-translate-y-1">
          <p class="text-indigo-700 font-semibold">แรงดันไฟฟ้า</p>
          <p class="text-2xl font-bold text-gray-900">{{ liveData.voltage }} <span class="text-lg font-medium text-gray-600">V</span></p>
        </div>
        <div class="bg-indigo-50/60 rounded-xl p-4 shadow-md hover:shadow-lg hover:bg-indigo-100/70 transition-all duration-300 transform hover:-translate-y-1">
          <p class="text-indigo-700 font-semibold">กระแสไฟฟ้า</p>
          <p class="text-2xl font-bold text-gray-900">{{ liveData.current }} <span class="text-lg font-medium text-gray-600">A</span></p>
        </div>
        <div class="bg-indigo-50/60 rounded-xl p-4 shadow-md hover:shadow-lg hover:bg-indigo-100/70 transition-all duration-300 transform hover:-translate-y-1">
          <p class="text-indigo-700 font-semibold">กำลังไฟฟ้า</p>
          <p class="text-2xl font-bold text-gray-900">{{ liveData.power }} <span class="text-lg font-medium text-gray-600">W</span></p>
        </div>
        <div class="bg-indigo-50/60 rounded-xl p-4 shadow-md hover:shadow-lg hover:bg-indigo-100/70 transition-all duration-300 transform hover:-translate-y-1">
          <p class="text-indigo-700 font-semibold">พลังงานสะสม</p>
          <p class="text-2xl font-bold text-gray-900">{{ liveData.energy }} <span class="text-lg font-medium text-gray-600">kWh</span></p>
        </div>
        <div class="bg-indigo-50/60 rounded-xl p-4 shadow-md hover:shadow-lg hover:bg-indigo-100/70 transition-all duration-300 transform hover:-translate-y-1">
          <p class="text-indigo-700 font-semibold">ความถี่</p>
          <p class="text-2xl font-bold text-gray-900">{{ liveData.frequency }} <span class="text-lg font-medium text-gray-600">Hz</span></p>
        </div>
        <div class="bg-indigo-50/60 rounded-xl p-4 shadow-md hover:shadow-lg hover:bg-indigo-100/70 transition-all duration-300 transform hover:-translate-y-1">
          <p class="text-indigo-700 font-semibold">ตัวประกอบกำลัง</p>
          <p class="text-2xl font-bold text-gray-900">{{ liveData.pf }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 max-w-5xl mx-auto animate-slideUp" style="animation-delay: 0.6s;">
      <h3 class="text-center text-2xl font-bold text-indigo-800 mb-6">ข้อมูลประวัติการวัด</h3>
      
      <div class="relative overflow-x-auto max-h-[600px] rounded-lg shadow-md">
        <table class="w-full text-sm text-left text-gray-700">
          <thead class="text-xs text-white uppercase bg-indigo-600 sticky top-0 z-10">
            <tr>
              <th scope="col" class="px-6 py-4 font-semibold rounded-tl-lg">เวลาที่บันทึก</th>
              <th scope="col" class="px-6 py-4 text-center font-semibold">แรงดัน (V)</th>
              <th scope="col" class="px-6 py-4 text-center font-semibold">กระแส (A)</th>
              <th scope="col" class="px-6 py-4 text-center font-semibold">กำลัง (W)</th>
              <th scope="col" class="px-6 py-4 text-center font-semibold">พลังงาน (kWh)</th>
              <th scope="col" class="px-6 py-4 text-center font-semibold">ความถี่ (Hz)</th>
              <th scope="col" class="px-6 py-4 text-center font-semibold rounded-tr-lg">PF</th>
            </tr>
          </thead>

          <transition-group name="list" tag="tbody">
            <tr 
              v-for="(record, index) in historicalData.slice(-10).reverse()" 
              :key="record.timestamp"
              class="border-b transition-colors duration-200 ease-in-out"
              :class="{ 'bg-indigo-50/40': index % 2 === 0, 'bg-white': index % 2 !== 0, 'hover:bg-indigo-100/60': true }"
            >
              <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {{ formatTimestamp(record.timestamp) }}
              </th>
              <td class="px-6 py-4 text-center">{{ record.voltage }}</td>
              <td class="px-6 py-4 text-center">{{ record.current }}</td>
              <td class="px-6 py-4 text-center">{{ record.power }}</td>
              <td class="px-6 py-4 text-center">{{ record.energy }}</td>
              <td class="px-6 py-4 text-center">{{ record.frequency }}</td>
              <td class="px-6 py-4 text-center">{{ record.pf }}</td>
            </tr>
          </transition-group>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface SensorData {
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
}

const liveData = ref<SensorData>({
  timestamp: '',
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  frequency: 0,
  pf: 0
});

const historicalData = ref<SensorData[]>([]);

const formatTimestamp = (timestamp: string) => {
  return format(new Date(timestamp), "dd MMM yyyy HH:mm:ss", { locale: th });
};

const fetchLiveData = async () => {
  try {
    const response = await fetch('http://localhost:4000/get-latest-sensor-data');
    const data = await response.json();
    liveData.value = data;
  } catch (error) {
    console.error("Error fetching live data:", error);
  }
};

const fetchHistoricalData = async () => {
  try {
    const response = await fetch('http://localhost:4000/get-sensor-history?limit=400');
    const data = await response.json();
    historicalData.value = data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
  }
};

const fetchAllData = async () => {
  await fetchLiveData();
  await fetchHistoricalData();
};

let intervalId: number;

onMounted(() => {
  fetchAllData();
  intervalId = window.setInterval(fetchAllData, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
/* Transition Group Animation */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* Enhanced Table Styles */
table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  background-color: #fff;
  border-radius: 0.5rem;
  overflow: hidden;
}

th, td {
  padding: 1.25rem 1.5rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

thead th {
  background-color: #4f46e5; /* Indigo-600 */
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

thead th:first-child {
  border-top-left-radius: 0.5rem;
}

thead th:last-child {
  border-top-right-radius: 0.5rem;
}

tbody tr {
  transition: background-color 0.2s ease-in-out, transform 0.2s ease-in-out;
}

tbody tr:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

tbody th {
  font-weight: 500;
  color: #1f2937; /* Gray-800 */
}

td {
  color: #374151; /* Gray-700 */
}

tr:last-child td,
tr:last-child th {
  border-bottom: none;
}

/* Scrollbar Styling */
div.relative {
  scrollbar-width: thin;
  scrollbar-color: #4f46e5 #e0e7ff;
}

div.relative::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

div.relative::-webkit-scrollbar-track {
  background: #e0e7ff; /* Indigo-100 */
  border-radius: 5px;
}

div.relative::-webkit-scrollbar-thumb {
  background: #4f46e5; /* Indigo-600 */
  border-radius: 5px;
}

div.relative::-webkit-scrollbar-thumb:hover {
  background: #4338ca; /* Indigo-700 */
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  th, td {
    padding: 0.75rem;
    font-size: 0.8rem;
  }

  .relative {
    max-height: 400px;
  }
}

@media (max-width: 640px) {
  th, td {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .relative {
    max-height: 300px;
  }
}
</style>