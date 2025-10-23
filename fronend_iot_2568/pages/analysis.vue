<!-- pages/analysis.vue -->
<template>
    <div class="min-h-screen" :data-theme="currentTheme">
      <div class="flex h-screen bg-base-200">
        <!-- Sidebar (เหมือนเดิม) -->
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
            <nuxt-link to="/" class="flex items-center space-x-2 ">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>ภาพรวม</span>
            </nuxt-link>
          </li>
          <li> 
            <nuxt-link to="/analysis" class="flex items-center space-x-2 active">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>วิเคราะห์การใช้งาน</span>
            </nuxt-link>
          </li>
          <li>
            <nuxt-link to="/history" class="flex items-center space-x-2">
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
            <h1 class="text-2xl font-bold">วิเคราะห์การใช้งาน</h1>
            <div class="flex gap-2">
              <select v-model="selectedPeriod" class="select select-bordered">
                <option value="7">7 วันล่าสุด</option>
                <option value="30">30 วันล่าสุด</option>
                <option value="90">3 เดือนล่าสุด</option>
                <option value="365">1 ปีล่าสุด</option>
              </select>
              <button class="btn btn-primary" @click="generateReport">
                สร้างรายงาน
              </button>
            </div>
          </div>
  
          <!-- Usage Analysis Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Peak Usage Times -->
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title">ช่วงเวลาใช้ไฟฟ้าสูงสุด</h3>
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <thead>
                      <tr>
                        <th>ช่วงเวลา</th>
                        <th>การใช้งาน (หน่วย)</th>
                        <th>% ของทั้งวัน</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="time in peakTimes" :key="time.period">
                        <td>{{ time.period }}</td>
                        <td>{{ time.usage }}</td>
                        <td>{{ time.percentage }}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
  
            <!-- Device Usage -->
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title">การใช้งานตามอุปกรณ์</h3>
                <canvas ref="deviceChart"></canvas>
              </div>
            </div>
          </div>
  
          <!-- Detailed Analysis -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Usage Patterns -->
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title">รูปแบบการใช้งาน</h3>
                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">วันที่ใช้มากที่สุด</div>
                    <div class="stat-value text-primary">วันอาทิตย์</div>
                    <div class="stat-desc">เฉลี่ย 25.4 หน่วย/วัน</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">ช่วงเวลาที่ใช้มากที่สุด</div>
                    <div class="stat-value text-secondary">19:00-22:00</div>
                    <div class="stat-desc">35% ของการใช้งานทั้งวัน</div>
                  </div>
                </div>
                <div class="mt-4">
                  <h4 class="font-bold mb-2">คำแนะนำในการประหยัดพลังงาน</h4>
                  <ul class="list-disc list-inside space-y-2">
                    <li>ลดการใช้งานในช่วง Peak (19:00-22:00)</li>
                    <li>ตั้งอุณหภูมิแอร์ที่ 25°C</li>
                    <li>เปลี่ยนมาใช้หลอด LED</li>
                  </ul>
                </div>
              </div>
            </div>
  
            <!-- Cost Analysis -->
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title">วิเคราะห์ค่าใช้จ่าย</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span>ค่าไฟเฉลี่ยต่อวัน</span>
                    <span class="text-xl font-bold">85.50 บาท</span>
                  </div>
                  <progress class="progress progress-primary w-full" value="70" max="100"></progress>
                  <div class="flex justify-between items-center">
                    <span>ค่าไฟต่อหน่วย</span>
                    <span class="text-xl font-bold">4.50 บาท</span>
                  </div>
                  <div class="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                      <h3 class="font-bold">ประหยัดได้อีก</h3>
                      <p>คุณสามารถประหยัดค่าไฟได้อีก 450 บาท/เดือน</p>
                    </div>
                  </div>
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
  const selectedPeriod = ref('30');
  const deviceChart = ref(null);
  
  const peakTimes = ref([
    { period: '19:00-22:00', usage: '8.5', percentage: 35 },
    { period: '12:00-15:00', usage: '6.2', percentage: 26 },
    { period: '07:00-10:00', usage: '5.8', percentage: 24 },
    { period: 'อื่นๆ', usage: '3.5', percentage: 15 },
  ]);
  
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    // Save theme preference to localStorage
    localStorage.setItem('theme', currentTheme.value);
  };
  
  const generateReport = () => {
    alert('กำลังสร้างรายงานสำหรับ ' + selectedPeriod.value + ' วัน');
  };
  
  onMounted(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      currentTheme.value = savedTheme;
    }
  
    // Device Usage Pie Chart
    if (deviceChart.value) {
      new Chart(deviceChart.value, {
        type: 'pie',
        data: {
          labels: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ทีวี', 'อื่นๆ'],
          datasets: [{
            data: [45, 20, 15, 10, 10],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'สัดส่วนการใช้ไฟฟ้าตามอุปกรณ์ (%)'
            }
          }
        }
      });
    }
  });
  </script>