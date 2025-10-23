<template>
    <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">สรุปการใช้พลังงานรายเดือน</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เดือน</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การใช้พลังงาน (kWh)</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าไฟฟ้าประมาณการ (บาท)</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">กำลังไฟฟ้าเฉลี่ย (W)</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(month, index) in monthlyData" :key="index">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ month.month }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ month.kwh.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ month.cost.toFixed(2) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ month.avgPower.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { format } from 'date-fns';
  import { th } from 'date-fns/locale';
  import type { SensorData } from '../types';
  
  const PEAK_RATE = 5.7982;
  const OFF_PEAK_RATE = 2.6369;
  const FT_RATE = 0.5;
  const SERVICE_CHARGE = 38.22;
  
  const props = defineProps<{
    sensorData: SensorData[];
  }>();
  
  const monthlyData = computed(() => {
    if (!props.sensorData.length) return [];
  
    const monthlyGroups = new Map();
    
    // Group readings by month
    props.sensorData.forEach(reading => {
      const date = new Date(reading.timestamp);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, {
          month: format(date, 'MMMM yyyy', { locale: th }),
          readings: [],
          totalPower: 0,
          firstTimestamp: date,
          lastTimestamp: date
        });
      }
      
      const monthData = monthlyGroups.get(monthKey);
      monthData.readings.push(reading);
      monthData.totalPower += reading.power;
      monthData.lastTimestamp = date;
    });
  
    // Calculate monthly statistics
    return Array.from(monthlyGroups.values()).map(month => {
      const avgPower = month.totalPower / month.readings.length;
      const hours = (month.lastTimestamp.getTime() - month.firstTimestamp.getTime()) / (1000 * 60 * 60);
      const kwh = (avgPower * hours) / 1000;
      
      // Calculate costs
      const peakKwh = kwh * 0.7;
      const offPeakKwh = kwh * 0.3;
      const cost = (peakKwh * PEAK_RATE + offPeakKwh * OFF_PEAK_RATE) + 
                   (kwh * FT_RATE) + SERVICE_CHARGE;
  
      return {
        month: month.month,
        kwh,
        cost,
        avgPower
      };
    }).sort((a, b) => {
      // Sort by most recent month first
      const monthA = new Date(a.month.replace('พ.ศ. ', ''));
      const monthB = new Date(b.month.replace('พ.ศ. ', ''));
      return monthB.getTime() - monthA.getTime();
    });
  });
  </script>