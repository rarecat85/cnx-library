<template>
  <v-app>
    <PageLayout>
      <div class="text-center mb-8">
        <h1 class="login-title mb-2">
          CNX Library
        </h1>
        <p class="login-subtitle">
          정보수정
        </p>
      </div>

      <!-- 로딩 상태 -->
      <div
        v-if="pageLoading"
        class="text-center py-8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>

      <v-form
        v-else
        ref="editForm"
        validate-on="submit"
        @submit.prevent="handleSave"
      >
        <!-- 이름 -->
        <v-text-field
          v-model="name"
          label="이름"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          :rules="nameRules"
          :disabled="saving"
          class="mb-2"
          density="comfortable"
        />

        <!-- 이메일 (수정 불가) -->
        <v-text-field
          v-model="email"
          label="이메일"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          disabled
          class="mb-2"
          density="comfortable"
        />

        <!-- 비밀번호 변경 버튼 -->
        <div class="password-change-section mb-2">
          <v-btn
            variant="flat"
            block
            size="large"
            :loading="passwordResetLoading"
            :disabled="passwordResetLoading || saving"
            class="password-change-btn"
            @click="handlePasswordReset"
          >
            비밀번호 변경
          </v-btn>
          <p class="password-hint">
            비밀번호 변경 링크가 이메일로 발송됩니다.
          </p>
        </div>

        <!-- 근무지 -->
        <v-select
          v-model="workplace"
          label="근무지"
          :items="workplaceOptions"
          prepend-inner-icon="mdi-office-building-outline"
          variant="outlined"
          :rules="workplaceRules"
          :disabled="saving"
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
          :loading="saving"
          :disabled="saving"
          class="save-btn"
          elevation="2"
        >
          저장
        </v-btn>
      </v-form>

      <div class="auth-links text-center mt-4">
        <NuxtLink
          to="/mypage"
          class="auth-link"
        >
          마이페이지로 돌아가기
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
import { WORKPLACES, CENTERS } from '@/utils/centerMapping.js'
import { sanitizeName } from '@/utils/sanitize.js'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

const router = useRouter()
const { user, sendPasswordResetEmail } = useAuth()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

const name = ref('')
const email = ref('')
const workplace = ref('')
const error = ref('')
const successMessage = ref('')
const editForm = ref()
const pageLoading = ref(true)
const saving = ref(false)
const passwordResetLoading = ref(false)

const workplaceOptions = [...WORKPLACES]

// 폼 검증 규칙
const nameRules = [
  (v) => !!v || '이름을 입력해주세요'
]

const workplaceRules = [
  (v) => !!v || '근무지를 선택해주세요'
]

// 사용자 정보 로드
onMounted(async () => {
  if (!user.value || !firestore) {
    pageLoading.value = false
    return
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      name.value = userData.name || ''
      email.value = userData.email || user.value.email || ''
      
      // 기존 센터 형식('강남센터', '용산센터')으로 저장된 경우 호환 처리
      let savedWorkplace = userData.workplace || ''
      if (CENTERS.includes(savedWorkplace)) {
        // 센터 형식이면 해당하는 기본 근무지로 매핑
        if (savedWorkplace === '강남센터') {
          savedWorkplace = '강남'
        } else if (savedWorkplace === '용산센터') {
          savedWorkplace = '용산'
        }
      }
      workplace.value = savedWorkplace
    }
  } catch (err) {
    console.error('사용자 정보 로드 오류:', err)
    error.value = '사용자 정보를 불러오는데 실패했습니다.'
  } finally {
    pageLoading.value = false
  }
})

// 비밀번호 재설정 이메일 발송
const handlePasswordReset = async () => {
  if (!email.value) return

  error.value = ''
  successMessage.value = ''

  try {
    passwordResetLoading.value = true

    const result = await sendPasswordResetEmail(email.value)

    if (result.success) {
      successMessage.value = '비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.'
    } else {
      error.value = result.error || '비밀번호 재설정 이메일 발송에 실패했습니다.'
    }
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err)
    error.value = '비밀번호 재설정 이메일 발송에 실패했습니다.'
  } finally {
    passwordResetLoading.value = false
  }
}

// 저장 처리
const handleSave = async () => {
  if (!user.value || !firestore) return

  error.value = ''
  successMessage.value = ''

  // 폼 검증
  const { valid } = await editForm.value.validate()
  if (!valid) return

  try {
    saving.value = true

    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)

    // XSS 방지를 위한 입력값 sanitize
    const sanitizedName = sanitizeName(name.value)

    await updateDoc(userRef, {
      name: sanitizedName,
      workplace: workplace.value,
      updatedAt: serverTimestamp()
    })

    successMessage.value = '정보가 수정되었습니다.'
    
    // 잠시 후 마이페이지로 이동
    setTimeout(() => {
      router.push('/mypage')
    }, 1500)
  } catch (err) {
    console.error('정보 수정 오류:', err)
    error.value = '정보 수정에 실패했습니다.'
  } finally {
    saving.value = false
  }
}

// 페이지 메타데이터
useHead({
  title: '정보수정 - CNX Library',
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

/* 비밀번호 변경 섹션 */
.password-change-section {
  margin-top: rem(4);
}

.password-change-btn {
  height: rem(48);
  font-size: rem(14);
  font-weight: 500;
  border-radius: rem(8);
  background-color: #e5e7eb;
  color: #374151;
  
  &:hover:not(:disabled) {
    background-color: #d1d5db;
  }
}

.password-hint {
  font-size: rem(12);
  color: #6b7280;
  margin: rem(8) 0 0 0;
  text-align: center;
}

/* 저장 버튼 스타일 */
.save-btn {
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
