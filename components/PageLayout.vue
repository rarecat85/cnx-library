<template>
  <div class="page-layout">
    <div class="page-background">
      <!-- 상단 헤더 영역 (책 아이콘 + 선택적 텍스트) -->
      <div class="page-header">
        <div class="page-header-inner">
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
          
          <div
            v-if="showHeaderText"
            class="header-text-content"
          >
            <div
              class="header-text-line"
              v-html="headerText"
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
            <v-card class="page-card">
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

defineProps({
  showHeaderText: {
    type: Boolean,
    default: false
  },
  headerText: {
    type: String,
    default: 'The world belongs to<br>those who read.'
  },
  headerType: {
    type: String,
    default: 'icon', // 'icon' | 'home' | 'back-home'
    validator: (value) => ['icon', 'home', 'back-home'].includes(value)
  }
})

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  width: 100%;
  position: relative;
}

.page-background {
  min-height: 100vh;
  background: linear-gradient(to bottom, #002C5B 0%, #002C5B 50%, #F2F2F2 50%, #F2F2F2 100%);
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
  padding: 8px 16px;
}

.page-header-inner {
  max-width: 768px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-left {
  display: flex;
  align-items: center;
}

.page-icon {
  display: flex;
  align-items: center;
  color: #FFFFFF;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-icon-btn {
  color: #FFFFFF;
  min-width: 44px;
  width: 44px;
  height: 44px;
}

.header-icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header-text-content {
  text-align: left;
  text-wrap: balance;
}

.header-text-line {
  font-size: 40px;
  font-weight: 300;
  color: #FFFFFF;
  line-height: 1.1;
  letter-spacing: 0.2px;
  font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
}

.page-container {
  padding: 0;
  height: 100vh;
  position: relative;
}

.page-row {
  height: 100vh;
  align-items: flex-start;
  padding-top: calc(56px + 15vh);
  margin: 0;
}

.page-col {
  display: flex;
  justify-content: center;
  padding: 0 16px;
  height: calc(100vh - 56px - 15vh);
  align-self: flex-end;
}

.page-card {
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

.page-card :deep(.v-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .page-row {
    padding-top: calc(56px + 10vh);
  }

  .page-col {
    height: calc(100vh - 56px - 10vh);
  }

  .page-card {
    padding: 32px 24px;
    border-radius: 12px 12px 0 0;
  }

  .header-text-line {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .page-row {
    padding-top: calc(56px + 10vh);
  }

  .page-col {
    height: calc(100vh - 56px - 10vh);
  }

  .page-card {
    padding: 24px 16px;
    border-radius: 8px 8px 0 0;
  }

  .header-text-line {
    font-size: 24px;
  }
}
</style>

