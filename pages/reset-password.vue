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
        <v-card class="reset-password-card">
          <div class="text-center mb-8">
            <h1 class="reset-password-title mb-2">
              CNX Library
            </h1>
            <p class="reset-password-subtitle">
              비밀번호 재설정
            </p>
          </div>

          <div v-if="processing" class="text-center">
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

          <div v-else-if="success" class="text-center">
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
              새로운 비밀번호로 로그인해주세요.
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

          <div v-else-if="error" class="text-center">
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
              color="primary"
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

const { confirmPasswordReset, loading } = useAuth()
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

// URL 파라미터에서 mode와 oobCode 추출
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
  if (!mode || !oobCode) {
    error.value = true
    errorMessage.value = '잘못된 재설정 링크입니다.'
    processing.value = false
    return
  }

  if (mode !== 'resetPassword') {
    error.value = true
    errorMessage.value = '지원하지 않는 재설정 모드입니다.'
    processing.value = false
    return
  }

  // 링크 유효성 확인 완료
  processing.value = false
})

// 비밀번호 재설정 처리
const handleResetPassword = async () => {
  formError.value = ''
  
  // 폼 검증
  const { valid } = await resetPasswordForm.value.validate()
  if (!valid) return

  if (!oobCode) {
    formError.value = '재설정 코드가 없습니다.'
    return
  }

  try {
    processing.value = true
    const result = await confirmPasswordReset(oobCode, newPassword.value)
    
    if (result.success) {
      success.value = true
      processing.value = false
    } else {
      error.value = true
      errorMessage.value = result.error || '비밀번호 재설정에 실패했습니다.'
      processing.value = false
    }
  } catch (err) {
    error.value = true
    errorMessage.value = err.message || '비밀번호 재설정에 실패했습니다.'
    processing.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

// 페이지 메타데이터
useHead({
  title: '비밀번호 재설정 - CNX Library'
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #F2F2F2 0%, #E8E8E8 100%);
}

.reset-password-card {
  padding: 48px 40px;
  max-width: 440px;
  margin: 0 auto;
}

.reset-password-title {
  font-size: 32px;
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.reset-password-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

.processing-text {
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

.login-btn,
.reset-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.error-alert {
  min-height: 48px;
  display: flex;
  align-items: center;
  margin-top: 16px;
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
  padding-bottom: 6px;
}

/* 카드 내부 여백 조정 */
:deep(.v-card-text) {
  padding: 0;
}
</style>

