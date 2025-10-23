<script setup lang="ts">
defineProps<{
  dailyEnergy: number;
  dailyCost: number;
  monthlyEnergy: number;
  monthlyCost: number;
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
</template>