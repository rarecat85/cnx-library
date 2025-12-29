<template>
  <v-app>
    <PageLayout
      header-type="home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="home-page">
        <!-- 나의 도서 대여 현황 -->
        <div class="my-rental-status-section">
          <div class="rental-status-header mb-6">
            <h1 class="page-title mb-0">
              {{ userName }}님의 도서 대여 현황
            </h1>
          </div>
          <div class="rental-dashboard">
            <div
              class="dashboard-card"
              @click="goToMyPage"
            >
              <div class="dashboard-number">
                {{ myRentedCount }}
              </div>
              <div class="dashboard-label">
                대여중 도서
              </div>
            </div>
            <div
              class="dashboard-card warning"
              @click="goToMyPage"
            >
              <div class="dashboard-number">
                {{ myDueSoonCount }}
              </div>
              <div class="dashboard-label">
                반납 예정 도서
              </div>
            </div>
            <div
              class="dashboard-card"
              @click="goToMyPage"
            >
              <div class="dashboard-number">
                {{ myReadCount }}
              </div>
              <div class="dashboard-label">
                내가 읽은 책
              </div>
            </div>
          </div>
        </div>

        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              {{ currentCenter }} 신규 도서
            </h1>
            <v-select
              v-model="currentCenter"
              :items="centerOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              class="center-select"
              @update:model-value="handleCenterChange"
            />
          </div>
        </div>

        <!-- 신규 도서 스와이퍼 -->
        <div class="new-books-section">
          <BookListSwiper
            :books="newBooks"
            :center="currentCenter"
            :registered-books="newBooks"
            :loading="newBooksLoading"
            :title="`총 ${newBooks.length}권`"
            :empty-message="'신규 입고된 도서가 없습니다.'"
            nav-id="new-books"
            :show-action="false"
            :show-status-flags="true"
            :show-rent-button="true"
            :hide-overdue-status="true"
            @rent="handleRent"
          />
          <div class="more-books-btn-wrapper">
            <v-btn
              class="more-books-btn"
              variant="flat"
              size="large"
              block
              to="/books"
            >
              {{ currentCenter }} 도서 더보기
            </v-btn>
          </div>
        </div>
      </div>
    </PageLayout>

    <!-- 라벨 선택 다이얼로그 -->
    <v-dialog
      v-model="labelSelectDialog"
      max-width="500"
    >
      <v-card class="label-select-card">
        <v-card-title class="label-select-title">
          대여할 도서 선택
        </v-card-title>
        
        <v-card-text class="label-select-content">
          <p class="mb-4 text-body-2">
            같은 도서가 {{ selectedGroup?.copies?.length || 0 }}권 있습니다.<br>
            대여할 도서를 선택해주세요.
          </p>
          
          <div class="label-list">
            <div
              v-for="copy in selectedGroup?.copies?.filter(c => !calculateBookStatus(c)) || []"
              :key="copy.labelNumber"
              class="label-item"
              :class="{ selected: selectedLabelNumber === copy.labelNumber }"
              @click="selectLabel(copy)"
            >
              <div class="label-info">
                <span class="label-number">{{ copy.labelNumber }}</span>
                <span class="label-location">{{ copy.location }}</span>
              </div>
              <v-icon
                v-if="selectedLabelNumber === copy.labelNumber"
                color="primary"
              >
                mdi-check-circle
              </v-icon>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="label-select-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeLabelSelectDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!selectedLabelNumber"
            @click="confirmLabelSelection"
          >
            선택 완료
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 대여 확인 다이얼로그 -->
    <v-dialog
      v-model="rentConfirmDialog"
      max-width="500"
    >
      <v-card class="rent-confirm-card">
        <v-card-title class="rent-confirm-title">
          대여 확인
        </v-card-title>
        
        <v-card-text class="rent-confirm-content">
          <div class="rent-confirm-info mb-4">
            <p>아래 정보를 확인 후 대여해주세요.</p>
          </div>
          
          <div
            v-if="selectedBookForRent"
            class="rent-book-card"
          >
            <div class="rent-book-cover">
              <img
                v-if="selectedBookForRent.cover"
                :src="selectedBookForRent.cover"
                :alt="selectedBookForRent.title"
              >
              <v-icon
                v-else
                size="48"
                color="grey-lighten-1"
              >
                mdi-book-outline
              </v-icon>
            </div>
            <div class="rent-book-info">
              <h3 class="rent-book-title">
                {{ selectedBookForRent.title }}
              </h3>
              <p class="rent-book-author">
                {{ selectedBookForRent.author }}
              </p>
              <div class="rent-book-details">
                <span class="detail-item">
                  <v-icon size="16">
                    mdi-label-outline
                  </v-icon>
                  {{ selectedLabelNumber }}
                </span>
                <span class="detail-item">
                  <v-icon size="16">
                    mdi-map-marker-outline
                  </v-icon>
                  {{ selectedLocation }}
                </span>
              </div>
            </div>
          </div>
          
          <div
            v-if="!canDirectRent(userWorkplace, currentCenter)"
            class="rent-notice mt-4"
          >
            <v-icon
              size="20"
              color="warning"
            >
              mdi-information-outline
            </v-icon>
            <span>관리자 승인 후 대여가 완료됩니다.</span>
          </div>
        </v-card-text>
        
        <v-card-actions class="rent-confirm-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeRentConfirmDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="rentLoading"
            @click="confirmRent"
          >
            대여하기
          </v-btn>
        </v-card-actions>
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
definePageMeta({
  layout: false,
  middleware: 'auth'
})

