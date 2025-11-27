<template>
  <v-container
    fluid
    class="fill-height"
  >
    <v-row
      align="center"
      justify="center"
      class="fill-height"
    >
      <v-col
        cols="12"
        sm="8"
        lg="4"
      >
        <v-card class="verify-card">
          <div class="text-center mb-8">
            <h1 class="verify-title mb-2">
              CNX Library
            </h1>
            <p class="verify-subtitle">
              이메일 인증
            </p>
          </div>

          <div
            v-if="verifying"
            class="text-center"
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
              color="primary"
              size="large"
              block
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
            <v-btn
              color="primary"
              size="large"
              block
              class="login-btn"
              elevation="2"
              @click="goToLogin"
            >
              로그인 페이지로 이동
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: []
})

const { $firebaseAuth, $firebaseFirestore } = useNuxtApp()
const router = useRouter()
const route = useRoute()

const verifying = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

// URL 파라미터에서 mode와 oobCode 추출
const mode = route.query.mode
const oobCode = route.query.oobCode

onMounted(async () => {
  if (!mode || !oobCode) {
    error.value = true
    errorMessage.value = '잘못된 인증 링크입니다.'
    verifying.value = false
    return
  }

  if (mode !== 'verifyEmail') {
    error.value = true
    errorMessage.value = '지원하지 않는 인증 모드입니다.'
    verifying.value = false
    return
  }

  try {
    const { applyActionCode, checkActionCode } = await import('firebase/auth')
    const { collection, query, where, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    
    const auth = $firebaseAuth
    const firestore = $firebaseFirestore

    if (!auth || !firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    // 인증 코드 유효성 확인
    const actionCodeInfo = await checkActionCode(auth, oobCode)
    const email = actionCodeInfo.data.email

    if (!email) {
      throw new Error('이메일 정보를 찾을 수 없습니다.')
    }

    // 인증 코드 적용 (Firebase Auth의 emailVerified 상태 업데이트)
    await applyActionCode(auth, oobCode)

    // Firestore에서 이메일로 사용자 문서 찾기
    const usersRef = collection(firestore, 'users')
    const q = query(usersRef, where('email', '==', email))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // 사용자 문서 찾음
      const userDoc = querySnapshot.docs[0]
      const userRef = doc(firestore, 'users', userDoc.id)
      
      // Firestore 업데이트
      await setDoc(userRef, {
        emailVerified: true,
        emailVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })
    }

    success.value = true
    verifying.value = false
  } catch (err) {
    console.error('이메일 인증 오류:', err)
    error.value = true
    verifying.value = false

    if (err.code === 'auth/expired-action-code') {
      errorMessage.value = '인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.'
    } else if (err.code === 'auth/invalid-action-code') {
      errorMessage.value = '유효하지 않은 인증 링크입니다.'
    } else if (err.code === 'auth/user-disabled') {
      errorMessage.value = '비활성화된 계정입니다.'
    } else if (err.code === 'auth/user-not-found') {
      errorMessage.value = '사용자를 찾을 수 없습니다.'
    } else {
      errorMessage.value = err.message || '이메일 인증에 실패했습니다.'
    }
  }
})

const goToLogin = () => {
  router.push('/login')
}

// 페이지 메타데이터
useHead({
  title: '이메일 인증 - CNX Library'
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #F2F2F2 0%, #E8E8E8 100%);
}

.verify-card {
  padding: 48px 40px;
  max-width: 440px;
  margin: 0 auto;
}

.verify-title {
  font-size: 32px;
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.verify-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

.verifying-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #002C5B;
  margin: 0;
}

.success-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #CC3256;
  margin: 0;
}

.error-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}
</style>

