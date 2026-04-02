// https://nuxt.com/docs/api/configuration/nuxt-config

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

// GitHub Pages 배포 시 baseURL 설정 (로컬에서는 '/', 프로덕션에서는 '/cnx-library/')
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** Vite가 `node_modules/nuxt/.../manifest.js`의 `import("#app-manifest")`를 분석할 때 해석 실패하는 경우 보완 */
function vitePluginResolveAppManifest() {
  const manifestPath = path.resolve(projectRoot, '.nuxt/manifest/meta/dev.json')
  const virtualId = '\0cnx:app-manifest'
  return {
    name: 'cnx-resolve-app-manifest',
    enforce: 'pre',
    resolveId(id) {
      if (id === '#app-manifest') {
        // `.nuxt` 산출물이 없거나 재시작 중이면 실제 파일이 없을 수 있어
        // 가상 모듈로 안전하게 대체한다.
        return fs.existsSync(manifestPath) ? manifestPath : virtualId
      }
    }
    ,
    load(id) {
      if (id === virtualId) {
        return 'export default {}'
      }
    }
  }
}

export default defineNuxtConfig({
  devtools: { enabled: true },

  // Nuxt 3.21+ 스키마 해석 시 get("future") 순서 이슈 방지
  future: {
    compatibilityVersion: 3
  },

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
    plugins: [vitePluginResolveAppManifest()],
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

    // 헤드 설정 (구글 폰트, favicon, 바탕화면 바로가기 아이콘)
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: `${isGitHubPages ? '/cnx-library/' : '/'}images/favicon.png`
        },
        {
          rel: 'apple-touch-icon',
          href: `${isGitHubPages ? '/cnx-library/' : '/'}images/favicon.png`
        },
        {
          rel: 'manifest',
          href: `${isGitHubPages ? '/cnx-library/' : '/'}manifest.webmanifest`
        },
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