import { CENTERS, getCenterByWorkplace, canDirectRent } from '@/utils/centerMapping.js'

const { user } = useAuth()
const { getBooksByCenter, rentBook, requestRent, calculateBookStatus, checkAlreadyRentedSameIsbn } = useBooks()
const { confirm, alert } = useDialog()

// 라벨 선택 다이얼로그 상태
const labelSelectDialog = ref(false)
const selectedGroup = ref(null)
const selectedLabelNumber = ref('')
const selectedLocation = ref('')
const selectedBookForRent = ref(null)

// 대여 확인 다이얼로그 상태
const rentConfirmDialog = ref(false)
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// 대여 처리 로딩 상태
const rentLoading = ref(false)

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

// 센터 관련
const centerOptions = [...CENTERS]
const currentCenter = ref('')
const userWorkplace = ref('')

// 신규 도서 관련
const newBooks = ref([])
const newBooksLoading = ref(false)

// 나의 도서 대여 현황
const userName = ref('')
const myRentedCount = ref(0)
const myDueSoonCount = ref(0)
const myReadCount = ref(0)

const router = useRouter()

const goToMyPage = () => {
  router.push('/mypage')
}

// 사용자 정보 가져오기 (근무지, 이름)
const getUserInfo = async () => {
  if (!user.value || !firestore) {
    return { workplace: '', name: '' }
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        workplace: userData.workplace || '',
        name: userData.name || ''
      }
    }
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error)
  }

  return { workplace: '', name: '' }
}

