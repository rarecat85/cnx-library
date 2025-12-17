<template>
  <v-app>
    <PageLayout>
      <div class="text-center mb-8">
        <h1 class="login-title mb-2">
          CNX Library
        </h1>
        <p class="login-subtitle">
          비밀번호 재설정
        </p>
      </div>

      <div
        v-if="processing"
        class="text-center py-8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
          class="mb-4"
        />
        <p class="processing-text">
          비밀번호 재설정을 처리하는 중입니다...
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
          비밀번호가 재설정되었습니다!
        </h2>
        <p class="success-text mb-6">
          {{ isLoggedIn ? '비밀번호가 성공적으로 변경되었습니다.' : '새로운 비밀번호로 로그인해주세요.' }}
        </p>
        <v-btn
          block
          size="large"
          class="login-btn"
          elevation="2"
          @click="goToNextPage"
        >
          {{ isLoggedIn ? '마이페이지로 돌아가기' : '로그인하기' }}
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
          재설정에 실패했습니다
        </h2>
        <p class="error-text mb-6">
          {{ errorMessage }}
        </p>
        
        <!-- 만료되거나 유효하지 않은 토큰인 경우 재요청 안내 -->
        <div
          v-if="canRetry"
          class="mb-6"
        >
          <p class="info-text mb-4">
            새로운 비밀번호 재설정 링크를 받으시려면<br>
            비밀번호 찾기 페이지에서 다시 요청해주세요.
          </p>
        </div>
        
        <v-btn
          v-if="canRetry"
          block
          size="large"
          class="login-btn mb-3"
          elevation="2"
          @click="goToForgotPassword"
        >
          비밀번호 찾기로 이동
        </v-btn>
        <v-btn
          block
          size="large"
          :class="canRetry ? 'secondary-btn' : 'login-btn'"
          elevation="2"
          @click="goToNextPage"
        >
          {{ isLoggedIn ? '마이페이지로 돌아가기' : '로그인 페이지로 이동' }}
        </v-btn>
      </div>

      <v-form
        v-else
        ref="resetPasswordForm"
        validate-on="submit"
        @submit.prevent="handleResetPassword"
      >
        <v-text-field
          v-model="newPassword"
          label="새 비밀번호"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          variant="outlined"
          :rules="passwordRules"
          :disabled="loading"
          class="mb-2"
          density="comfortable"
          @click:append-inner="showPassword = !showPassword"
        />

        <v-text-field
          v-model="confirmPassword"
          label="비밀번호 확인"
          :type="showConfirmPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-check-outline"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          variant="outlined"
          :rules="confirmPasswordRules"
          :disabled="loading"
          class="mb-2"
          density="comfortable"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
        />

        <v-alert
          v-if="formError"
          type="error"
          variant="tonal"
          closable
          class="error-alert mb-4"
          @click:close="formError = ''"
        >
          {{ formError }}
        </v-alert>

        <v-btn
          type="submit"
          block
          size="large"
          :loading="loading"
          :disabled="loading"
          class="reset-btn"
          elevation="2"
        >
          비밀번호 재설정
        </v-btn>
      </v-form>

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

const { verifyPasswordResetToken, confirmPasswordReset, loading, user } = useAuth()
const router = useRouter()
const route = useRoute()

const newPassword = ref('')
const confirmPassword = ref('')
const processing = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')
const formError = ref('')
const resetPasswordForm = ref()
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoggedIn = ref(false)
const canRetry = ref(false)

// URL 파라미터에서 token과 uid 추출 (자체 시스템)
const token = route.query.token
const uid = route.query.uid

// 기존 Firebase 파라미터 (호환용)
const mode = route.query.mode
const oobCode = route.query.oobCode

// 폼 검증 규칙
const passwordRules = [
  (v) => !!v || '비밀번호를 입력해주세요',
  (v) => (v && v.length >= 6) || '비밀번호는 6자 이상이어야 합니다'
]

const confirmPasswordRules = [
  (v) => !!v || '비밀번호 확인을 입력해주세요',
  (v) => v === newPassword.value || '비밀번호가 일치하지 않습니다'
]

