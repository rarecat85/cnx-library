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
              @click:close="error = ''"
            >
              {{ error }}
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

          <v-btn
            variant="elevated"
            block
            size="large"
            class="signup-btn mt-2"
            elevation="2"
            @click="router.push('/signup')"
          >
            회원가입
          </v-btn>
          
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

const { login, loading } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loginForm = ref()
const showPassword = ref(false)

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
  
  // 폼 검증
  const { valid } = await loginForm.value.validate()
  if (!valid) return

  const result = await login(email.value, password.value)
  
  if (result.success) {
    // 로그인 성공 시 메인 페이지로 이동
    await router.push('/')
  } else {
    error.value = result.error || '로그인에 실패했습니다.'
  }
}

// 페이지 메타데이터
useHead({
  title: '로그인 - CNX Library'
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #F2F2F2 0%, #E8E8E8 100%);
}

.login-card {
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

.error-alert {
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


/* 로그인 버튼 스타일 */
.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

/* 회원가입 버튼 스타일 */
.signup-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background-color: #6b7280;
  color: #FFFFFF;
}

.signup-btn:hover {
  background-color: #4b5563;
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

