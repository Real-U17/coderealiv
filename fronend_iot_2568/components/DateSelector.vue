<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();
defineEmits(['update:modelValue', 'fetch-data']);
</script>

<template>
  <div class="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
    <label class="text-gray-600 font-semibold">เลือกวันที่:</label>
    <input
      type="date"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="input input-bordered w-full max-w-xs border-gray-300 bg-white/90 rounded-lg focus:ring focus:ring-blue-500"
    />
    <button
      @click="$emit('fetch-data')"
      class="btn btn-primary bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
    >
      อัปเดตข้อมูล
    </button>
  </div>
</template>