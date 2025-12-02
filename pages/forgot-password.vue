<template>
  <div class="login-page">
    <div class="login-background">
      <!-- 상단 헤더 영역 (로고 + 텍스트) -->
      <div class="login-header">
        <div class="login-header-inner">
          <div class="login-logo">
            <ConcentrixLogo />
          </div>
          <div class="header-text-content">
            <div class="header-text-line">Share Knowledge,</div>
            <div class="header-text-line">Grow Together</div>
          </div>
        </div>
      </div>
      
      <v-container
        fluid
        class="login-container"
      >
        <v-row
          justify="center"
          class="login-row"
        >
          <v-col
            cols="12"
            class="login-col"
          >
            <v-card class="login-card">
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
    </div>
  </div>
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

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  position: relative;
}

.login-background {
  min-height: 100vh;
  background: linear-gradient(to bottom, #002C5B 0%, #002C5B 50%, #F2F2F2 50%, #F2F2F2 100%);
  position: relative;
}

.login-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 25vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  padding: 24px 16px;
}

.login-header-inner {
  max-width: 768px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-logo {
  display: flex;
  align-items: center;
}

.login-logo :deep(.logo-svg) {
  height: 28px;
  width: auto;
  color: #FFFFFF;
}

.header-text-content {
  text-align: left;
}

.header-text-line {
  font-size: 40px;
  font-weight: 300;
  color: #FFFFFF;
  line-height: 1.1;
  letter-spacing: 0.2px;
  font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
}

.login-container {
  padding: 0;
  height: 100vh;
  position: relative;
}

.login-row {
  height: 100vh;
  align-items: flex-start;
  padding-top: calc(56px + 15vh);
  margin: 0;
}

.login-col {
  display: flex;
  justify-content: center;
  padding: 0 16px;
  height: calc(100vh - 56px - 15vh);
  align-self: flex-end;
}

.login-card {
  padding: 48px 40px;
  max-width: 768px;
  width: 100%;
  margin: 0;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background-color: #FFFFFF;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.login-card :deep(.v-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
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

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.login-subtitle {
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

/* 모바일 반응형 */
@media (max-width: 768px) {
  .login-row {
    padding-top: calc(56px + 10vh);
  }

  .login-col {
    height: calc(100vh - 56px - 10vh);
  }

  .login-header {
    min-height: 25vh;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 12px 12px 0 0;
  }

  .header-text-line {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .login-row {
    padding-top: calc(56px + 10vh);
  }

  .login-col {
    height: calc(100vh - 56px - 10vh);
  }

  .login-header {
    min-height: 25vh;
  }

  .login-card {
    padding: 24px 20px;
  }

  .header-text-line {
    font-size: 24px;
  }
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