// 나의 대여 현황 로드
const loadMyRentalStatus = async () => {
  if (!user.value || !firestore) return
  
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    
    // 대여중 도서 개수 (status가 rented 또는 overdue인 경우만)
    const booksRef = collection(firestore, 'books')
    const rentedQuery = query(booksRef, where('rentedBy', '==', user.value.uid))
    const rentedSnapshot = await getDocs(rentedQuery)
    const rentedBooks = rentedSnapshot.docs
      .map(doc => doc.data())
      .filter(book => book.status === 'rented' || book.status === 'overdue')
    myRentedCount.value = rentedBooks.length
    
    // 반납 예정 도서 (반납예정일 1일 전부터 + 연체 도서 포함)
    // 반납예정일 = 대여일 + 7일
    // 내일 23:59:59까지의 반납예정일을 가진 도서 + 이미 지난 연체 도서
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)
    
    myDueSoonCount.value = rentedBooks.filter(book => {
      if (book.rentedAt) {
        const rentedDate = book.rentedAt?.toDate?.() || new Date(book.rentedAt)
        const returnDate = new Date(rentedDate)
        returnDate.setDate(returnDate.getDate() + 7) // 대여일 + 7일 = 반납예정일
        // 반납예정일이 내일까지이거나 이미 지난 경우 (연체 포함)
        return returnDate <= tomorrow
      }
      return false
    }).length
    
    // 내가 읽은 책 개수 (rentalHistory)
    const historyRef = collection(firestore, 'rentalHistory')
    const historyQuery = query(historyRef, where('userId', '==', user.value.uid))
    const historySnapshot = await getDocs(historyQuery)
    myReadCount.value = historySnapshot.docs.length
  } catch (error) {
    console.error('대여 현황 로드 오류:', error)
  }
}

// 초기화
onMounted(async () => {
  const userInfo = await getUserInfo()
  userWorkplace.value = userInfo.workplace
  userName.value = userInfo.name
  // 근무지 기반으로 센터 매핑
  currentCenter.value = userInfo.workplace ? getCenterByWorkplace(userInfo.workplace) : centerOptions[0]
  
  await Promise.all([
    loadNewBooks(),
    loadMyRentalStatus()
  ])
})

// 센터 변경 처리
const handleCenterChange = async () => {
  await loadNewBooks()
}

// 전체 신규 도서 (그룹화 전)
const allNewBooks = ref([])

// 신규 도서 로드 (구매칸에 위치한 도서)
const loadNewBooks = async () => {
  try {
    newBooksLoading.value = true
    const books = await getBooksByCenter(currentCenter.value)
    
    // 구매칸에 있는 도서만 필터링
    const purchaseBooks = books.filter(book => book.location === '구매칸')
    allNewBooks.value = purchaseBooks
    
    // ISBN 기준으로 중복 제거 (첫 번째 도서만 표시, 나머지는 copies로 그룹화)
    const groupedBooks = new Map()
    purchaseBooks.forEach(book => {
      const isbn = book.isbn13 || book.isbn
      if (!groupedBooks.has(isbn)) {
        groupedBooks.set(isbn, {
          ...book,
          copies: [book],
          availableCount: 1,
          totalCount: 1
        })
      } else {
        const group = groupedBooks.get(isbn)
        group.copies.push(book)
        group.totalCount++
        // 대여 가능한 도서 수 계산
        const status = calculateBookStatus(book)
        if (!status) {
          group.availableCount++
        }
      }
    })
    
    // 첫 번째 그룹의 availableCount 재계산 (첫 번째 도서 포함)
    groupedBooks.forEach(group => {
      group.availableCount = group.copies.filter(book => !calculateBookStatus(book)).length
    })
    
    newBooks.value = Array.from(groupedBooks.values())
  } catch (error) {
    console.error('신규 도서 로드 오류:', error)
    newBooks.value = []
    allNewBooks.value = []
  } finally {
    newBooksLoading.value = false
  }
}

// 최대 대여 권수
const MAX_RENT_COUNT = 5

