<template>
  <!-- 확인 다이얼로그 -->
  <v-dialog
    v-model="isConfirmOpen"
    max-width="400"
    persistent
    class="global-dialog"
  >
    <v-card class="dialog-card">
      <v-card-title class="dialog-title">
        <v-icon
          :color="iconColor"
          class="mr-2"
        >
          {{ iconName }}
        </v-icon>
        {{ dialogConfig.title }}
      </v-card-title>
      <v-card-text class="dialog-message">
        <span v-html="formattedMessage" />
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn
          variant="text"
          class="cancel-btn"
          @click="handleCancel"
        >
          {{ dialogConfig.cancelText }}
        </v-btn>
        <v-btn
          variant="flat"
          class="confirm-btn"
          @click="handleConfirm"
        >
          {{ dialogConfig.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 알림 다이얼로그 -->
  <v-dialog
    v-model="isAlertOpen"
    max-width="400"
    persistent
    class="global-dialog"
  >
    <v-card class="dialog-card">
      <v-card-title class="dialog-title">
        <v-icon
          :color="alertIconColor"
          class="mr-2"
        >
          {{ alertIconName }}
        </v-icon>
        {{ dialogConfig.title }}
      </v-card-title>
      <v-card-text class="dialog-message">
        <span v-html="formattedMessage" />
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn
          variant="flat"
          class="confirm-btn"
          @click="handleAlertClose"
        >
          {{ dialogConfig.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const {
  isConfirmOpen,
  isAlertOpen,
  dialogConfig,
  handleConfirm,
  handleCancel,
  handleAlertClose
} = useDialog()

// 메시지 포맷팅 (줄바꿈 처리)
const formattedMessage = computed(() => {
  if (!dialogConfig.value.message) return ''
  return dialogConfig.value.message.replace(/\n/g, '<br>')
})

// 확인 다이얼로그 아이콘
const iconName = computed(() => {
  const type = dialogConfig.value.type
  if (type === 'warning' || type === 'confirm') return 'mdi-help-circle-outline'
  if (type === 'error') return 'mdi-alert-circle-outline'
  if (type === 'success') return 'mdi-check-circle-outline'
  return 'mdi-information-outline'
})

const iconColor = computed(() => {
  const type = dialogConfig.value.type
  if (type === 'warning' || type === 'confirm') return 'warning'
  if (type === 'error') return 'error'
  if (type === 'success') return 'success'
  return 'primary'
})

// 알림 다이얼로그 아이콘
const alertIconName = computed(() => {
  const type = dialogConfig.value.type
  if (type === 'error') return 'mdi-alert-circle-outline'
  if (type === 'success') return 'mdi-check-circle-outline'
  if (type === 'warning') return 'mdi-alert-outline'
  return 'mdi-information-outline'
})

const alertIconColor = computed(() => {
  const type = dialogConfig.value.type
  if (type === 'error') return 'error'
  if (type === 'success') return 'success'
  if (type === 'warning') return 'warning'
  return 'primary'
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.global-dialog {
  z-index: 9999;
}

.dialog-card {
  border-radius: rem(12);
  overflow: hidden;
}

.dialog-title {
  font-size: rem(18);
  font-weight: 600;
  color: #002C5B;
  padding: rem(20) rem(24) rem(12);
  display: flex;
  align-items: center;
}

.dialog-message {
  font-size: rem(15);
  color: #4b5563;
  line-height: 1.6;
  padding: rem(8) rem(24) rem(16);
  white-space: pre-wrap;
}

.dialog-actions {
  padding: rem(12) rem(16) rem(16);
  gap: rem(8);
}

.cancel-btn {
  color: #6b7280;
  font-weight: 500;
  
  &:hover {
    background-color: #f3f4f6;
  }
}

.confirm-btn {
  background-color: #002C5B;
  color: #FFFFFF;
  font-weight: 500;
  min-width: rem(80);
  
  &:hover {
    background-color: #003d7a;
  }
}
</style>


