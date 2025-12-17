<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="books-page">
        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              {{ currentCenter }} 도서 대여
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

        <!-- 등록된 도서 영역 -->
        <div class="registered-books-section">
          <div class="registered-books-header mb-0">
            <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
              <div class="text-body-1">
                총 <strong>{{ filteredRegisteredBooks.length }}</strong>권
              </div>
            </div>
            <div class="d-flex align-center registered-search-group">
              <v-text-field
                v-model="registeredBooksSearchQuery"
                label="도서 검색"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                class="registered-search-input"
                @update:model-value="handleRegisteredBooksSearch"
              />
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="정렬"
                variant="outlined"
                density="comfortable"
                hide-details
                class="sort-select"
              />
            </div>
            
            <!-- 대여 신청 영역 -->
            <div class="d-flex align-center justify-space-between flex-wrap gap-4 mt-4">
              <div class="text-body-2 text-medium-emphasis">
                <template v-if="currentRentedCount >= MAX_RENT_COUNT">
                  {{ MAX_RENT_COUNT }}권 대여중 (반납 후 대여 가능)
                </template>
                <template v-else-if="selectedBooks.length > 0">
                  {{ selectedBooks.length }}권 선택됨 ({{ currentRentedCount }}권 대여중, {{ remainingRentCount }}권 추가 가능)
                </template>
                <template v-else>
                  대여할 도서를 선택하세요 ({{ currentRentedCount }}권 대여중, {{ remainingRentCount }}권 추가 가능)
                </template>
              </div>
              <v-btn
                class="rent-request-btn"
                variant="flat"
                size="small"
                :disabled="selectedBooks.length === 0 || !canRentMore"
                :loading="rentRequestLoading"
                @click="handleRentRequest"
              >
                대여 신청
              </v-btn>
            </div>
          </div>

          <div
            v-if="registeredBooksLoading"
            class="text-center py-8 mt-6"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-else-if="filteredRegisteredBooks.length > 0"
            class="registered-books-grid mt-6"
          >
            <v-row class="book-list-row">
              <v-col
                v-for="(book, index) in filteredRegisteredBooks"
                :key="`registered-${index}`"
                cols="12"
                sm="6"
                class="book-list-col"
              >
                <BookCard
                  :book="book"
                  :center="currentCenter"
                  :registered-books="[book]"
                  :is-registered="true"
                  :show-action="false"
                  :selectable="true"
                  :selected="isBookSelected(book)"
                  :status="getBookStatus(book)"
                  :show-status-flags="true"
                  :disabled="isBookUnavailable(book)"
                  :hide-overdue-status="true"
                  :show-rent-button="true"
                  @select="handleBookSelect"
                  @rent="handleSingleRent"
                />
              </v-col>
            </v-row>
          </div>
          <div
            v-else
            class="text-center py-8 mt-6 text-medium-emphasis empty-state"
          >
            <v-icon
              size="48"
              color="grey-lighten-1"
              class="mb-4"
            >
              {{ registeredBooksSearchQuery ? 'mdi-book-search-outline' : 'mdi-book-off-outline' }}
            </v-icon>
            <p v-if="registeredBooksSearchQuery">
              '<strong>{{ registeredBooksSearchQuery }}</strong>'에 대한 검색 결과가 없습니다.
            </p>
            <p v-else>
              등록된 도서가 없습니다.
            </p>
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
import { CENTERS, getCenterByWorkplace, canDirectRent } from '@/utils/centerMapping.js'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

const { user } = useAuth()
const { 
  getBooksByCenter,
  calculateBookStatus,
  rentBook,
  requestRent,
  loading: booksLoading 
} = useBooks()
const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

const drawer = useState('navigationDrawer', () => false)
const drawerWidth = ref(280)

// 센터 관련
const centerOptions = [...CENTERS]
const currentCenter = ref('')
const userWorkplace = ref('')

// 등록된 도서 관련
const registeredBooks = ref([])
const registeredBooksLoading = ref(false)
const registeredBooksSearchQuery = ref('')
const sortBy = ref('date')
const sortOptions = [
  { title: '등록일순', value: 'date' },
  { title: '제목순', value: 'title' }
]

// 도서 선택 관련
const selectedBooks = ref([])
const rentRequestLoading = ref(false)
const MAX_RENT_COUNT = 5

// 현재 대여중인 도서 수
const currentRentedCount = ref(0)

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
      const userData = userDoc.data()
      return userData.workplace || ''
    }
  } catch (error) {
    console.error('사용자 근무지 정보 가져오기 오류:', error)
  }

  return ''
}

// 초기화
onMounted(async () => {
  const workplace = await getUserWorkplace()
  userWorkplace.value = workplace
  // 근무지 기반으로 센터 매핑
  currentCenter.value = workplace ? getCenterByWorkplace(workplace) : centerOptions[0]
  
  await Promise.all([
    loadRegisteredBooks(),
    loadCurrentRentedCount()
  ])
})

