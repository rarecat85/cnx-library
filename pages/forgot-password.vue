<template>
  <v-app>
    <PageLayout>
      <div class="text-center mb-8">
        <h1 class="login-title mb-2">
          CNX Library
        </h1>
        <p class="login-subtitle">
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
    </PageLayout>
  </v-app>
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
  title: '비밀번호 찾기 - CNX Library',
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

.error-alert,
.success-alert {
  min-height: rem(48);
  display: flex;
  align-items: center;
  margin-top: rem(16);
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

/* 제출 버튼 스타일 */
.submit-btn {
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

/* 인증 링크 스타일 */
.auth-links {
  font-size: rem(14);
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
  padding-bottom: rem(6);
}

/* 카드 내부 여백 조정 */
:deep(.v-card-text) {
  padding: 0;
}
</style>
