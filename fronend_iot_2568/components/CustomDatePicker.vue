<script setup lang="ts">
import { ref, computed } from 'vue';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { th } from 'date-fns/locale';

const props = defineProps<{
  modelValue: string;
  availableDates?: string[];
}>();

const emit = defineEmits(['update:modelValue', 'date-selected']);

const showCalendar = ref(false);
const currentMonth = ref(new Date());

// เดือนปัจจุบันในรูปแบบข้อความ
const currentMonthText = computed(() => {
  return format(currentMonth.value, 'MMMM yyyy', { locale: th });
});

// คำนวณวันในเดือนปัจจุบัน
const daysInMonth = computed(() => {
  const start = startOfMonth(currentMonth.value);
  const end = endOfMonth(currentMonth.value);
  return eachDayOfInterval({ start, end });
});

// ตรวจสอบว่าวันนั้นมีข้อมูลหรือไม่
const isDateAvailable = (date: Date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return props.availableDates?.includes(dateString);
};

// เลื่อนไปเดือนก่อนหน้า
const previousMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1);
};

// เลื่อนไปเดือนถัดไป
const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1);
};

// เลือกวันที่
const selectDate = (date: Date) => {
  emit('update:modelValue', format(date, 'yyyy-MM-dd'));
  emit('date-selected');
  showCalendar.value = false;
};

// แปลงวันที่เป็นข้อความ
const formatDate = (date: string) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: th });
};
</script>

<template>
  <div class="relative">
    <button
      @click="showCalendar = !showCalendar"
      class="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span class="text-gray-700">{{ formatDate(modelValue) }}</span>
      <svg
        class="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </button>

    <!-- ปฏิทิน -->
    <div
      v-if="showCalendar"
      class="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200"
      style="min-width: 320px"
    >
      <!-- ส่วนหัวปฏิทิน -->
      <div class="flex justify-between items-center mb-4">
        <button
          @click="previousMonth"
          class="p-1 hover:bg-gray-100 rounded-full"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-lg font-semibold">{{ currentMonthText }}</span>
        <button
          @click="nextMonth"
          class="p-1 hover:bg-gray-100 rounded-full"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- วันในสัปดาห์ -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <template v-for="day in ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']" :key="day">
          <div class="text-center text-sm font-medium text-gray-700 py-1">
            {{ day }}
          </div>
        </template>
      </div>

      <!-- วันในเดือน -->
      <div class="grid grid-cols-7 gap-1">
        <template v-for="date in daysInMonth" :key="date.toISOString()">
          <button
            @click="selectDate(date)"
            class="aspect-square flex items-center justify-center text-sm rounded-full hover:bg-blue-50"
            :class="{
              'bg-blue-100': isDateAvailable(date),
              'text-blue-600 font-bold': format(date, 'yyyy-MM-dd') === modelValue,
              'text-gray-400': !isDateAvailable(date)
            }"
          >
            {{ format(date, 'd') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>