// 도서 대여 처리 (라벨번호 선택)
const handleRent = async (book) => {
  if (!user.value || !book) return
  
  // 바로 대여 가능 여부 확인 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)
  
  // 바로 대여 가능한 경우에만 대여 권수 체크
  if (isDirectRent && myRentedCount.value >= MAX_RENT_COUNT) {
    await alert(`${MAX_RENT_COUNT}권을 대여중입니다. 대여중인 도서를 반납 후 대여해주세요.`, { type: 'warning' })
    return
  }
  
  // 대여 가능한 도서가 없는 경우
  if (book.availableCount === 0) {
    await alert('현재 대여 가능한 도서가 없습니다.', { type: 'warning' })
    return
  }
  
  // 같은 ISBN 이미 대여중인지 체크
  const isbn = book.isbn13 || book.isbn
  const alreadyRented = await checkAlreadyRentedSameIsbn(user.value.uid, isbn, currentCenter.value)
  if (alreadyRented) {
    await alert(`이미 같은 도서를 대여중입니다.\n(라벨번호: ${alreadyRented.labelNumber || '-'})`, { type: 'warning' })
    return
  }
  
  // 대여 가능한 복사본 목록
  const availableCopies = book.copies.filter(copy => !calculateBookStatus(copy))
  
  if (availableCopies.length === 1) {
    // 복사본이 1개면 바로 대여 확인 다이얼로그
    const copy = availableCopies[0]
    selectedGroup.value = book
    selectedLabelNumber.value = copy.labelNumber
    selectedLocation.value = copy.location
    selectedBookForRent.value = copy
    rentConfirmDialog.value = true
  } else {
    // 여러 복사본 중 선택
    selectedGroup.value = book
    selectedLabelNumber.value = ''
    selectedLocation.value = ''
    selectedBookForRent.value = null
    labelSelectDialog.value = true
  }
}

// 라벨 선택
const selectLabel = (copy) => {
  selectedLabelNumber.value = copy.labelNumber
  selectedLocation.value = copy.location
  selectedBookForRent.value = copy
}

// 라벨 선택 다이얼로그 닫기
const closeLabelSelectDialog = () => {
  labelSelectDialog.value = false
  selectedGroup.value = null
  selectedLabelNumber.value = ''
  selectedLocation.value = ''
  selectedBookForRent.value = null
}

// 라벨 선택 확인
const confirmLabelSelection = () => {
  if (!selectedGroup.value || !selectedLabelNumber.value) return
  labelSelectDialog.value = false
  rentConfirmDialog.value = true
}

// 대여 확인 다이얼로그 닫기
const closeRentConfirmDialog = () => {
  rentConfirmDialog.value = false
  selectedGroup.value = null
  selectedLabelNumber.value = ''
  selectedLocation.value = ''
  selectedBookForRent.value = null
}

// 대여 확인 후 실제 대여 처리
const confirmRent = async () => {
  if (!selectedBookForRent.value || !user.value) return
  
  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)
  
  try {
    rentLoading.value = true
    rentConfirmDialog.value = false
    
    const labelNumber = selectedBookForRent.value.labelNumber
    const isbn = selectedBookForRent.value.isbn13 || selectedBookForRent.value.isbn
    
    if (isDirectRent) {
      // 바로 대여 처리 (라벨번호 기준)
      await rentBook(labelNumber, currentCenter.value, user.value.uid, isbn)
      await Promise.all([
        loadNewBooks(),
        loadMyRentalStatus()
      ])
      await alert('도서 대여가 완료되었습니다.', { type: 'success' })
    } else {
      // 대여 신청 처리 (라벨번호 기준)
      await requestRent(labelNumber, currentCenter.value, user.value.uid, isbn)
      await loadNewBooks()
      await alert('도서 대여가 신청되었습니다.\n관리자 승인 후 대여가 완료됩니다.', { type: 'success' })
    }
  } catch (err) {
    console.error('대여 신청 오류:', err)
    await alert(err.message || '대여 신청에 실패했습니다.', { type: 'error' })
  } finally {
    rentLoading.value = false
    selectedGroup.value = null
    selectedLabelNumber.value = ''
    selectedLocation.value = ''
    selectedBookForRent.value = null
  }
}

