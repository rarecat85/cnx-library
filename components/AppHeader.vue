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

<style scoped>
.app-header {
  box-shadow: 0 2px 8px rgba(0, 44, 91, 0.12);
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
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  height: 56px;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-container :deep(.logo-svg) {
  height: 28px;
  width: auto;
  color: #FFFFFF;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  color: #FFFFFF;
  min-width: 44px;
  width: 44px;
  height: 44px;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.notification-btn :deep(.v-badge__badge) {
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
}

/* 검색 영역 줄 */
.header-search-row {
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 8px 16px 12px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.v-field) {
  background-color: #FFFFFF;
  border-radius: 8px;
}

.search-input :deep(.v-field__input) {
  padding: 10px 14px;
  font-size: 15px;
}

.search-input :deep(.v-field__outline) {
  border-width: 1px;
}

.search-input :deep(.v-field__append-inner) {
  padding: 0 8px;
  cursor: pointer;
}

.search-input :deep(.v-field__append-inner .v-icon) {
  color: #002C5B;
  font-size: 24px;
}
</style>

