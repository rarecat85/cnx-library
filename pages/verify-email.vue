<template>
  <v-app>
    <PageLayout>
      <div class="text-center mb-8">
        <h1 class="login-title mb-2">
          CNX Library
        </h1>
        <p class="login-subtitle">
          이메일 인증
        </p>
      </div>

      <div
        v-if="verifying"
        class="text-center py-8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        />
        <p class="verifying-text">
          이메일 인증을 처리하는 중입니다...
        </p>
      </div>

      <div
        v-else-if="success"
        class="text-center"
      >
        <v-icon
          color="success"
          size="64"
          class="mb-4"
        >
          mdi-check-circle
        </v-icon>
        <h2 class="success-title mb-4">
          이메일 인증이 완료되었습니다!
        </h2>
        <p class="success-text mb-6">
          이제 로그인하여 CNX Library를 이용하실 수 있습니다.
        </p>
        <v-btn
          block
          size="large"
          class="login-btn"
          elevation="2"
          @click="goToLogin"
        >
          로그인하기
        </v-btn>
      </div>

      <div
        v-else-if="error"
        class="text-center"
      >
        <v-icon
          color="error"
          size="64"
          class="mb-4"
        >
          mdi-alert-circle
        </v-icon>
        <h2 class="error-title mb-4">
          인증에 실패했습니다
        </h2>
        <p class="error-text mb-6">
          {{ errorMessage }}
        </p>
        
        <!-- 만료되거나 유효하지 않은 토큰인 경우 재전송 안내 -->
        <div
          v-if="canResend"
          class="mb-6"
        >
          <p class="info-text mb-4">
            새로운 인증 메일을 받으시려면 로그인 페이지에서<br>
            "인증 이메일 재전송"을 클릭해주세요.
          </p>
        </div>
        
        <v-btn
          block
          size="large"
          class="login-btn"
          elevation="2"
          @click="goToLogin"
        >
          로그인 페이지로 이동
        </v-btn>
      </div>

      <div class="logo-bottom text-center mt-6">
        <div class="logo-with-credit">
          <ConcentrixLogo />
          <span class="credit-text">© rarecat</span>
        </div>
      </div>
    </PageLayout>
  </v-app>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: []
})

const { $firebaseApp } = useNuxtApp()
const router = useRouter()
const route = useRoute()

const verifying = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')
const canResend = ref(false)

// URL 파라미터에서 token과 uid 추출
const token = route.query.token
const uid = route.query.uid

// 기존 Firebase 인증 링크 파라미터 (호환용)
const mode = route.query.mode
const oobCode = route.query.oobCode

onMounted(async () => {
  // 자체 인증 시스템 (token과 uid가 있는 경우)
  if (token && uid) {
    await verifyWithToken()
    return
  }
  
  // 기존 Firebase 인증 시스템 (mode와 oobCode가 있는 경우)
  if (mode && oobCode) {
    await verifyWithFirebase()
    return
  }
  
  // 파라미터가 없는 경우
  error.value = true
  errorMessage.value = '유효하지 않은 인증 링크입니다.'
  canResend.value = true
  verifying.value = false
})

// 자체 토큰 인증
const verifyWithToken = async () => {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions($firebaseApp)
    const verifyEmailToken = httpsCallable(functions, 'verifyEmailToken')
    
    const result = await verifyEmailToken({ token, uid })
    
    if (result.data.success) {
      success.value = true
      verifying.value = false
    } else {
      error.value = true
      errorMessage.value = result.data.error || '인증에 실패했습니다.'
      verifying.value = false
      
      // 만료되거나 유효하지 않은 토큰인 경우 재전송 안내
      if (result.data.errorType === 'invalid_token' || result.data.errorType === 'expired_token' || result.data.errorType === 'no_token') {
        canResend.value = true
      }
    }
  } catch (err) {
    console.error('토큰 인증 오류:', err)
    error.value = true
    errorMessage.value = '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    canResend.value = true
    verifying.value = false
  }
}

