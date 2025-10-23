<template>
  <div class="min-h-screen" :data-theme="currentTheme">
    <div class="flex h-screen bg-base-200">
      <!-- Sidebar -->
      <div class="w-64 bg-base-100 shadow-lg">
        <div class="p-4 flex items-center justify-between">
          <h1 class="text-2xl font-bold text-primary">ระบบไฟฟ้า</h1>
          <button class="btn btn-circle btn-ghost" @click="toggleTheme">
            <svg v-if="currentTheme === 'light'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
        <ul class="menu p-4">
          <li>
            <nuxt-link to="/" class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>ภาพรวม</span>
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="/analysis" class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>วิเคราะห์การใช้งาน</span>
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="/history" class="flex items-center space-x-2 active">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ประวัติย้อนหลัง</span>
            </nuxt-link>
          </li>
          <li>
            <a class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <span>ตั้งค่า</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-auto p-8">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">ประวัติการใช้ไฟฟ้า</h1>
          <div class="flex gap-2">
            <div class="join">
              <button 
                v-for="view in viewOptions" 
                :key="view.value"
                @click="currentView = view.value"
                class="btn join-item"
                :class="currentView === view.value ? 'btn-active' : ''"
              >
                {{ view.label }}
              </button>
            </div>
            <button class="btn btn-outline btn-primary" @click="exportData">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              ส่งออกข้อมูล
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="card bg-base-100 shadow mb-6">
          <div class="card-body">
            <div class="flex flex-wrap gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">ช่วงวันที่</span>
                </label>
                <select v-model="selectedDateRange" class="select select-bordered">
                  <option value="7">7 วันล่าสุด</option>
                  <option value="30">30 วันล่าสุด</option>
                  <option value="90">3 เดือนล่าสุด</option>
                  <option value="365">1 ปีล่าสุด</option>
                  <option value="custom">กำหนดเอง</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">ประเภทการใช้งาน</span>
                </label>
                <select v-model="selectedType" class="select select-bordered">
                  <option value="all">ทั้งหมด</option>
                  <option value="ac">เครื่องปรับอากาศ</option>
                  <option value="lighting">แสงสว่าง</option>
                  <option value="appliances">เครื่องใช้ไฟฟ้า</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Display -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <!-- Table View -->
            <div v-if="currentView === 'table'" class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>การใช้งานทั่วไป</th>
                    <th>เครื่องปรับอากาศ</th>
                    <th>แสงสว่าง</th>
                    <th>เครื่องใช้ไฟฟ้า</th>
                    <th>รวม (หน่วย)</th>
                    <th>ค่าไฟ (บาท)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in historyData" :key="record.date">
                    <td>{{ record.date }}</td>
                    <td>{{ record.general }}</td>
                    <td>{{ record.ac }}</td>
                    <td>{{ record.lighting }}</td>
                    <td>{{ record.appliances }}</td>
                    <td class="font-bold">{{ record.total }}</td>
                    <td class="font-bold text-primary">{{ record.cost }}</td>
                    <td>
                      <button class="btn btn-ghost btn-xs" @click="showDetails(record)">
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Graph View -->
            <div v-else-if="currentView === 'graph'" class="h-96">
              <canvas ref="historyChart"></canvas>
            </div>

            <!-- Calendar View -->
            <div v-else class="grid grid-cols-7 gap-4">
              <div v-for="day in calendarDays" :key="day.date" 
                   class="p-4 rounded-lg"
                   :class="getDayClass(day)">
                <div class="text-sm">{{ day.date }}</div>
                <div class="font-bold">{{ day.units }} หน่วย</div>
                <div class="text-xs">{{ day.cost }} บาท</div>
              </div>
            </div>

            <!-- Pagination -->
            <div class="flex justify-center mt-4">
              <div class="join">
                <button class="join-item btn">«</button>
                <button class="join-item btn">หน้า 1</button>
                <button class="join-item btn">หน้า 2</button>
                <button class="join-item btn">หน้า 3</button>
                <button class="join-item btn">»</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const currentTheme = ref('light');
const currentView = ref('table');
const selectedDateRange = ref('7');
const selectedType = ref('all');
const historyChart = ref(null);

const viewOptions = [
  { label: 'ตาราง', value: 'table' },
  { label: 'กราฟ', value: 'graph' },
  { label: 'ปฏิทิน', value: 'calendar' }
];

const historyData = ref([
  {
    date: '1 มี.ค. 2567',
    general: 5.2,
    ac: 8.3,
    lighting: 2.1,
    appliances: 4.5,
    total: 20.1,
    cost: 90.45
  },
  {
    date: '2 มี.ค. 2567',
    general: 4.8,
    ac: 7.9,
    lighting: 2.3,
    appliances: 4.2,
    total: 19.2,
    cost: 86.40
  },
  // Add more sample data as needed
]);

const calendarDays = ref([
  { date: '1', units: 20.1, cost: 90.45 },
  { date: '2', units: 19.2, cost: 86.40 },
  // Add more calendar data as needed
]);

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
};

const exportData = () => {
  // Implement export functionality
  alert('กำลังส่งออกข้อมูล...');
};

const showDetails = (record) => {
  // Implement show details functionality
  alert(`แสดงรายละเอียดสำหรับวันที่ ${record.date}`);
};

const getDayClass = (day) => {
  return day.units > 20 ? 'bg-red-200' : 'bg-green-200';
};

onMounted(() => {
  // Initialize history chart
  if (historyChart.value) {
    new Chart(historyChart.value, {
      type: 'line',
      data: {
        labels: historyData.value.map(record => record.date),
        datasets: [
          {
            label: 'การใช้ไฟฟ้ารวม (หน่วย)',
            data: historyData.value.map(record => record.total),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.1)'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'ประวัติการใช้ไฟฟ้า'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'หน่วยไฟฟ้า'
            }
          }
        }
      }
    });
  }
});
</script>

<style scoped>
.bg-red-200 {
  background-color: #fed7d7;
}
.bg-green-200 {
  background-color: #c6f6d5;
}
</style>