// 페이지 메타데이터
useHead({
  title: '홈 - CNX Library',
  meta: [
    { name: 'description', content: 'CNX Library 도서 관리 시스템' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.home-page {
  width: 100%;
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

.new-books-section {
  margin-top: rem(24);
  
  :deep(.book-list-swiper-section) {
    border-top: none;
    padding-top: 0;
  }
}

.more-books-btn-wrapper {
  margin-top: rem(24);
}

.more-books-btn {
  height: rem(48);
  font-size: rem(16);
  font-weight: 500;
  border-radius: rem(8);
  background-color: #002C5B;
  color: #FFFFFF;
  
  &:hover:not(:disabled) {
    background-color: #003d7a;
  }
}

/* 나의 도서 대여 현황 섹션 */
.my-rental-status-section {
  margin-bottom: rem(32);
}

.rental-status-header {
  padding-bottom: rem(16);
  border-bottom: rem(1) solid #e0e0e0;
}

.rental-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: rem(12);
}

.dashboard-card {
  background-color: #f8f9fa;
  border-radius: rem(12);
  padding: rem(20) rem(16);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: rem(1) solid #e9ecef;
  
  &:hover {
    background-color: #e9ecef;
    transform: translateY(rem(-2));
  }
  
  &.warning {
    background-color: #fff3cd;
    border-color: #ffc107;
    
    .dashboard-number {
      color: #856404;
    }
    
    &:hover {
      background-color: #ffe69c;
    }
  }
}

.dashboard-number {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin-bottom: rem(4);
}

.dashboard-label {
  font-size: rem(12);
  font-weight: 500;
  color: #6b7280;
  line-height: 1.3;
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

/* 라벨 선택 다이얼로그 스타일 */
.label-select-card {
  border-radius: rem(16);
}

.label-select-title {
  font-size: rem(20);
  font-weight: 600;
  color: #002C5B;
  padding: rem(20) rem(24) rem(8);
}

.label-select-content {
  padding: rem(16) rem(24);
}

.label-list {
  display: flex;
  flex-direction: column;
  gap: rem(8);
}

.label-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(12) rem(16);
  border: rem(1) solid #e0e0e0;
  border-radius: rem(8);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.selected {
    border-color: #002C5B;
    background-color: #e3f2fd;
  }
}

.label-info {
  display: flex;
  flex-direction: column;
  gap: rem(4);
}

.label-number {
  font-size: rem(16);
  font-weight: 600;
  color: #002C5B;
}

.label-location {
  font-size: rem(14);
  color: #6b7280;
}

.label-select-actions {
  padding: rem(8) rem(24) rem(16);
}

/* 대여 확인 다이얼로그 스타일 */
.rent-confirm-card {
  border-radius: rem(16);
}

.rent-confirm-title {
  font-size: rem(20);
  font-weight: 600;
  color: #002C5B;
  padding: rem(20) rem(24) rem(8);
}

.rent-confirm-content {
  padding: rem(16) rem(24);
}

.rent-confirm-info p {
  font-size: rem(14);
  color: #6b7280;
  margin: 0;
}

.rent-book-card {
  display: flex;
  gap: rem(16);
  padding: rem(16);
  background-color: #f8f9fa;
  border-radius: rem(12);
}

.rent-book-cover {
  flex-shrink: 0;
  width: rem(80);
  height: rem(110);
  background-color: #e9ecef;
  border-radius: rem(8);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.rent-book-info {
  flex: 1;
  min-width: 0;
}

.rent-book-title {
  font-size: rem(16);
  font-weight: 600;
  color: #002C5B;
  margin: 0 0 rem(4);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rent-book-author {
  font-size: rem(14);
  color: #6b7280;
  margin: 0 0 rem(12);
}

.rent-book-details {
  display: flex;
  flex-direction: column;
  gap: rem(4);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: rem(4);
  font-size: rem(13);
  color: #374151;
  
  .v-icon {
    color: #6b7280;
  }
}

.rent-notice {
  display: flex;
  align-items: center;
  gap: rem(8);
  padding: rem(12);
  background-color: #fff3cd;
  border-radius: rem(8);
  font-size: rem(14);
  color: #856404;
}

.rent-confirm-actions {
  padding: rem(8) rem(24) rem(16);
}
</style>
