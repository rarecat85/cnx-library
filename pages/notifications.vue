<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="notifications-page">
        <!-- 헤더 -->
        <div class="page-header mb-6">
          <h1 class="page-title mb-0">
            알림
          </h1>
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

        <!-- 필터 -->
        <div class="filter-section mb-4">
          <v-chip-group
            v-model="selectedFilter"
            mandatory
            selected-class="filter-chip-selected"
          >
            <v-chip
              value="all"
              variant="outlined"
              class="filter-chip"
            >
              전체
            </v-chip>
            <v-chip
              value="unread"
              variant="outlined"
              class="filter-chip"
            >
              읽지 않음
              <v-badge
                v-if="unreadCount > 0"
                :content="unreadCount"
                inline
                color="error"
                class="ml-1"
              />
            </v-chip>
          </v-chip-group>
        </div>

        <!-- 알림 목록 -->
        <div
          v-if="loading && filteredNotifications.length === 0"
          class="text-center py-8"
        >
          <v-progress-circular
            indeterminate
            color="primary"
          />
        </div>

        <div
          v-else-if="filteredNotifications.length === 0"
          class="empty-state"
        >
          <v-icon
            size="64"
            color="grey-lighten-1"
          >
            mdi-bell-off-outline
          </v-icon>
          <p class="empty-text">
            {{ selectedFilter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다' }}
          </p>
        </div>

        <div
          v-else
          class="notification-list"
        >
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-card"
            :class="{ 'notification-unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <v-icon
                :icon="getNotificationIcon(notification.type)"
                :color="getNotificationColor(notification.type)"
                size="28"
              />
            </div>
            <div class="notification-content">
              <div class="notification-title">
                {{ notification.title }}
              </div>
              <div class="notification-message">
                {{ notification.message }}
              </div>
              <div class="notification-time">
                {{ formatNotificationTime(notification.createdAt) }}
              </div>
            </div>
            <div class="notification-actions">
              <v-btn
                icon
                variant="text"
                size="small"
                @click.stop="handleDeleteNotification(notification.id)"
              >
                <v-icon size="20">
                  mdi-close
                </v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <!-- 더 불러오기 -->
        <div
          v-if="hasMore && filteredNotifications.length > 0"
          class="load-more-section"
        >
          <v-btn
            variant="outlined"
            color="primary"
            :loading="loadingMore"
            @click="loadMore"
          >
            더 보기
          </v-btn>
        </div>
      </div>
    </PageLayout>

    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      :width="drawerWidth"
      class="side-navigation"
    >
      <div class="drawer-content">
        <SideNavigation />
      </div>
    </v-navigation-drawer>
  </v-app>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: 'auth'
})

const router = useRouter()
const {
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotifications,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
} = useNotifications()

const drawer = useState('navigationDrawer', () => false)
const drawerWidth = ref(280)
const selectedFilter = ref('all')
const loadingMore = ref(false)
const hasMore = ref(true)
const lastDoc = ref(null)

// 반응형 drawer 너비 계산
onMounted(() => {
  const updateWidth = () => {
    drawerWidth.value = window.innerWidth >= 769 ? 360 : 280
  }
  
  updateWidth()
  window.addEventListener('resize', updateWidth)
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWidth)
  })
})

// 필터링된 알림 목록
const filteredNotifications = computed(() => {
  if (selectedFilter.value === 'unread') {
    return notifications.value.filter(n => !n.isRead)
  }
  return notifications.value
})

// 알림 클릭 처리
const handleNotificationClick = async (notification) => {
  // 읽음 처리
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }
  
  // 알림 타입에 따라 페이지 이동
  switch (notification.type) {
    case 'book_request':
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
  }
}

// 모두 읽음 처리
const handleMarkAllAsRead = async () => {
  await markAllAsRead()
}

// 알림 삭제
const handleDeleteNotification = async (notificationId) => {
  await deleteNotification(notificationId)
}

// 더 불러오기
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  try {
    loadingMore.value = true
    const result = await getNotifications(20, lastDoc.value)
    
    if (result.items.length < 20) {
      hasMore.value = false
    }
    
    lastDoc.value = result.lastDoc
  } catch (error) {
    console.error('알림 더 불러오기 오류:', error)
  } finally {
    loadingMore.value = false
  }
}

// 페이지 메타데이터
useHead({
  title: '알림 - CNX Library',
  meta: [
    { name: 'description', content: '알림 목록' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.notifications-page {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: rem(16);
  border-bottom: rem(1) solid #e0e0e0;
}

.page-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.mark-all-btn {
  font-size: rem(14);
  color: #6b7280;
  text-transform: none;
  letter-spacing: 0;
}

.filter-section {
  padding-top: rem(8);
}

.filter-chip {
  border-color: #e0e0e0;
  color: #6b7280;
  
  &.filter-chip-selected {
    background-color: #002C5B;
    border-color: #002C5B;
    color: #FFFFFF;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: rem(64) rem(24);
}

.empty-text {
  margin-top: rem(16);
  font-size: rem(16);
  color: #9ca3af;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: rem(12);
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: rem(12);
  padding: rem(16);
  background-color: #FFFFFF;
  border: rem(1) solid #e0e0e0;
  border-radius: rem(12);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #002C5B;
    box-shadow: 0 rem(2) rem(8) rgba(0, 44, 91, 0.1);
  }
  
  &.notification-unread {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    
    &:hover {
      background-color: #dbeafe;
      border-color: #002C5B;
    }
  }
}

.notification-icon {
  flex-shrink: 0;
  width: rem(44);
  height: rem(44);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: rem(10);
  
  .notification-unread & {
    background-color: #FFFFFF;
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: rem(15);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.4;
  margin-bottom: rem(4);
}

.notification-message {
  font-size: rem(14);
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: rem(8);
}

.notification-time {
  font-size: rem(12);
  color: #9ca3af;
}

.notification-actions {
  flex-shrink: 0;
}

.load-more-section {
  display: flex;
  justify-content: center;
  margin-top: rem(24);
}

.side-navigation {
  z-index: 1000;
}

.side-navigation :deep(.v-navigation-drawer__content) {
  background-color: #002C5B;
}

.side-navigation :deep(.v-navigation-drawer) {
  border: none;
}

.side-navigation :deep(.v-navigation-drawer__border) {
  display: none;
}

.drawer-content {
  padding: rem(16);
  color: #FFFFFF;
}

/* 768px 이하: 전체 화면 기준 우측에 붙어서 */
@media (max-width: 768px) {
  .side-navigation :deep(.v-navigation-drawer) {
    width: rem(280);
  }
}

/* 769px 이상: 768px 이너 안쪽으로 들어오도록 */
@media (min-width: 769px) {
  .side-navigation :deep(.v-navigation-drawer) {
    width: rem(360);
    left: auto;
    right: calc((100vw - #{rem(768)}) / 2);
    max-width: rem(768);
  }
  
  /* 오버레이가 768px 컨테이너 영역만 덮도록 */
  .side-navigation :deep(.v-overlay__scrim) {
    display: none;
  }
}
</style>

