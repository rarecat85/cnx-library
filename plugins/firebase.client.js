import { defineNuxtPlugin } from '#app'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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
  const storage = getStorage(app)
  
  // Firestore 초기화 시 QUIC 프로토콜 에러 방지를 위해 long polling 사용
  let firestore
  if (process.client) {
    try {
      firestore = initializeFirestore(app, {
        experimentalForceLongPolling: true
      })
    } catch (error) {
      // 이미 초기화된 경우 에러 무시
      const { getFirestore } = await import('firebase/firestore')
      firestore = getFirestore(app)
    }
  } else {
    const { getFirestore } = await import('firebase/firestore')
    firestore = getFirestore(app)
  }
  
  // Firebase Auth persistence 설정 (브라우저 탭/창을 닫으면 로그아웃)
  // 공공PC 환경을 위해 browserSessionPersistence 사용
  if (process.client) {
    try {
      await setPersistence(auth, browserSessionPersistence)
      console.log('Firebase Auth persistence 설정 완료 (세션 기반)')
    } catch (error) {
      console.error('Firebase Auth persistence 설정 실패:', error)
    }
  }

  // Nuxt 앱에 제공
  return {
    provide: {
      firebaseApp: app,
      firebaseAuth: auth,
      firebaseFirestore: firestore,
      firebaseStorage: storage
    }
  }
})

