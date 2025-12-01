<template>
  <v-app-bar
    color="primary"
    elevation="2"
    height="64"
    class="app-header"
  >
    <div class="header-content">
      <div class="logo-container">
        <ConcentrixLogo />
      </div>

      <div class="header-actions">
        <v-btn
          icon
          variant="text"
          class="action-btn"
        >
          <v-icon size="24">mdi-magnify</v-icon>
        </v-btn>

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
  </v-app-bar>
</template>

<script setup>
// Header 컴포넌트
</script>

<style scoped>
.app-header {
  box-shadow: 0 2px 8px rgba(0, 44, 91, 0.12);
}

.app-header :deep(.v-toolbar__content) {
  padding: 0;
  justify-content: center;
}

.header-content {
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 100%;
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
</style>

