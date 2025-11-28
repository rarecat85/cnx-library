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
        <v-card class="forgot-password-card">
          <div class="text-center mb-8">
            <h1 class="forgot-password-title mb-2">
              CNX Library
            </h1>
            <p class="forgot-password-subtitle">
              비밀번호 찾기
            </p>
          </div>

          <v-form
            ref="forgotPasswordForm"
            validate-on="submit"
            @submit.prevent="handleSendResetEmail"
          >
            <v-text-field
              v-model="email"
              label="이메일"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              variant="outlined"
              :rules="emailRules"
              :disabled="loading"
              class="mb-2"
              density="comfortable"
            />

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              closable
              class="error-alert mb-4"
              @click:close="error = ''"
            >
              {{ error }}
            </v-alert>

            <v-alert
              v-if="successMessage"
              type="success"
              variant="tonal"
              class="success-alert mb-4"
            >
              {{ successMessage }}
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="loading"
              :disabled="loading"
              class="submit-btn"
              elevation="2"
            >
              비밀번호 재설정 이메일 발송
            </v-btn>
          </v-form>

          <div class="auth-links text-center mt-4">
            <NuxtLink
              to="/login"
              class="auth-link"
            >
              로그인
            </NuxtLink>
          </div>
          
          <div class="logo-bottom text-center mt-6">
            <div class="logo-with-credit">
              <ConcentrixLogo />
              <span class="credit-text">© rarecat</span>
            </div>
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

const { sendPasswordResetEmail, loading } = useAuth()
const router = useRouter()

const email = ref('')
const error = ref('')
const successMessage = ref('')
const forgotPasswordForm = ref()

// 폼 검증 규칙
const emailRules = [
  (v) => !!v || '이메일을 입력해주세요',
  (v) => /.+@concentrix\.com$/.test(v) || '@concentrix.com 이메일만 사용 가능합니다'
]

// 비밀번호 재설정 이메일 발송
const handleSendResetEmail = async () => {
  error.value = ''
  successMessage.value = ''
  
  // 폼 검증
  const { valid } = await forgotPasswordForm.value.validate()
  if (!valid) return

  const result = await sendPasswordResetEmail(email.value)
  
  if (result.success) {
    successMessage.value = '비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.'
    email.value = ''
    forgotPasswordForm.value.resetValidation()
  } else {
    error.value = result.error || '이메일 발송에 실패했습니다.'
  }
}

// 페이지 메타데이터
useHead({
  title: '비밀번호 찾기 - CNX Library'
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #F2F2F2 0%, #E8E8E8 100%);
}

.forgot-password-card {
  padding: 48px 40px;
  max-width: 440px;
  margin: 0 auto;
}

.logo-bottom {
  margin-top: 24px;
}

.logo-with-credit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.credit-text {
  font-size: 10px;
  color: #6b7280;
  font-weight: 400;
}

.error-alert,
.success-alert {
  min-height: 48px;
  display: flex;
  align-items: center;
  margin-top: 16px;
}

.forgot-password-title {
  font-size: 32px;
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.forgot-password-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

/* 제출 버튼 스타일 */
.submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

/* 인증 링크 스타일 */
.auth-links {
  font-size: 14px;
}

.auth-link {
  color: #2A2F36;
  text-decoration: none;
  transition: color 0.2s;
}

.auth-link:hover {
  color: #002C5B;
  text-decoration: underline;
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

