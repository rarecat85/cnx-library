import { defineNuxtPlugin } from '#app'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()

  // Firebase 구성 정보
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId
  }

  // Firebase 앱 초기화 (이미 초기화된 경우 재초기화 방지)
  let app
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  // Firebase 서비스 초기화
  const auth = getAuth(app)
  const firestore = getFirestore(app)
  
  // Firebase Auth persistence 설정 (브라우저를 닫아도 로그인 상태 유지)
  // 기본값이 browserLocalPersistence이지만 명시적으로 설정
  if (process.client) {
    try {
      // persistence 설정을 await로 기다림 (중요!)
      await setPersistence(auth, browserLocalPersistence)
      console.log('Firebase Auth persistence 설정 완료')
    } catch (error) {
      console.error('Firebase Auth persistence 설정 실패:', error)
    }
  }

  // Nuxt 앱에 제공
  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firebaseFirestore: firestore
    }
  }
})

