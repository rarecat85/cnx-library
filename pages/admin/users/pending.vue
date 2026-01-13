<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="pending-users-page">
        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              임시 회원 관리
            </h1>
            <v-select
              v-model="centerFilter"
              :items="centerOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              class="center-select"
            />
          </div>
        </div>

        <!-- 검색 영역 + 등록 버튼 -->
        <div class="search-section mb-6">
          <div class="search-row">
            <v-text-field
              v-model="searchQuery"
              label="회원 검색 (이름 또는 이메일)"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              class="search-input"
              @keyup.enter="filterPendingUsers"
              @click:clear="clearSearch"
            />
            <v-btn
              color="primary"
              size="small"
              variant="flat"
              class="register-btn"
              @click="openRegisterDialog"
            >
              임시 회원 등록
            </v-btn>
          </div>
        </div>

        <!-- 임시 회원 목록 영역 -->
        <div class="pending-users-section">
          <div class="section-header mb-4">
            <h2 class="section-title">
              임시 회원 목록
            </h2>
            <div class="text-body-2 text-medium-emphasis">
              총 {{ filteredPendingUsers.length }}명
            </div>
          </div>

          <div
            v-if="loading"
            class="text-center py-6"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <v-row
            v-else-if="filteredPendingUsers.length > 0"
            class="users-grid"
          >
            <v-col
              v-for="pendingUser in paginatedPendingUsers"
              :key="pendingUser.id"
              cols="12"
              sm="6"
            >
              <div class="user-card">
                <!-- 역할 칩 -->
                <div class="user-card-header">
                  <v-chip
                    color="warning"
                    size="x-small"
                    variant="flat"
                    class="role-chip"
                  >
                    임시회원
                  </v-chip>
                </div>

                <!-- 사용자 정보 -->
                <div class="user-card-content">
                  <div class="user-name">
                    {{ pendingUser.name || '이름 없음' }}
                  </div>
                  <div class="user-info text-body-2">
                    <strong>이메일:</strong> {{ pendingUser.email }}
                  </div>
                  <div class="user-info text-body-2">
                    <strong>근무지:</strong> {{ pendingUser.workplace || '-' }}
                  </div>
                  <div class="user-info text-body-2">
                    <strong>현재 대여:</strong> {{ getRentedCount(pendingUser.id) }}권
                  </div>
                </div>

                <!-- 액션 버튼 -->
                <div class="user-card-action">
                  <v-btn
                    color="primary"
                    size="small"
                    class="action-btn mb-2"
                    @click="openEditDialog(pendingUser)"
                  >
                    수정
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="outlined"
                    color="error"
                    class="action-btn"
                    :loading="actionLoading === pendingUser.id"
                    :disabled="getRentedCount(pendingUser.id) > 0"
                    @click="handleDelete(pendingUser)"
                  >
                    삭제
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>

          <div
            v-else
            class="text-center py-6 text-medium-emphasis empty-state"
          >
            <v-icon
              size="48"
              color="grey-lighten-1"
              class="mb-4"
            >
              mdi-account-off-outline
            </v-icon>
            <p>등록된 임시 회원이 없습니다.</p>
          </div>

          <!-- 페이지네이션 -->
          <div
            v-if="totalPages > 1"
            class="pagination-wrapper mt-6"
          >
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="5"
              density="comfortable"
              rounded="circle"
            />
          </div>
        </div>
      </div>
    </PageLayout>

    <!-- 등록/수정 다이얼로그 -->
    <v-dialog
      v-model="registerDialog"
      max-width="450"
    >
      <v-card class="register-dialog-card">
        <div class="register-dialog-title text-h6">
          {{ isEditing ? '임시 회원 정보 수정' : '임시 회원 등록' }}
        </div>
        <div class="register-dialog-content">
          <v-text-field
            v-model="formData.email"
            label="이메일"
            variant="outlined"
            density="comfortable"
            placeholder="example@email.com"
            :error-messages="formErrors.email"
            :disabled="isEditing"
            class="mb-3"
          />
          <v-text-field
            v-model="formData.name"
            label="이름"
            variant="outlined"
            density="comfortable"
            :error-messages="formErrors.name"
            class="mb-3"
          />
          <v-select
            v-model="formData.workplace"
            :items="workplaces"
            label="근무지"
            variant="outlined"
            density="comfortable"
            :error-messages="formErrors.workplace"
            class="mb-3"
          />
          <div class="text-body-2 text-medium-emphasis">
            <strong>자동 배정 센터:</strong> {{ computedCenter }}
          </div>
        </div>
        <div class="register-dialog-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeRegisterDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="registerLoading"
            :disabled="!isFormValid"
            @click="handleSubmit"
          >
            {{ isEditing ? '수정' : '등록' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

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
import { WORKPLACES, CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'

definePageMeta({
  layout: false,
  middleware: 'admin'
})

const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore
const { user } = useAuth()

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

// 임시 회원 목록
const pendingUsers = ref([])
const loading = ref(false)

// 각 임시 회원의 대여 권수
const rentedCounts = ref({})

// 검색 및 필터
const searchQuery = ref('')
const centerFilter = ref(CENTERS[0])
const centerOptions = CENTERS
const workplaces = WORKPLACES

// 페이지네이션
const currentPage = ref(1)
const itemsPerPage = 10

// 다이얼로그 상태
const registerDialog = ref(false)
const isEditing = ref(false)
const editingUserId = ref(null)
const registerLoading = ref(false)
const actionLoading = ref(null)

// 폼 데이터
const formData = ref({
  email: '',
  name: '',
  workplace: ''
})

const formErrors = ref({
  email: '',
  name: '',
  workplace: ''
})

// 필터링된 임시 회원 목록
const filteredPendingUsers = computed(() => {
  let result = [...pendingUsers.value]
  
  // 검색 필터
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(user => {
      const name = (user.name || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }
  
  // 센터 필터
  if (centerFilter.value) {
    result = result.filter(user => user.center === centerFilter.value)
  }
  
  return result
})

// 페이지네이션된 목록
const totalPages = computed(() => Math.ceil(filteredPendingUsers.value.length / itemsPerPage))
const paginatedPendingUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPendingUsers.value.slice(start, end)
})

// 자동 계산 센터
const computedCenter = computed(() => {
  if (!formData.value.workplace) return '-'
  return getCenterByWorkplace(formData.value.workplace)
})

// 폼 유효성 검사
const isFormValid = computed(() => {
  return formData.value.email && 
         formData.value.name && 
         formData.value.workplace &&
         !formErrors.value.email &&
         !formErrors.value.name &&
         !formErrors.value.workplace
})

// 대여 권수 가져오기
const getRentedCount = (pendingUserId) => {
  return rentedCounts.value[pendingUserId] || 0
}

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

// 사용자 근무지 정보 가져오기
const getUserWorkplace = async () => {
  if (!user.value || !firestore) {
    return ''
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      return userDoc.data().workplace || ''
    }
  } catch (error) {
    console.error('사용자 근무지 정보 조회 오류:', error)
  }
  return ''
}

// 초기화
onMounted(async () => {
  // 관리자의 센터를 기본값으로 설정
  const workplace = await getUserWorkplace()
  centerFilter.value = workplace ? getCenterByWorkplace(workplace) : centerOptions[0]
  
  await loadPendingUsers()
})

// 임시 회원 목록 로드
const loadPendingUsers = async () => {
  if (!firestore) return
  
  try {
    loading.value = true
    const { collection, getDocs, query, where } = await import('firebase/firestore')
    
    const pendingRef = collection(firestore, 'pendingUsers')
    const snapshot = await getDocs(pendingRef)
    
    pendingUsers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // 각 임시 회원의 대여 권수 조회
    await loadRentedCounts()
  } catch (error) {
    console.error('임시 회원 목록 로드 오류:', error)
    pendingUsers.value = []
  } finally {
    loading.value = false
  }
}

// 대여 권수 로드
const loadRentedCounts = async () => {
  if (!firestore || pendingUsers.value.length === 0) return
  
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const booksRef = collection(firestore, 'books')
    
    const counts = {}
    
    for (const user of pendingUsers.value) {
      const rentedQuery = query(
        booksRef,
        where('rentedBy', '==', user.id),
        where('rentedByType', '==', 'pending')
      )
      const snapshot = await getDocs(rentedQuery)
      
      let count = 0
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.status === 'rented' || data.status === 'overdue') {
          count++
        }
      })
      
      counts[user.id] = count
    }
    
    rentedCounts.value = counts
  } catch (error) {
    console.error('대여 권수 조회 오류:', error)
  }
}