onMounted(async () => {
  // 로그인 상태 확인
  isLoggedIn.value = !!user.value

  // 자체 시스템 (token과 uid가 있는 경우)
  if (token && uid) {
    await verifyWithToken()
    return
  }
  
  // 기존 Firebase 시스템 (mode와 oobCode가 있는 경우)
  if (mode && oobCode) {
    await verifyWithFirebase()
    return
  }

  // 파라미터가 없는 경우
  error.value = true
  errorMessage.value = '잘못된 재설정 링크입니다.'
  canRetry.value = true
  processing.value = false
})

// 자체 토큰 검증
const verifyWithToken = async () => {
  try {
    const result = await verifyPasswordResetToken(token, uid)
    
    if (result.success) {
      // 토큰 유효, 폼 표시
      processing.value = false
    } else {
      error.value = true
      errorMessage.value = result.error || '유효하지 않은 재설정 링크입니다.'
      canRetry.value = result.errorType === 'invalid_token' || result.errorType === 'expired_token'
      processing.value = false
    }
  } catch (err) {
    console.error('토큰 검증 오류:', err)
    error.value = true
    errorMessage.value = '재설정 링크 검증 중 오류가 발생했습니다.'
    canRetry.value = true
    processing.value = false
  }
}

// 기존 Firebase 검증 (호환용)
const verifyWithFirebase = async () => {
  if (mode !== 'resetPassword') {
    error.value = true
    errorMessage.value = '지원하지 않는 재설정 모드입니다.'
    processing.value = false
    return
  }

  // 링크 유효성 확인 완료 (Firebase는 제출 시 확인)
  processing.value = false
}

// 비밀번호 재설정 처리
const handleResetPassword = async () => {
  formError.value = ''
  
  // 폼 검증
  const { valid } = await resetPasswordForm.value.validate()
  if (!valid) return

  try {
    processing.value = true
    
    let result
    
    // 자체 시스템
    if (token && uid) {
      result = await confirmPasswordReset(token, uid, newPassword.value)
    } 
    // 기존 Firebase 시스템 (호환용)
    else if (oobCode) {
      // Firebase 시스템은 더 이상 지원하지 않음
      result = { success: false, error: '이 링크는 더 이상 유효하지 않습니다. 새로운 비밀번호 재설정을 요청해주세요.' }
    }
    else {
      result = { success: false, error: '재설정 정보가 없습니다.' }
    }
    
    if (result.success) {
      success.value = true
      processing.value = false
    } else {
      error.value = true
      errorMessage.value = result.error || '비밀번호 재설정에 실패했습니다.'
      canRetry.value = true
      processing.value = false
    }
  } catch (err) {
    error.value = true
    errorMessage.value = err.message || '비밀번호 재설정에 실패했습니다.'
    canRetry.value = true
    processing.value = false
  }
}

const goToNextPage = () => {
  // 로그인 상태였으면 마이페이지로, 아니면 로그인 페이지로 이동
  if (isLoggedIn.value) {
    router.push('/mypage')
  } else {
    router.push('/login')
  }
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}

// 페이지 메타데이터
useHead({
  title: '비밀번호 재설정 - CNX Library',
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

.processing-text {
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

.login-btn,
.reset-btn {
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

.secondary-btn {
  height: rem(48);
  font-size: rem(16);
  font-weight: 500;
  border-radius: rem(8);
  background-color: #f3f4f6;
  color: #4b5563;
  
  &:hover:not(:disabled) {
    background-color: #e5e7eb;
  }
}

.error-alert {
  min-height: rem(48);
  display: flex;
  align-items: center;
  margin-top: rem(16);
}

/* 입력 필드 간격 조정 */
:deep(.v-text-field) {
  margin-bottom: 0;
}

/* 메시지가 없을 때 영역 숨기기 */
:deep(.v-input__details:not(:has(.v-messages__message))) {
  display: none;
  min-height: 0;
  padding: 0;
  margin: 0;
  height: 0;
}

/* 메시지가 있을 때만 표시 */
:deep(.v-input__details:has(.v-messages__message)) {
  padding-bottom: rem(6);
}

/* 카드 내부 여백 조정 */
:deep(.v-card-text) {
  padding: 0;
}
</style>