// 현재 대여중인 도서 수 로드
const loadCurrentRentedCount = async () => {
  if (!user.value || !firestore) {
    currentRentedCount.value = 0
    return
  }

  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const booksRef = collection(firestore, 'books')
    const q = query(
      booksRef,
      where('rentedBy', '==', user.value.uid)
    )
    
    const snapshot = await getDocs(q)
    // status가 rented 또는 overdue인 도서만 카운트 (반납된 도서 제외)
    let count = 0
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.status === 'rented' || data.status === 'overdue') {
        count++
      }
    })
    currentRentedCount.value = count
  } catch (error) {
    console.error('대여중인 도서 수 로드 오류:', error)
    currentRentedCount.value = 0
  }
}

// 추가 대여 가능 여부
const canRentMore = computed(() => {
  return currentRentedCount.value < MAX_RENT_COUNT
})

// 남은 대여 가능 권수
const remainingRentCount = computed(() => {
  return MAX_RENT_COUNT - currentRentedCount.value
})

// 센터 변경 처리
const handleCenterChange = async () => {
  await loadRegisteredBooks()
}

// 등록된 도서 로드
const loadRegisteredBooks = async () => {
  try {
    registeredBooksLoading.value = true
    const books = await getBooksByCenter(currentCenter.value)
    registeredBooks.value = books
  } catch (error) {
    console.error('등록된 도서 로드 오류:', error)
    registeredBooks.value = []
  } finally {
    registeredBooksLoading.value = false
  }
}


// 등록된 도서 검색
const handleRegisteredBooksSearch = () => {
  // 검색은 computed에서 처리됨
}

// 필터링 및 정렬된 등록된 도서
const filteredRegisteredBooks = computed(() => {
  let books = [...registeredBooks.value]

  // 검색 필터링
  if (registeredBooksSearchQuery.value.trim()) {
    const query = registeredBooksSearchQuery.value.toLowerCase()
    books = books.filter(book => {
      const title = (book.title || '').toLowerCase()
      const author = (book.author || '').toLowerCase()
      const publisher = (book.publisher || '').toLowerCase()
      return title.includes(query) || author.includes(query) || publisher.includes(query)
    })
  }

  // 정렬
  if (sortBy.value === 'title') {
    books.sort((a, b) => {
      const titleA = (a.title || '').toLowerCase()
      const titleB = (b.title || '').toLowerCase()
      return titleA.localeCompare(titleB, 'ko')
    })
  } else if (sortBy.value === 'date') {
    books.sort((a, b) => {
      const dateA = a.registeredAt?.toDate?.() || new Date(0)
      const dateB = b.registeredAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })
  }

  return books
})

// 도서 상태 계산
const getBookStatus = (book) => {
  return calculateBookStatus(book)
}

// 대여 불가 여부 확인 (대여중, 연체중, 신청중인 도서는 선택 불가)
const isBookUnavailable = (book) => {
  const status = getBookStatus(book)
  return status === 'rented' || status === 'overdue' || status === 'requested'
}

// 도서 선택 여부 확인
const isBookSelected = (book) => {
  const isbn = book.isbn13 || book.isbn || book.id || ''
  return selectedBooks.value.some(selected => {
    const selectedIsbn = selected.isbn13 || selected.isbn || selected.id || ''
    return isbn === selectedIsbn
  })
}

// 도서 선택 처리
const handleBookSelect = async (book, selected) => {
  const isbn = book.isbn13 || book.isbn || book.id || ''
  const status = getBookStatus(book)
  
  // 대여중, 연체중, 신청중인 도서는 선택 불가
  if (status === 'rented' || status === 'overdue' || status === 'requested') {
    return
  }
  
  if (selected) {
    // 대여 가능 여부 체크
    if (!canRentMore.value) {
      await alert(`${MAX_RENT_COUNT}권을 대여중입니다. 대여중인 도서를 반납 후 대여해주세요.`, { type: 'warning' })
      return
    }
    
    // 최대 선택 개수 체크 (남은 대여 가능 권수까지만)
    if (selectedBooks.value.length >= remainingRentCount.value) {
      await alert(`현재 ${remainingRentCount.value}권까지 추가 대여 가능합니다.`, { type: 'warning' })
      return
    }
    
    if (!isBookSelected(book)) {
      selectedBooks.value.push(book)
    }
  } else {
    selectedBooks.value = selectedBooks.value.filter(selectedBook => {
      const selectedIsbn = selectedBook.isbn13 || selectedBook.isbn || selectedBook.id || ''
      return isbn !== selectedIsbn
    })
  }
}

