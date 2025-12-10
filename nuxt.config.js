// https://nuxt.com/docs/api/configuration/nuxt-config

// GitHub Pages 배포 시 baseURL 설정 (로컬에서는 '/', 프로덕션에서는 '/cnx-library/')
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // SPA 모드 (Firebase 클라이언트 사용)
  ssr: false,
  
  // Runtime Config (환경 변수)
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || ''
    }
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
  },

  // 앱 설정
  app: {
    // GitHub Pages 배포 시 baseURL 설정
    baseURL: isGitHubPages ? '/cnx-library/' : '/',
    
    // 헤드 설정 (구글 폰트)
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap'
        }
      ]
    }
  }
})

