<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="managers-admin-page">
        <!-- 페이지 헤더 -->
        <div class="page-header mb-6">
          <h1 class="page-title mb-0">
            매니저 관리
          </h1>
        </div>

        <!-- 검색 영역 -->
        <div class="search-section mb-6">
          <div class="d-flex align-center search-group">
            <v-text-field
              v-model="searchQuery"
              label="사용자 검색 (이름 또는 이메일)"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              class="search-input"
              @keyup.enter="handleSearch"
              @click:clear="clearSearch"
            />
          </div>
        </div>

        <!-- 검색 결과 영역 -->
        <div
          v-if="searchExecuted"
          class="search-results-section mb-8"
        >
          <div class="section-header mb-4">
            <h2 class="section-title">
              검색 결과
            </h2>
            <div class="text-body-2 text-medium-emphasis">
              {{ searchResults.length }}명
            </div>
          </div>

          <div
            v-if="searchLoading"
            class="text-center py-6"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <div
            v-else-if="searchResults.length > 0"
            class="users-grid"
          >
            <div
              v-for="user in searchResults"
              :key="user.uid"
              class="user-card"
            >
              <div class="user-info">
                <div class="user-name">
                  {{ user.name || '이름 없음' }}
                </div>
                <div class="user-email text-medium-emphasis">
                  {{ user.email }}
                </div>
                <div class="user-details text-medium-emphasis">
                  <span class="user-workplace">{{ user.workplace || '-' }}</span>
                  <span class="user-center">{{ user.center || '-' }}</span>
                  <v-chip
                    size="x-small"
                    :color="getRoleColor(user.role)"
                    class="user-role-chip"
                  >
                    {{ getRoleLabel(user.role) }}
                  </v-chip>
                </div>
              </div>
              <div class="user-actions">
                <v-btn
                  v-if="user.role === 'user'"
                  size="small"
                  class="action-btn"
                  variant="flat"
                  :loading="actionLoading === user.uid"
                  @click="handleAssignManager(user)"
                >
                  매니저 지정
                </v-btn>
                <v-btn
                  v-else-if="user.role === 'manager'"
                  size="small"
                  variant="outlined"
                  color="error"
                  :loading="actionLoading === user.uid"
                  @click="handleRevokeManager(user)"
                >
                  해제
                </v-btn>
                <v-chip
                  v-else
                  size="small"
                  color="warning"
                >
                  최고관리자
                </v-chip>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-6 text-medium-emphasis empty-state"
          >
            <v-icon
              size="48"
              color="grey-lighten-1"
              class="mb-4"
            >
              mdi-account-search-outline
            </v-icon>
            <p>'<strong>{{ searchQuery }}</strong>'에 대한 검색 결과가 없습니다.</p>
          </div>
        </div>

        <!-- 매니저 목록 영역 -->
        <div class="managers-list-section">
          <div class="section-header mb-4">
            <h2 class="section-title">
              매니저 목록
            </h2>
            <div class="text-body-2 text-medium-emphasis">
              총 {{ managers.length }}명
            </div>
          </div>

          <div
            v-if="managersLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <div
            v-else-if="managers.length > 0"
            class="managers-grid"
          >
            <div
              v-for="manager in managers"
              :key="manager.uid"
              class="manager-card"
            >
              <div class="manager-info">
                <div class="manager-name">
                  {{ manager.name || '이름 없음' }}
                </div>
                <div class="manager-email text-medium-emphasis">
                  {{ manager.email }}
                </div>
                <div class="manager-details text-medium-emphasis">
                  <span class="manager-workplace">{{ manager.workplace || '-' }}</span>
                  <span class="manager-center">{{ manager.center || '-' }}</span>
                </div>
              </div>
              <div class="manager-actions">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="error"
                  :loading="actionLoading === manager.uid"
                  @click="handleRevokeManager(manager)"
                >
                  해제
                </v-btn>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-8 text-medium-emphasis empty-state"
          >
            <v-icon
              size="48"
              color="grey-lighten-1"
              class="mb-4"
            >
              mdi-account-off-outline
            </v-icon>
            <p>등록된 매니저가 없습니다.</p>
          </div>
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
import { getCenterByWorkplace } from '@/utils/centerMapping.js'

definePageMeta({
  layout: false,
  middleware: 'admin'
})

const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

const drawer = useState('navigationDrawer', () => false)
const drawerWidth = ref(280)

// 매니저 목록 관련
const managers = ref([])
const managersLoading = ref(false)

// 검색 관련
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchExecuted = ref(false)

// 액션 로딩 상태
const actionLoading = ref(null)

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

// 초기화
onMounted(async () => {
  await loadManagers()
})

// 매니저 목록 로드
const loadManagers = async () => {
  if (!firestore) return
  
  try {
    managersLoading.value = true
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    
    const usersRef = collection(firestore, 'users')
    const managerQuery = query(usersRef, where('role', '==', 'manager'))
    const snapshot = await getDocs(managerQuery)
    
    managers.value = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('매니저 목록 로드 오류:', error)
    managers.value = []
  } finally {
    managersLoading.value = false
  }
}

