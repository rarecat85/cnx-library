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
            <v-card
              class="login-card"
            >
          <div class="text-center mb-8">
            <h1 class="login-title mb-2">
              CNX Library
            </h1>
            <p class="login-subtitle">
              로그인하여 시작하세요
            </p>
          </div>

          <v-form
            ref="loginForm"
            validate-on="submit"
            @submit.prevent="handleLogin"
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

            <v-text-field
              v-model="password"
              label="비밀번호"
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

            <div class="remember-me-container mb-4">
              <v-checkbox
                v-model="rememberMe"
                label="자동로그인"
                color="primary"
                hide-details
                :disabled="loading"
                density="compact"
              />
            </div>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              closable
              class="error-alert mb-4"
              @click:close="error = ''"
            >
              <div class="error-content">
                <div class="error-message">
                  {{ error }}
                  <a
                    v-if="showResendButton"
                    href="#"
                    class="resend-link"
                    :class="{ 'resending': resending }"
                    :disabled="resending || loading"
                    @click.prevent="handleResendVerification"
                  >
                    인증 이메일 재전송
                  </a>
                </div>
              </div>
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="loading"
              :disabled="loading"
              class="login-btn"
              elevation="2"
            >
              로그인
            </v-btn>
          </v-form>

          <div class="auth-links text-center mt-4">
            <NuxtLink
              to="/signup"
              class="auth-link"
            >
              회원가입
            </NuxtLink>
            <span class="auth-link-divider" />
            <NuxtLink
              to="/forgot-password"
              class="auth-link"
            >
              비밀번호찾기
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

const { login, loading, resendVerificationEmailForLogin, user, getAutoLoginInfo } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loginForm = ref()
const showPassword = ref(false)
const showResendButton = ref(false)
const resending = ref(false)
const rememberMe = ref(false)

// 페이지 로드 시 자동로그인 확인 및 처리
onMounted(async () => {
  if (!process.client) return
  
  // 로컬스토리지에서 자동로그인 체크 상태 불러오기
  const savedRememberMe = localStorage.getItem('rememberMe')
  if (savedRememberMe === 'true') {
    rememberMe.value = true
  }
  
  // onAuthStateChanged의 첫 번째 콜백이 실행될 때까지 대기
  const authStateReady = useState('auth_state_ready')
  const authInitialized = useState('auth_initialized', () => false)
  
  if (!authInitialized.value && authStateReady.value) {
    try {
      await Promise.race([
        authStateReady.value,
        new Promise(resolve => setTimeout(resolve, 5000)) // 최대 5초 대기
      ])
    } catch (error) {
      console.error('인증 상태 확인 대기 중 오류:', error)
    }
  }
  
  // 인증 상태 로딩이 완료될 때까지 대기
  const { loading: authLoading } = useAuth()
  if (authLoading.value) {
    const maxWait = 3000
    const startTime = Date.now()
    while (authLoading.value && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // 이미 로그인된 상태인지 확인 (Firebase Auth persistence)
  if (user.value) {
    await router.push('/')
    return
  }
  
  // 자동로그인 정보 확인
  const autoLoginInfo = getAutoLoginInfo()
  if (autoLoginInfo) {
    // 자동로그인 정보가 있고 만료되지 않았음
    // Firebase Auth의 currentUser 확인
    const { $firebaseAuth } = useNuxtApp()
    const auth = $firebaseAuth
    
    if (auth && auth.currentUser) {
      // 이미 로그인되어 있으면 메인 페이지로 이동
      await router.push('/')
      return
    }
    
    // 이메일 필드에 자동으로 채우기 (사용자 편의)
    email.value = autoLoginInfo.email
  }
})

// 폼 검증 규칙
const emailRules = [
  (v) => !!v || '이메일을 입력해주세요',
  (v) => /.+@.+\..+/.test(v) || '올바른 이메일 형식이 아닙니다'
]

const passwordRules = [
  (v) => !!v || '비밀번호를 입력해주세요',
  (v) => (v && v.length >= 6) || '비밀번호는 6자 이상이어야 합니다'
]

// 로그인 처리
const handleLogin = async () => {
  error.value = ''
  showResendButton.value = false
  
  // 폼 검증
  const { valid } = await loginForm.value.validate()
  if (!valid) return

  const result = await login(email.value, password.value, rememberMe.value)
  
  if (result.success) {
    // 로그인 성공 시 메인 페이지로 이동
    await router.push('/')
  } else {
    error.value = result.error || '로그인에 실패했습니다.'
    // 이메일 인증 미완료 에러인 경우 재전송 버튼 표시
    if (result.error && (result.error.includes('이메일 인증이 완료되지 않았습니다') || result.error.includes('이메일 재인증이 필요합니다'))) {
      showResendButton.value = true
    }
  }
}

// 인증 이메일 재전송
const handleResendVerification = async () => {
  if (!email.value || !password.value) {
    error.value = '이메일과 비밀번호를 입력해주세요.'
    return
  }

  resending.value = true
  error.value = ''
  
  const result = await resendVerificationEmailForLogin(email.value, password.value)
  
  if (result.success) {
    error.value = '인증 이메일이 재전송되었습니다. 이메일을 확인해주세요.'
    showResendButton.value = false
  } else {
    error.value = result.error || '이메일 재전송에 실패했습니다.'
  }
  
  resending.value = false
}

// 페이지 메타데이터
useHead({
  title: '로그인 - CNX Library',
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
  min-height: 25vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1;
  padding: 8px 16px;
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

.error-alert {
  min-height: 48px;
  margin-top: 16px;
  position: relative;
}

.error-alert :deep(.v-alert__content) {
  width: 100%;
}

.error-alert :deep(.v-btn--icon.v-alert__close) {
  position: absolute;
  top: 8px;
  right: 8px;
}

.error-content {
  width: 100%;
}

.error-message {
  line-height: 1.5;
}

.resend-link {
  display: block;
  margin-top: 8px;
  color: #002C5B;
  text-decoration: underline;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.resend-link:hover {
  color: #001a3d;
}

.resend-link.resending,
.resend-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
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


/* 로그인 버튼 스타일 */
.login-btn {
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

.auth-link-divider {
  display: inline-block;
  width: 1px;
  height: 12px;
  margin: 0 12px;
  background-color: #d1d5db;
  vertical-align: middle;
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

/* 자동로그인 체크박스 스타일 */
.remember-me-container {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.remember-me-container :deep(.v-checkbox) {
  margin: 0;
}

.remember-me-container :deep(.v-checkbox .v-label) {
  font-size: 13px;
  line-height: 1.2;
}

.remember-me-container :deep(.v-checkbox .v-selection-control) {
  min-height: 0;
}

.remember-me-container :deep(.v-checkbox .v-selection-control__input) {
  width: 18px;
  height: 18px;
}

.remember-me-container :deep(.v-checkbox .v-icon) {
  font-size: 18px;
}
</style>