// 대여 신청 처리
const handleRentRequest = async () => {
  if (selectedBooks.value.length === 0 || !user.value) return

  // 바로 대여 가능 여부 확인 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)

  // 바로 대여 가능할 경우에만 대여 가능 여부 체크
  if (isDirectRent) {
    if (!canRentMore.value) {
      await alert(`${MAX_RENT_COUNT}권을 대여중입니다. 대여중인 도서를 반납 후 대여해주세요.`, { type: 'warning' })
      return
    }

    if (selectedBooks.value.length > remainingRentCount.value) {
      await alert(`현재 ${remainingRentCount.value}권까지 추가 대여 가능합니다.`, { type: 'warning' })
      return
    }
  }

  const bookTitles = selectedBooks.value.map(book => book.title).join(', ')
  const confirmMessage = isDirectRent 
    ? `다음 도서들을 대여 신청하시겠습니까?\n\n${bookTitles}`
    : `대여 신청하시겠습니까?\n(관리자 승인 후 대여 가능)\n\n${bookTitles}`
  
  if (!await confirm(confirmMessage)) {
    return
  }

  try {
    rentRequestLoading.value = true
    const bookCount = selectedBooks.value.length
    
    if (isDirectRent) {
      // 바로 대여 처리 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
      const promises = selectedBooks.value.map(book => {
        const isbn = book.isbn13 || book.isbn
        return rentBook(isbn, currentCenter.value, user.value.uid)
      })
      await Promise.all(promises)
      
      await Promise.all([
        loadRegisteredBooks(),
        loadCurrentRentedCount()
      ])
      
      await alert(`${bookCount}권의 도서 대여가 완료되었습니다.`, { type: 'success' })
    } else {
      // 대여 신청 처리 (그 외 모든 경우)
      const promises = selectedBooks.value.map(book => {
        const isbn = book.isbn13 || book.isbn
        return requestRent(isbn, currentCenter.value, user.value.uid)
      })
      await Promise.all(promises)
      
      await loadRegisteredBooks()
      
      await alert(`${bookCount}권의 도서 대여가 신청되었습니다.\n관리자 승인 후 대여가 완료됩니다.`, { type: 'success' })
    }
    
    selectedBooks.value = []
  } catch (err) {
    console.error('대여 신청 오류:', err)
    await alert(err.message || '대여 신청에 실패했습니다.', { type: 'error' })
  } finally {
    rentRequestLoading.value = false
  }
}

// 개별 도서 대여 신청 처리
const handleSingleRent = async (book) => {
  if (!user.value || !book) return

  // 바로 대여 가능 여부 확인 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)

  // 바로 대여 가능할 경우에만 대여 가능 여부 체크
  if (isDirectRent && !canRentMore.value) {
    await alert(`${MAX_RENT_COUNT}권을 대여중입니다. 대여중인 도서를 반납 후 대여해주세요.`, { type: 'warning' })
    return
  }

  const confirmMessage = isDirectRent 
    ? `"${book.title}"을(를) 대여 신청하시겠습니까?`
    : `"${book.title}"을(를) 대여 신청하시겠습니까?\n(관리자 승인 후 대여 가능)`
  
  if (!await confirm(confirmMessage)) {
    return
  }

  try {
    rentRequestLoading.value = true
    
    const isbn = book.isbn13 || book.isbn
    
    if (isDirectRent) {
      // 바로 대여 처리 (강남 근무지 + 강남센터 또는 용산 근무지 + 용산센터)
      await rentBook(isbn, currentCenter.value, user.value.uid)
      
      await Promise.all([
        loadRegisteredBooks(),
        loadCurrentRentedCount()
      ])
      
      await alert('도서 대여가 완료되었습니다.', { type: 'success' })
    } else {
      // 대여 신청 처리 (그 외 모든 경우)
      await requestRent(isbn, currentCenter.value, user.value.uid)
      
      await loadRegisteredBooks()
      
      await alert('도서 대여가 신청되었습니다.\n관리자 승인 후 대여가 완료됩니다.', { type: 'success' })
    }
    
    // 선택 목록에서도 제거
    selectedBooks.value = selectedBooks.value.filter(b => b.id !== book.id)
  } catch (err) {
    console.error('대여 신청 오류:', err)
    await alert(err.message || '대여 신청에 실패했습니다.', { type: 'error' })
  } finally {
    rentRequestLoading.value = false
  }
}

// 페이지 메타데이터
useHead({
  title: '도서 대여 - CNX Library',
  meta: [
    { name: 'description', content: '센터별 도서 대여 신청' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.books-page {
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
      width: 100% !important;
      max-width: 100% !important;
      
      :deep(.v-input) {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  }
}

.registered-books-header {
  margin-bottom: rem(24);
}

.registered-search-group {
  gap: rem(10);
  width: 100%;
  
  .registered-search-input {
    flex: 0 0 70%;
  }
  
  .registered-search-input :deep(.v-input) {
    flex: 0 0 100% !important;
  }
  
  .sort-select {
    flex: 0 0 30%;
  }
  
  .sort-select :deep(.v-input) {
    flex: 0 0 100% !important;
  }
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    
    .registered-search-input {
      flex: 0 0 100%;
      width: 100%;
    }
    
    .sort-select {
      flex: 0 0 100%;
      width: 100%;
    }
  }
}

.rent-request-btn {
  background-color: #002C5B;
  color: #FFFFFF;
  
  &:hover:not(:disabled) {
    background-color: #003d7a;
  }
  
  &:disabled {
    background-color: #F5F5F5;
    color: #002C5B;
    opacity: 1;
  }
  
  :deep(.v-btn__overlay) {
    display: none;
  }
  
  &:disabled :deep(.v-btn__content) {
    color: #002C5B;
  }
}

.book-list-row {
  align-items: stretch;
}

.book-list-col {
  display: flex;
  
  :deep(.book-card) {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
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