// 사용자 검색
const handleSearch = async () => {
  if (!firestore || !searchQuery.value.trim()) return
  
  try {
    searchLoading.value = true
    searchExecuted.value = true
    const { collection, getDocs } = await import('firebase/firestore')
    
    const usersRef = collection(firestore, 'users')
    const snapshot = await getDocs(usersRef)
    
    const queryText = searchQuery.value.toLowerCase().trim()
    
    // 이름 또는 이메일로 검색 (클라이언트 사이드 필터링)
    searchResults.value = snapshot.docs
      .map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))
      .filter(user => {
        const name = (user.name || '').toLowerCase()
        const email = (user.email || '').toLowerCase()
        return name.includes(queryText) || email.includes(queryText)
      })
      .slice(0, 20) // 최대 20명까지만 표시
  } catch (error) {
    console.error('사용자 검색 오류:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// 검색 초기화
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchExecuted.value = false
}

// 역할 라벨
const getRoleLabel = (role) => {
  switch (role) {
    case 'admin':
      return '최고관리자'
    case 'manager':
      return '매니저'
    default:
      return '일반 사용자'
  }
}

// 역할 색상
const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'warning'
    case 'manager':
      return 'primary'
    default:
      return 'grey'
  }
}

// 매니저 지정
const handleAssignManager = async (user) => {
  if (!firestore) return
  
  // 센터 자동 배정
  const center = getCenterByWorkplace(user.workplace)
  
  const confirmed = await confirm(
    `"${user.name || user.email}"님을 매니저로 지정하시겠습니까?\n\n소속 센터: ${center}`
  )
  
  if (!confirmed) return
  
  try {
    actionLoading.value = user.uid
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    
    const userRef = doc(firestore, 'users', user.uid)
    await updateDoc(userRef, {
      role: 'manager',
      center: center,
      updatedAt: serverTimestamp()
    })
    
    // 검색 결과 업데이트
    const index = searchResults.value.findIndex(u => u.uid === user.uid)
    if (index !== -1) {
      searchResults.value[index].role = 'manager'
      searchResults.value[index].center = center
    }
    
    // 매니저 목록 새로고침
    await loadManagers()
    
    await alert(`"${user.name || user.email}"님이 매니저로 지정되었습니다.`, { type: 'success' })
  } catch (error) {
    console.error('매니저 지정 오류:', error)
    await alert('매니저 지정에 실패했습니다.', { type: 'error' })
  } finally {
    actionLoading.value = null
  }
}

// 매니저 해제
const handleRevokeManager = async (user) => {
  if (!firestore) return
  
  const confirmed = await confirm(
    `"${user.name || user.email}"님의 매니저 권한을 해제하시겠습니까?`
  )
  
  if (!confirmed) return
  
  try {
    actionLoading.value = user.uid
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    
    const userRef = doc(firestore, 'users', user.uid)
    await updateDoc(userRef, {
      role: 'user',
      updatedAt: serverTimestamp()
    })
    
    // 검색 결과 업데이트
    const index = searchResults.value.findIndex(u => u.uid === user.uid)
    if (index !== -1) {
      searchResults.value[index].role = 'user'
    }
    
    // 매니저 목록 새로고침
    await loadManagers()
    
    await alert(`"${user.name || user.email}"님의 매니저 권한이 해제되었습니다.`, { type: 'success' })
  } catch (error) {
    console.error('매니저 해제 오류:', error)
    await alert('매니저 해제에 실패했습니다.', { type: 'error' })
  } finally {
    actionLoading.value = null
  }
}

// 페이지 메타데이터
useHead({
  title: '매니저 관리 - CNX Library',
  meta: [
    { name: 'description', content: '매니저 지정 및 관리' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.managers-admin-page {
  width: 100%;
}

.page-header {
  padding-bottom: rem(16);
  border-bottom: rem(1) solid #e0e0e0;
}

.page-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: rem(24);
  }
  
  @media (max-width: 480px) {
    font-size: rem(20);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: rem(18);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
  
  @media (max-width: 480px) {
    font-size: rem(16);
  }
}

// 검색 섹션
.search-section {
  .search-group {
    width: 100%;
  }
  
  .search-input {
    flex: 1;
  }
}

// 검색 결과 섹션
.search-results-section {
  padding-bottom: rem(24);
  border-bottom: rem(1) solid #e0e0e0;
}

// 사용자/매니저 그리드
.users-grid,
.managers-grid {
  display: flex;
  flex-direction: column;
  gap: rem(12);
}

.user-card,
.manager-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(16);
  background-color: #FFFFFF;
  border: rem(1) solid #e0e0e0;
  border-radius: rem(8);
  gap: rem(16);
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.user-info,
.manager-info {
  flex: 1;
  min-width: 0;
}

.user-name,
.manager-name {
  font-size: rem(16);
  font-weight: 600;
  color: #002C5B;
  margin-bottom: rem(4);
}

.user-email,
.manager-email {
  font-size: rem(14);
  margin-bottom: rem(4);
  word-break: break-all;
}

.user-details,
.manager-details {
  font-size: rem(13);
  display: flex;
  align-items: center;
  gap: rem(8);
  flex-wrap: wrap;
}

.user-workplace,
.manager-workplace {
  &::after {
    content: '·';
    margin-left: rem(8);
  }
}

.user-role-chip {
  margin-left: rem(4);
}

.user-actions,
.manager-actions {
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

.action-btn {
  background-color: #002C5B;
  color: #FFFFFF;
  
  &:hover:not(:disabled) {
    background-color: #003d7a;
  }
  
  :deep(.v-btn__overlay) {
    display: none;
  }
}

// 빈 상태
.empty-state {
  p {
    margin: 0;
  }
}

// 사이드 네비게이션
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

@media (max-width: 768px) {
  .side-navigation :deep(.v-navigation-drawer) {
    width: rem(280);
  }
}

@media (min-width: 769px) {
  .side-navigation :deep(.v-navigation-drawer) {
    width: rem(360);
    left: auto;
    right: calc((100vw - #{rem(768)}) / 2);
    max-width: rem(768);
  }
  
  .side-navigation :deep(.v-overlay__scrim) {
    display: none;
  }
}
</style>
