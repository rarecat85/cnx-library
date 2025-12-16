<template>
  <div class="notification-bell-wrapper">
    <v-btn
      icon
      variant="text"
      class="notification-btn"
      @click="toggleMenu"
    >
      <v-badge
        v-if="unreadCount > 0"
        :content="unreadCount > 99 ? '99+' : unreadCount"
        color="error"
        offset-x="-2"
        offset-y="-2"
      >
        <v-icon size="24">
          mdi-bell
        </v-icon>
      </v-badge>
      <v-icon
        v-else
        size="24"
      >
        mdi-bell-outline
      </v-icon>
    </v-btn>

    <!-- 드롭다운 메뉴 -->
    <v-card
      v-show="menuOpen"
      class="notification-dropdown"
    >
      <div class="notification-header">
        <span class="notification-title">알림</span>
        <v-btn
          v-if="unreadCount > 0"
          variant="text"
          size="small"
          class="mark-all-btn"
          @click="handleMarkAllAsRead"
        >
          모두 읽음
        </v-btn>
      </div>

      <v-divider />

      <div
        v-if="recentNotifications.length === 0"
        class="notification-empty"
      >
        <v-icon
          size="48"
          color="grey-lighten-1"
        >
          mdi-bell-off-outline
        </v-icon>
        <p>알림이 없습니다</p>
      </div>

      <v-list
        v-else
        class="notification-list"
      >
        <v-list-item
          v-for="notification in recentNotifications"
          :key="notification.id"
          :class="{ 'notification-unread': !notification.isRead }"
          class="notification-item"
          @click="handleNotificationClick(notification)"
        >
          <template #prepend>
            <v-icon
              :icon="getNotificationIcon(notification.type)"
              :color="getNotificationColor(notification.type)"
              size="24"
            />
          </template>
          <v-list-item-title class="notification-item-title">
            {{ notification.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="notification-item-message">
            {{ notification.message }}
          </v-list-item-subtitle>
          <template #append>
            <span class="notification-time">
              {{ formatNotificationTime(notification.createdAt) }}
            </span>
          </template>
        </v-list-item>
      </v-list>

      <v-divider />

      <div class="notification-footer">
        <v-btn
          variant="text"
          block
          class="view-all-btn"
          @click="goToNotifications"
        >
          전체 알림 보기
        </v-btn>
      </div>
    </v-card>

    <!-- 배경 오버레이 -->
    <div
      v-if="menuOpen"
      class="notification-overlay"
      @click="menuOpen = false"
    />
  </div>
</template>

<script setup>
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
} = useNotifications()

const router = useRouter()
const menuOpen = ref(false)

// 메뉴 토글
const toggleMenu = () => {
  console.log('알림 버튼 클릭됨, 현재 상태:', menuOpen.value)
  menuOpen.value = !menuOpen.value
}

// 최근 알림 5개만 표시
const recentNotifications = computed(() => {
  return notifications.value.slice(0, 5)
})

// 알림 클릭 처리
const handleNotificationClick = async (notification) => {
  // 읽음 처리
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }
  
  // 알림 타입에 따라 페이지 이동
  menuOpen.value = false
  
  switch (notification.type) {
    case 'book_request':
      router.push('/admin/books/register')
      break
    case 'rent_request':
    case 'overdue_admin':
      router.push('/admin/books')
      break
    case 'book_registered':
      router.push('/books')
      break
    case 'return_reminder':
    case 'overdue':
      router.push('/mypage')
      break
    default:
      router.push('/notifications')
  }
}

// 모두 읽음 처리
const handleMarkAllAsRead = async () => {
  await markAllAsRead()
}

// 전체 알림 페이지로 이동
const goToNotifications = () => {
  menuOpen.value = false
  router.push('/notifications')
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.notification-bell-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.notification-btn {
  color: #FFFFFF;
  min-width: rem(44);
  width: rem(44);
  height: rem(44);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + #{rem(8)});
  right: 0;
  width: rem(360);
  max-height: rem(480);
  border-radius: rem(12);
  overflow: hidden;
  z-index: 2000;
  box-shadow: 0 rem(4) rem(20) rgba(0, 0, 0, 0.15);
}

.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1999;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(16);
}

.notification-title {
  font-size: rem(16);
  font-weight: 600;
  color: #002C5B;
}

.mark-all-btn {
  font-size: rem(12);
  color: #6b7280;
  text-transform: none;
  letter-spacing: 0;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: rem(48) rem(24);
  color: #9ca3af;
  
  p {
    margin-top: rem(12);
    font-size: rem(14);
  }
}

.notification-list {
  max-height: rem(320);
  overflow-y: auto;
  padding: 0;
}

.notification-item {
  padding: rem(12) rem(16);
  border-bottom: rem(1) solid #f3f4f6;
  cursor: pointer;
  
  // 아이콘과 콘텐츠 사이 간격 조정
  :deep(.v-list-item__spacer) {
    width: rem(24);
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &.notification-unread {
    background-color: #eff6ff;
    
    &:hover {
      background-color: #dbeafe;
    }
  }
}

.notification-item-title {
  font-size: rem(14);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.4;
  white-space: normal;
}

.notification-item-message {
  font-size: rem(13);
  color: #6b7280;
  line-height: 1.4;
  white-space: normal;
  margin-top: rem(2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: rem(11);
  color: #9ca3af;
  white-space: nowrap;
  margin-left: rem(8);
}

.notification-footer {
  padding: rem(8);
}

.view-all-btn {
  font-size: rem(14);
  color: #002C5B;
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 400px) {
  .notification-dropdown {
    width: rem(300);
    right: rem(-50);
  }
}
</style>
