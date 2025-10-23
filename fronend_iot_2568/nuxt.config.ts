// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  //...
  build: {
    transpile: ['vuetify', 'mqtt'],
  },
  
  css: [
    '~/assets/css/main.css',
    '@/assets/css/font.css',
    '~/assets/css/styles.css'
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  // --- ⬇⬇⬇ นี่คือส่วนสำคัญ ⬇⬇⬇ ---
  runtimeConfig: {
    public: {
      // (คอมเมนต์: ตั้งชื่อตัวแปรว่า apiBaseUrl จะเข้าใจง่ายกว่า)
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000'
    }
  },
  // --- ⬆⬆⬆ จบส่วนสำคัญ ⬆⬆⬆ ---

  compatibilityDate: '2024-11-01',
})