// 기존 Firebase 인증 (호환용)
const verifyWithFirebase = async () => {
  // 비밀번호 재설정 모드인 경우 reset-password 페이지로 리다이렉트
  if (mode === 'resetPassword') {
    await router.push({
      path: '/reset-password',
      query: {
        mode: mode,
        oobCode: oobCode
      }
    })
    return
  }

  // 이메일 인증 모드만 처리
  if (mode !== 'verifyEmail') {
    error.value = true
    errorMessage.value = '지원하지 않는 인증 모드입니다.'
    verifying.value = false
    return
  }

  try {
    const { applyActionCode, checkActionCode } = await import('firebase/auth')
    const { collection, query, where, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const { $firebaseAuth, $firebaseFirestore } = useNuxtApp()
    
    const auth = $firebaseAuth
    const firestore = $firebaseFirestore

    if (!auth || !firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    // 인증 코드 유효성 확인
    let email = null
    try {
      const actionCodeInfo = await checkActionCode(auth, oobCode)
      email = actionCodeInfo.data.email
    } catch (checkError) {
      if (checkError.code === 'auth/invalid-action-code') {
        // 이미 사용된 코드
        error.value = true
        errorMessage.value = '이미 사용되었거나 유효하지 않은 인증 링크입니다.'
        canResend.value = true
        verifying.value = false
        return
      }
      throw checkError
    }

    // 인증 코드 적용
    await applyActionCode(auth, oobCode)

    // Firestore 업데이트
    if (email) {
      const usersRef = collection(firestore, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userRef = doc(firestore, 'users', userDoc.id)
        
        await setDoc(userRef, {
          emailVerified: true,
          emailVerifiedAt: serverTimestamp(),
          verificationToken: null,
          verificationTokenCreatedAt: null,
          verificationTokenExpiresAt: null,
          updatedAt: serverTimestamp()
        }, { merge: true })
      }
    }

    success.value = true
    verifying.value = false
  } catch (err) {
    console.error('Firebase 인증 오류:', err)
    error.value = true
    verifying.value = false

    if (err.code === 'auth/expired-action-code') {
      errorMessage.value = '인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.'
      canResend.value = true
    } else if (err.code === 'auth/invalid-action-code') {
      errorMessage.value = '이미 인증된 이메일이거나 유효하지 않은 인증 링크입니다.'
      canResend.value = true
    } else if (err.code === 'auth/user-disabled') {
      errorMessage.value = '비활성화된 계정입니다.'
    } else if (err.code === 'auth/user-not-found') {
      errorMessage.value = '사용자를 찾을 수 없습니다.'
    } else {
      errorMessage.value = err.message || '이메일 인증에 실패했습니다.'
    }
  }
}

const goToLogin = () => {
  router.push('/login')
}

// 페이지 메타데이터
useHead({
  title: '이메일 인증 - CNX Library',
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
      href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap'
    }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.logo-bottom {
  margin-top: rem(24);
}

.logo-with-credit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: rem(8);
}

.logo-with-credit :deep(.logo-svg) {
  height: rem(16);
  width: auto;
  color: #002C5B;
}

.credit-text {
  font-size: rem(10);
  color: #6b7280;
  font-weight: 400;
}

.login-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.login-subtitle {
  font-size: rem(16);
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

.verifying-text {
  font-size: rem(16);
  color: #6b7280;
  margin: 0;
}

.success-title {
  font-size: rem(24);
  font-weight: 600;
  color: #002C5B;
  margin: 0;
}

.success-text {
  font-size: rem(16);
  color: #6b7280;
  margin: 0;
}

.error-title {
  font-size: rem(24);
  font-weight: 600;
  color: #CC3256;
  margin: 0;
}

.error-text {
  font-size: rem(16);
  color: #6b7280;
  margin: 0;
}

.info-text {
  font-size: rem(14);
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.login-btn {
  height: rem(48);
  font-size: rem(16);
  font-weight: 500;
  border-radius: rem(8);
  background-color: #002C5B;
  color: #FFFFFF;
  
  &:hover:not(:disabled) {
    background-color: #003d7a;
  }
}
</style>
