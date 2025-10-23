<template>
    <nav class="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg p-4 md:p-6">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo Section -->
        <div class="flex items-center gap-3">
          <img src="../assets/images/electricity.png" alt="Logo" class="h-10 w-10" />
          <span class="text-xl md:text-2xl font-bold text-blue-600">
            แพลตฟอร์มแสดงผลและจัดการพลังงานผ่านระบบ IOT
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
            รายละเอียด
          </router-link>
        </div>
      </div>
    </nav>
  </template>