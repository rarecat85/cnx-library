<template>
  <v-app>
    <PageLayout>
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

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="error-alert mb-4"
        @click:close="clearError"
      >
        <div class="error-content">
          <div class="error-message">
            {{ displayError }}
            <a
              v-if="showResendButton"
              href="#"
              class="resend-link"
              :class="{ 'resending': resending }"
              :disabled="resending || loading"
              @click.prevent="handleResendVerification"
            >
              <v-progress-circular
                v-if="resending"
                indeterminate
                size="14"
                width="2"
                class="mr-1"
              />
              {{ resending ? '재전송 중...' : '인증 이메일 재전송' }}
            </a>
          </div>
        </div>
      </v-alert>

      <v-btn
        type="submit"
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
  </PageLayout>
  </v-app>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: []
})

const { login, loading, resendVerificationEmailForLogin, user } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loginForm = ref()
const showPassword = ref(false)
const showResendButton = ref(false)
const resending = ref(false)
const rateLimitCountdown = ref(0)
let countdownInterval = null

// 에러 메시지에서 카운트다운 부분을 제외한 메시지 표시
const displayError = computed(() => {
  if (rateLimitCountdown.value > 0) {
    return `잠시 후 다시 시도해주세요. (${rateLimitCountdown.value}초 후)`
  }
  // "(XX초 후)" 패턴 제거
  return error.value.replace(/\s*\(\d+초 후\)/, '')
})

// 에러 초기화
const clearError = () => {
  error.value = ''
  rateLimitCountdown.value = 0
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// 에러 메시지에서 대기 시간 추출 및 카운트다운 시작
const startRateLimitCountdown = (errorMessage) => {
  const match = errorMessage.match(/\((\d+)초 후\)/)
  if (match) {
    const seconds = parseInt(match[1], 10)
    rateLimitCountdown.value = seconds
    
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    
    countdownInterval = setInterval(() => {
      rateLimitCountdown.value--
      if (rateLimitCountdown.value <= 0) {
        clearInterval(countdownInterval)
        countdownInterval = null
        // 카운트다운이 끝나면 에러 메시지 제거
        error.value = ''
      }
    }, 1000)
  }
}

// 컴포넌트 언마운트 시 인터벌 정리
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

// 페이지 로드 시 로그인 상태 확인
onMounted(async () => {
  if (!process.client) return
  
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
  
  // 이미 로그인된 상태인지 확인
  if (user.value) {
    await router.push('/')
    return
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

  const result = await login(email.value, password.value)
  
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
  clearError()
  
  const result = await resendVerificationEmailForLogin(email.value, password.value)
  
  if (result.success) {
    error.value = '인증 이메일이 재전송되었습니다. 이메일을 확인해주세요.'
    showResendButton.value = false
  } else {
    error.value = result.error || '이메일 재전송에 실패했습니다.'
    // rate limit 에러인 경우 카운트다운 시작
    if (result.error && result.error.includes('초 후')) {
      startRateLimitCountdown(result.error)
    }
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

.error-alert {
  min-height: rem(48);
  margin-top: rem(16);
}

.error-alert :deep(.v-alert__content) {
  width: 100%;
  padding-right: rem(24);
}

.error-alert :deep(.v-alert__close) {
  align-self: flex-start;
  margin-top: rem(2);
}

.error-content {
  width: 100%;
}

.error-message {
  line-height: 1.5;
  word-break: keep-all;
}

.resend-link {
  display: inline-flex;
  align-items: center;
  margin-top: rem(8);
  color: #002C5B;
  text-decoration: underline;
  font-size: rem(14);
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


/* 로그인 버튼 스타일 */
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

.auth-link-divider {
  display: inline-block;
  width: rem(1);
  height: rem(12);
  margin: 0 rem(12);
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
  padding-bottom: rem(6);
}

/* 카드 내부 여백 조정 */
:deep(.v-card-text) {
  padding: 0;
}

</style>

