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
const { getBooksByCenter, rentBook, requestRent } = useBooks()
const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// 대여 처리 로딩 상태
const rentLoading = ref(false)

const drawer = useState('navigationDrawer', () => false)

// 반응형 drawer 너비 계산
const drawerWidth = ref(280)

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
    
    // 대여중 도서 개수
    const booksRef = collection(firestore, 'books')
    const rentedQuery = query(booksRef, where('rentedBy', '==', user.value.uid))
    const rentedSnapshot = await getDocs(rentedQuery)
    const rentedBooks = rentedSnapshot.docs.map(doc => doc.data())
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

// 신규 도서 로드 (등록일 기준 한 달 이내)
const loadNewBooks = async () => {
  try {
    newBooksLoading.value = true
    const books = await getBooksByCenter(currentCenter.value)
    
    // 한 달 이내 등록된 도서만 필터링
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    newBooks.value = books.filter(book => {
      if (book.registeredAt) {
        const registeredDate = book.registeredAt?.toDate?.() || new Date(book.registeredAt)
        return registeredDate >= oneMonthAgo
      }
      return false
    })
  } catch (error) {
    console.error('신규 도서 로드 오류:', error)
    newBooks.value = []
  } finally {
    newBooksLoading.value = false
  }
}

// 도서 대여 처리
const handleRent = async (book) => {
  if (!user.value || !book) return
  
  // 바로 대여 가능 여부 확인 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)
  
  const confirmMessage = isDirectRent 
    ? `"${book.title}"을(를) 대여 신청하시겠습니까?`
    : `"${book.title}"을(를) 대여 신청하시겠습니까?\n(관리자 승인 후 대여 가능)`
  
  if (!await confirm(confirmMessage)) {
    return
  }
  
  try {
    rentLoading.value = true
    
    const isbn = book.isbn13 || book.isbn
    
    if (isDirectRent) {
      // 바로 대여 처리 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
      await rentBook(isbn, currentCenter.value, user.value.uid)
      await loadNewBooks()
      await alert('도서 대여가 완료되었습니다.', { type: 'success' })
    } else {
      // 대여 신청 처리 (그 외 모든 경우)
      await requestRent(isbn, currentCenter.value, user.value.uid)
      await loadNewBooks()
      await alert('도서 대여가 신청되었습니다.\n관리자 승인 후 대여가 완료됩니다.', { type: 'success' })
    }
  } catch (err) {
    console.error('대여 신청 오류:', err)
    await alert(err.message || '대여 신청에 실패했습니다.', { type: 'error' })
  } finally {
    rentLoading.value = false
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
</style>
