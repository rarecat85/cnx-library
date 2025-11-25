// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // TypeScript 설정
  typescript: {
    typeCheck: true,
    strict: true,
    shim: false
  },

  // CSS 설정
  css: [
    'vuetify/styles',
    '@/assets/scss/main.scss'
  ],

  // Vuetify 빌드 설정
  build: {
    transpile: ['vuetify']
  },

  // Vite 설정
  vite: {
    define: {
      'process.env.DEBUG': 'false'
    },
    ssr: {
      noExternal: ['vuetify']
    }
  }
})

