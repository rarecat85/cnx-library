<template>
  <v-app-bar
    color="primary"
    elevation="2"
    class="app-header"
    height="auto"
  >
    <div class="header-wrapper">
      <!-- 최상단 줄: 로고 + 마이페이지/알림/햄버거 -->
      <div class="header-top-row">
        <div class="logo-container">
          <ConcentrixLogo />
        </div>

        <div class="header-actions">
          <v-btn
            icon
            variant="text"
            class="action-btn"
          >
            <v-icon size="24">mdi-account-circle-outline</v-icon>
          </v-btn>

          <v-btn
            icon
            variant="text"
            class="action-btn notification-btn"
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
            class="action-btn"
            @click="$emit('toggle-drawer')"
          >
            <v-icon size="24">mdi-menu</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- 두 번째 줄: 검색 영역 -->
      <div class="header-search-row">
        <v-text-field
          v-model="searchQuery"
          placeholder="도서 검색"
          variant="outlined"
          density="comfortable"
          hide-details
          class="search-input"
          append-inner-icon="mdi-magnify"
          @keyup.enter="handleSearch"
          @click:append-inner="handleSearch"
        />
      </div>
    </div>
  </v-app-bar>
</template>

<script setup>
const searchQuery = ref('')

const handleSearch = () => {
  // 검색 기능은 향후 구현
  if (searchQuery.value.trim()) {
    console.log('검색:', searchQuery.value)
    // TODO: 검색 기능 연결
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.app-header {
  box-shadow: 0 rem(2) rem(8) rgba(0, 44, 91, 0.12);
  padding: 0;
}

.app-header :deep(.v-toolbar__content) {
  padding: 0;
  height: auto;
  min-height: auto;
  flex-direction: column;
  align-items: stretch;
}

.app-header :deep(.v-app-bar__content) {
  padding: 0;
  height: auto;
  min-height: auto;
}

.header-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 최상단 줄 */
.header-top-row {
  width: 100%;
  max-width: rem(768);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(8) rem(16);
  height: rem(56);
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-container :deep(.logo-svg) {
  height: rem(28);
  width: auto;
  color: #FFFFFF;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: rem(4);
}

.action-btn {
  color: #FFFFFF;
  min-width: rem(44);
  width: rem(44);
  height: rem(44);
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-btn :deep(.v-badge__badge) {
  font-size: rem(10);
  min-width: rem(18);
  height: rem(18);
  padding: 0 rem(4);
}

/* 검색 영역 줄 */
.header-search-row {
  width: 100%;
  max-width: rem(768);
  margin: 0 auto;
  padding: rem(8) rem(16) rem(12);
}

.search-input {
  width: 100%;
}

.search-input :deep(.v-field) {
  background-color: #FFFFFF;
  border-radius: rem(8);
}

.search-input :deep(.v-field__input) {
  padding: rem(10) rem(14);
  font-size: rem(15);
}

.search-input :deep(.v-field__outline) {
  border-width: rem(1);
}

.search-input :deep(.v-field__append-inner) {
  padding: 0 rem(8);
  cursor: pointer;
}

.search-input :deep(.v-field__append-inner .v-icon) {
  color: #002C5B;
  font-size: rem(24);
}
</style>