// 검색 필터 적용
const filterPendingUsers = () => {
  currentPage.value = 1
}

// 검색 초기화
const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

// 등록 다이얼로그 열기
const openRegisterDialog = () => {
  isEditing.value = false
  editingUserId.value = null
  formData.value = {
    email: '',
    name: '',
    workplace: ''
  }
  formErrors.value = {
    email: '',
    name: '',
    workplace: ''
  }
  registerDialog.value = true
}

// 수정 다이얼로그 열기
const openEditDialog = (user) => {
  isEditing.value = true
  editingUserId.value = user.id
  formData.value = {
    email: user.email,
    name: user.name,
    workplace: user.workplace
  }
  formErrors.value = {
    email: '',
    name: '',
    workplace: ''
  }
  registerDialog.value = true
}

// 다이얼로그 닫기
const closeRegisterDialog = () => {
  registerDialog.value = false
  isEditing.value = false
  editingUserId.value = null
  formData.value = {
    email: '',
    name: '',
    workplace: ''
  }
  formErrors.value = {
    email: '',
    name: '',
    workplace: ''
  }
}

// 이메일 유효성 검사
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 폼 제출 (등록/수정)
const handleSubmit = async () => {
  if (!firestore) return
  
  // 유효성 검사
  formErrors.value = {
    email: '',
    name: '',
    workplace: ''
  }
  
  if (!formData.value.email) {
    formErrors.value.email = '이메일을 입력해주세요.'
    return
  }
  
  if (!validateEmail(formData.value.email)) {
    formErrors.value.email = '유효한 이메일 형식이 아닙니다.'
    return
  }
  
  if (!formData.value.name) {
    formErrors.value.name = '이름을 입력해주세요.'
    return
  }
  
  if (!formData.value.workplace) {
    formErrors.value.workplace = '근무지를 선택해주세요.'
    return
  }
  
  try {
    registerLoading.value = true
    const { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    const { user } = useAuth()
    
    // 이메일 중복 체크 (등록 시에만)
    if (!isEditing.value) {
      // users 컬렉션에서 확인
      const usersRef = collection(firestore, 'users')
      const usersQuery = query(usersRef, where('email', '==', formData.value.email))
      const usersSnapshot = await getDocs(usersQuery)
      
      if (!usersSnapshot.empty) {
        formErrors.value.email = '이미 가입된 회원의 이메일입니다.'
        return
      }
      
      // pendingUsers 컬렉션에서 확인
      const pendingRef = collection(firestore, 'pendingUsers')
      const pendingQuery = query(pendingRef, where('email', '==', formData.value.email))
      const pendingSnapshot = await getDocs(pendingQuery)
      
      if (!pendingSnapshot.empty) {
        formErrors.value.email = '이미 등록된 임시 회원 이메일입니다.'
        return
      }
    }
    
    const center = getCenterByWorkplace(formData.value.workplace)
    
    if (isEditing.value) {
      // 수정
      const userRef = doc(firestore, 'pendingUsers', editingUserId.value)
      await updateDoc(userRef, {
        name: formData.value.name,
        workplace: formData.value.workplace,
        center: center,
        updatedAt: serverTimestamp()
      })
      
      await alert('임시 회원 정보가 수정되었습니다.', { type: 'success' })
    } else {
      // 등록
      const pendingRef = collection(firestore, 'pendingUsers')
      const newDocRef = doc(pendingRef)
      
      await setDoc(newDocRef, {
        email: formData.value.email,
        name: formData.value.name,
        workplace: formData.value.workplace,
        center: center,
        role: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user.value?.uid || 'unknown',
        updatedAt: serverTimestamp()
      })
      
      await alert('임시 회원이 등록되었습니다.', { type: 'success' })
    }
    
    closeRegisterDialog()
    await loadPendingUsers()
  } catch (error) {
    console.error('임시 회원 저장 오류:', error)
    await alert('저장에 실패했습니다.', { type: 'error' })
  } finally {
    registerLoading.value = false
  }
}

// 임시 회원 삭제
const handleDelete = async (pendingUser) => {
  if (!firestore) return
  
  // 대여중인 도서가 있는지 확인
  const rentedCount = getRentedCount(pendingUser.id)
  if (rentedCount > 0) {
    await alert(`대여중인 도서가 ${rentedCount}권 있어 삭제할 수 없습니다.\n반납 처리 후 삭제해주세요.`, { type: 'warning' })
    return
  }
  
  const confirmed = await confirm(
    `"${pendingUser.name || pendingUser.email}"님을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
  )
  
  if (!confirmed) return
  
  try {
    actionLoading.value = pendingUser.id
    const { doc, deleteDoc } = await import('firebase/firestore')
    
    const userRef = doc(firestore, 'pendingUsers', pendingUser.id)
    await deleteDoc(userRef)
    
    await loadPendingUsers()
    await alert('임시 회원이 삭제되었습니다.', { type: 'success' })
  } catch (error) {
    console.error('임시 회원 삭제 오류:', error)
    await alert('삭제에 실패했습니다.', { type: 'error' })
  } finally {
    actionLoading.value = null
  }
}

// 페이지 메타데이터
useHead({
  title: '임시 회원 관리 - CNX Library',
  meta: [
    { name: 'description', content: '임시 회원 등록 및 관리' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.pending-users-page {
  width: 100%;
}

// 센터 헤더 (도서 관리 페이지와 동일)
.center-header {
  padding-bottom: rem(16);
  border-bottom: rem(1) solid #e0e0e0;
}

.center-header-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: rem(10);
  flex-wrap: nowrap;
  
  .page-title {
    flex: 0 0 70%;
    min-width: 0;
  }
  
  .center-select {
    flex: 0 0 calc(30% - rem(10));
    min-width: 0;
    
    :deep(.v-input) {
      width: 100%;
    }
  }
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    
    .page-title {
      flex: 0 0 auto;
      width: 100%;
    }
    
    .center-select {
      flex: 0 0 auto;
      width: 100%;
      max-width: 100%;
      
      :deep(.v-input) {
        width: 100%;
        max-width: 100%;
      }
    }
  }
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

// 검색 섹션 + 등록 버튼
.search-section {
  .search-row {
    display: flex;
    align-items: center;
    gap: rem(12);
  }
  
  .search-input {
    flex: 1;
  }
  
  .register-btn {
    flex-shrink: 0;
    height: rem(48);
    min-width: rem(120);
  }
  
  @media (max-width: 480px) {
    .search-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .register-btn {
      width: 100%;
    }
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

// 사용자 그리드 (매니저 관리 페이지와 동일)
.users-grid {
  margin: 0 rem(-8);
  
  .v-col {
    padding: rem(8);
  }
}

// 사용자 카드 (매니저 관리 페이지와 동일)
.user-card {
  height: 100%;
  background-color: #F5F5F5;
  border-radius: rem(8);
  padding: rem(24) rem(20);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(rem(-2));
    box-shadow: 0 rem(4) rem(12) rgba(0, 0, 0, 0.15);
  }
}

.user-card-header {
  margin-bottom: rem(10);
}

.role-chip {
  font-size: rem(9);
  height: rem(16);
  padding: 0 rem(6);
  
  :deep(.v-chip__content) {
    font-size: rem(9);
    line-height: 1;
  }
}

.user-card-content {
  flex: 1;
  margin-bottom: rem(10);
}

.user-name {
  font-size: rem(16);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.3;
  margin-bottom: rem(8);
}

.user-info {
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: rem(4);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.user-card-action {
  margin-top: rem(10);
}

.action-btn {
  width: 100%;
}

// 빈 상태
.empty-state {
  p {
    margin: 0;
  }
}

// 페이지네이션
.pagination-wrapper {
  display: flex;
  justify-content: center;
}

// 등록/수정 다이얼로그
.register-dialog-card {
  padding: rem(24);
}

.register-dialog-title {
  margin-bottom: rem(20);
  color: #002C5B;
  font-weight: 600;
}

.register-dialog-content {
  margin-bottom: rem(20);
}

.register-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: rem(8);
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
