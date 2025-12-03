<template>
  <div class="page-layout">
    <div class="page-background">
      <!-- 상단 헤더 영역 (책 아이콘 + 선택적 텍스트 + 액션 버튼) -->
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-header-top">
            <div class="page-header-left">
              <!-- 책 아이콘 (인증 페이지 - 기능 없음) -->
              <div
                v-if="headerType === 'icon'"
                class="page-icon"
              >
                <v-icon size="28">mdi-book-open-variant</v-icon>
              </div>
              
              <!-- 책 아이콘 버튼 (홈으로 이동) -->
              <v-btn
                v-else-if="headerType === 'home'"
                icon
                variant="text"
                class="header-icon-btn"
                @click="goHome"
              >
                <v-icon size="28">mdi-book-open-variant</v-icon>
              </v-btn>
              
              <!-- 뒤로가기 + 책 아이콘 (다른 페이지) -->
              <div
                v-else-if="headerType === 'back-home'"
                class="header-icons"
              >
                <v-btn
                  icon
                  variant="text"
                  class="header-icon-btn"
                  @click="goBack"
                >
                  <v-icon size="24">mdi-arrow-left</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  class="header-icon-btn"
                  @click="goHome"
                >
                  <v-icon size="28">mdi-book-open-variant</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- 우측 액션 버튼들 (로그인 상태일 때만) -->
            <div
              v-if="showHeaderActions"
              class="page-header-actions"
            >
              <v-btn
                icon
                variant="text"
                class="header-action-btn"
              >
                <v-icon size="24">mdi-account-circle-outline</v-icon>
              </v-btn>

              <v-btn
                icon
                variant="text"
                class="header-action-btn notification-btn"
              >
                <v-badge
                  :content="0"
                  :model-value="false"
                  color="error"
                  overlap
                >
                  <v-icon size="24">mdi-bell-outline</v-icon>
                </v-badge>
              </v-btn>

              <v-btn
                icon
                variant="text"
                class="header-action-btn"
                @click="$emit('toggle-drawer')"
              >
                <v-icon size="24">mdi-menu</v-icon>
              </v-btn>
            </div>
          </div>
          
          <div
            v-if="displayHeaderText"
            class="header-text-content"
          >
            <div
              class="header-text-line"
              :class="{ 'english-text': isEnglishText }"
              v-html="computedHeaderText"
            />
          </div>
        </div>
      </div>
      
      <v-container
        fluid
        class="page-container"
      >
        <v-row
          justify="center"
          class="page-row"
        >
          <v-col
            cols="12"
            class="page-col"
          >
            <v-card
              class="page-card"
              rounded="t-lg"
            >
              <slot />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const { user, isAuthenticated } = useAuth()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

defineProps({
  headerType: {
    type: String,
    default: 'icon', // 'icon' | 'home' | 'back-home'
    validator: (value) => ['icon', 'home', 'back-home'].includes(value)
  },
  showHeaderActions: {
    type: Boolean,
    default: false // 로그인 상태일 때 우측 액션 버튼 표시
  }
})

defineEmits(['toggle-drawer'])

// 사용자 데이터
const userData = ref(null)

// 로그인 상태에 따른 헤더 텍스트 계산
const computedHeaderText = computed(() => {
  if (isAuthenticated.value && userData.value) {
    // 로그인 후: 한글 텍스트
    const center = userData.value.center || ''
    const name = userData.value.name || ''
    return `안녕하세요,<br>${center} ${name} 님`
  } else {
    // 로그인 전: 영문 텍스트
    return 'The world belongs to<br>those who read.'
  }
})

// 영문 텍스트 여부 (로그인 전에만 true)
const isEnglishText = computed(() => {
  return !isAuthenticated.value
})

// 헤더 텍스트 표시 여부 (항상 표시)
const displayHeaderText = computed(() => {
  return true
})

// Firestore에서 사용자 정보 가져오기
onMounted(async () => {
  if (!process.client || !isAuthenticated.value || !user.value || !firestore) {
    return
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      userData.value = userDoc.data()
    }
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error)
  }
})

// 사용자 상태 변경 감지
watch([isAuthenticated, user], async ([authenticated, currentUser]) => {
  if (authenticated && currentUser && firestore) {
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const userRef = doc(firestore, 'users', currentUser.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        userData.value = userDoc.data()
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
    }
  } else {
    userData.value = null
  }
})

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.page-layout {
  min-height: 100vh;
  width: 100%;
  position: relative;
}

.page-background {
  min-height: 100vh;
  background: linear-gradient(to bottom, #002C5B 0%, #002C5B 50vh, #F2F2F2 50vh, #F2F2F2 100%);
  position: relative;
}

.page-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1;
  padding: rem(8) rem(16);
}

.page-header-inner {
  max-width: rem(768);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: rem(20);
}

.page-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.page-header-left {
  display: flex;
  align-items: center;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: rem(4);
}

.page-icon {
  display: flex;
  align-items: center;
  color: #FFFFFF;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: rem(4);
}

.header-icon-btn {
  color: #FFFFFF;
  min-width: rem(44);
  width: rem(44);
  height: rem(44);
}

.header-icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header-action-btn {
  color: #FFFFFF;
  min-width: rem(44);
  width: rem(44);
  height: rem(44);
}

.header-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-btn :deep(.v-badge__badge) {
  font-size: rem(10);
  min-width: rem(18);
  height: rem(18);
  padding: 0 rem(4);
}

.header-text-content {
  text-align: left;
  text-wrap: balance;
}

.header-text-line {
  font-size: rem(32);
  font-weight: 300;
  color: #FFFFFF;
  line-height: 1.1;
  letter-spacing: rem(0.2);
}

.header-text-line.english-text {
  font-size: rem(40);
}

.page-container {
  padding: 0;
  min-height: 100vh;
  position: relative;
}

.page-row {
  min-height: 100vh;
  align-items: flex-start;
  padding-top: calc(#{rem(56)} + 7rem);
  margin: 0;
}

.page-col {
  display: flex;
  justify-content: center;
  padding: 0 rem(16);
  min-height: calc(100vh - #{rem(56)} - 7rem);
  align-self: flex-end;
}

.page-card {
  padding: rem(48) rem(40);
  max-width: rem(768);
  width: 100%;
  margin: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 0 rem(4) rem(20) rgba(0, 0, 0, 0.15);
  background-color: #FFFFFF;
  min-height: calc(100vh - #{rem(56)} - 7rem);
  display: flex;
  flex-direction: column;
}


.page-card :deep(.v-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .page-row {
    padding-top: calc(#{rem(56)} + 6rem);
  }

  .page-col {
    min-height: calc(100vh - #{rem(56)} - 6rem);
  }

  .page-card {
    padding: rem(32) rem(24);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    min-height: calc(100vh - #{rem(56)} - 6rem);
  }

  .header-text-line {
    font-size: rem(24);
  }

  .header-text-line.english-text {
    font-size: rem(28);
  }
}

@media (max-width: 480px) {
  .page-row {
    padding-top: calc(#{rem(56)} + 5rem);
  }

  .page-col {
    min-height: calc(100vh - #{rem(56)} - 5rem);
  }

  .page-card {
    padding: rem(24) rem(16);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    min-height: calc(100vh - #{rem(56)} - 5rem);
  }

  .header-text-line {
    font-size: rem(20);
  }

  .header-text-line.english-text {
    font-size: rem(24);
  }
}
</style>

