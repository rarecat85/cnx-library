<template>
  <v-app>
    <PageLayout>
      <div class="text-center mb-8">
        <h1 class="login-title mb-2">
          CNX Library
        </h1>
        <p class="login-subtitle">
          회원가입
        </p>
      </div>

      <v-form
        ref="signupForm"
        validate-on="submit"
        @submit.prevent="handleSignup"
      >
        <v-text-field
          v-model="name"
          label="이름"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          :rules="nameRules"
          :disabled="loading"
          class="mb-2"
          density="comfortable"
        />

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

        <v-select
          v-model="workplace"
          label="근무지"
          :items="workplaceOptions"
          prepend-inner-icon="mdi-office-building-outline"
          variant="outlined"
          :rules="workplaceRules"
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
          <div class="success-message-text">
            {{ successMessage }}
          </div>
          <div
            v-if="countdown > 0"
            class="countdown-text mt-2"
          >
            {{ countdown }}초 뒤 로그인 페이지로 이동합니다.
          </div>
        </v-alert>

        <v-btn
          type="submit"
          block
          size="large"
          :loading="loading"
          :disabled="loading || !!successMessage"
          class="signup-btn"
          elevation="2"
        >
          회원가입
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

const { signup, loading } = useAuth()
const router = useRouter()

import { WORKPLACES } from '@/utils/centerMapping.js'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const workplace = ref('')
const error = ref('')
const successMessage = ref('')
const signupForm = ref()
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countdown = ref(0)
let countdownInterval = null

const workplaceOptions = [...WORKPLACES]

// 폼 검증 규칙
const nameRules = [
  (v) => !!v || '이름을 입력해주세요'
]

const emailRules = [
  (v) => !!v || '이메일을 입력해주세요',
  (v) => /.+@concentrix\.com$/.test(v) || '@concentrix.com 이메일만 사용 가능합니다'
]

const passwordRules = [
  (v) => !!v || '비밀번호를 입력해주세요',
  (v) => (v && v.length >= 6) || '비밀번호는 6자 이상이어야 합니다'
]

const confirmPasswordRules = [
  (v) => !!v || '비밀번호 확인을 입력해주세요',
  (v) => v === password.value || '비밀번호가 일치하지 않습니다'
]

const workplaceRules = [
  (v) => !!v || '근무지를 선택해주세요'
]

// 회원가입 처리
const handleSignup = async () => {
  error.value = ''
  successMessage.value = ''
  
  // 폼 검증
  const { valid } = await signupForm.value.validate()
  if (!valid) return

  const result = await signup(email.value, password.value, name.value, workplace.value)
  
  if (result.success) {
    // 메일 발송 실패 경고가 있는 경우
    if (result.warning) {
      successMessage.value = result.warning
    } else {
      successMessage.value = '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.\n\n📧 인증 메일은 5~10분 정도 소요될 수 있습니다. 재전송 시 처음부터 다시 기다려야 하니 충분히 기다려주세요.'
    }
    // 폼 초기화
    name.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    workplace.value = ''
    signupForm.value.resetValidation()
    
    // 5초 카운트다운 후 로그인 페이지로 이동
    startCountdown()
  } else {
    error.value = result.error || '회원가입에 실패했습니다.'
  }
}

// 카운트다운 시작
const startCountdown = () => {
  countdown.value = 5
  
  countdownInterval = setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      router.push('/login')
    }
  }, 1000)
}

// 컴포넌트 언마운트 시 인터벌 정리
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

// 페이지 메타데이터
useHead({
  title: '회원가입 - CNX Library',
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

.countdown-text {
  font-size: rem(13);
  font-weight: 500;
  opacity: 0.9;
}

.success-message-text {
  white-space: pre-line;
  line-height: 1.6;
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

/* 회원가입 버튼 스타일 */
.signup-btn {
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
:deep(.v-text-field),
:deep(.v-select) {
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

