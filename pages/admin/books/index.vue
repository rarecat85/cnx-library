<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="books-admin-page">
        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              {{ currentCenter }} 도서 관리
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
              <div class="text-body-2 text-medium-emphasis">
                대여중 <strong>{{ rentedCount }}</strong>권, 연체중 <strong>{{ overdueCount }}</strong>권
              </div>
            </div>
            <div class="d-flex align-center registered-search-group">
              <v-text-field
                v-model="registeredBooksSearchQuery"
                label="등록도서 검색"
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
            
            <!-- 도서 선택 및 액션 영역 -->
            <div class="d-flex align-center justify-space-between flex-wrap gap-4 mt-4">
              <v-checkbox
                v-model="selectAll"
                label="전체선택"
                hide-details
                class="select-all-checkbox"
                @update:model-value="handleSelectAll"
              />
              <div class="d-flex action-buttons">
                <v-btn
                  class="action-btn"
                  variant="flat"
                  size="small"
                  :disabled="selectedBooks.length === 0"
                  :loading="actionLoading"
                  @click="handleDeleteBooks"
                >
                  도서 삭제
                </v-btn>
                <v-btn
                  class="action-btn"
                  variant="flat"
                  size="small"
                  :disabled="selectedBooks.length === 0"
                  :loading="actionLoading"
                  @click="handleRentBooks"
                >
                  대여 처리
                </v-btn>
                <v-btn
                  class="action-btn"
                  variant="flat"
                  size="small"
                  :disabled="selectedBooks.length === 0"
                  :loading="actionLoading"
                  @click="handleReturnBooks"
                >
                  반납 처리
                </v-btn>
              </div>
            </div>
          </div>

          <div
            v-if="registeredBooksLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-else-if="filteredRegisteredBooks.length > 0"
            class="registered-books-grid"
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
                  @select="handleBookSelect"
                />
              </v-col>
            </v-row>
          </div>
          <div
            v-else
            class="text-center py-8 text-medium-emphasis"
          >
            등록된 도서가 없습니다.
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
  middleware: 'admin'
})

const { user } = useAuth()
const { 
  getBooksByCenter,
  rentBook,
  returnBook,
  deleteBook,
  calculateBookStatus,
  loading: booksLoading 
} = useNaverBooks()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

const drawer = useState('navigationDrawer', () => false)
const drawerWidth = ref(280)

// 센터 관련
const centerOptions = [
  '강남1센터',
  '강남2센터',
  '용산센터'
]
const currentCenter = ref('')
const userCenter = ref('')

// 등록된 도서 관련
const registeredBooks = ref([])
const registeredBooksLoading = ref(false)
const registeredBooksSearchQuery = ref('')
const sortBy = ref('title')
const sortOptions = [
  { title: '제목순', value: 'title' },
  { title: '등록일순', value: 'date' },
  { title: '대여중도서', value: 'rented' },
  { title: '연체중도서', value: 'overdue' },
  { title: '신규등록도서', value: 'new' }
]

// 도서 선택 관련
const selectedBooks = ref([])
const selectAll = ref(false)
const actionLoading = ref(false)

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

// 사용자 센터 정보 가져오기
const getUserCenter = async () => {
  if (!user.value || !firestore) {
    return ''
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.center || ''
    }
  } catch (error) {
    console.error('사용자 센터 정보 가져오기 오류:', error)
  }

  return ''
}

// 초기화
onMounted(async () => {
  const center = await getUserCenter()
  userCenter.value = center
  currentCenter.value = center || centerOptions[0]
  
  await loadRegisteredBooks()
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
  } else if (sortBy.value === 'rented') {
    // 대여중 도서만 필터링
    books = books.filter(book => {
      const status = calculateBookStatus(book)
      return status === 'rented'
    })
  } else if (sortBy.value === 'overdue') {
    // 연체중 도서만 필터링
    books = books.filter(book => {
      const status = calculateBookStatus(book)
      return status === 'overdue'
    })
  } else if (sortBy.value === 'new') {
    // 신규등록 도서만 필터링 (등록일 기준 한 달 이내)
    books = books.filter(book => {
      if (book.registeredAt) {
        const registeredDate = book.registeredAt?.toDate?.() || new Date(book.registeredAt)
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        return registeredDate >= oneMonthAgo
      }
      return false
    })
  }

  return books
})

// 대여중 및 연체중 도서 수 계산
const rentedCount = computed(() => {
  return filteredRegisteredBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'rented'
  }).length
})

const overdueCount = computed(() => {
  return filteredRegisteredBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'overdue'
  }).length
})

// 관련도 점수 계산
const getRelevanceScore = (book, query) => {
  let score = 0
  const title = (book.title || '').toLowerCase()
  const author = (book.author || '').toLowerCase()
  const publisher = (book.publisher || '').toLowerCase()

  if (title.includes(query)) score += 10
  if (title.startsWith(query)) score += 5
  if (author.includes(query)) score += 3
  if (publisher.includes(query)) score += 1

  return score
}

// 도서 상태 계산
const getBookStatus = (book) => {
  return calculateBookStatus(book)
}

// 도서 선택 관련 함수
const isBookSelected = (book) => {
  const isbn = book.isbn13 || book.isbn || book.id || ''
  return selectedBooks.value.some(selected => {
    const selectedIsbn = selected.isbn13 || selected.isbn || selected.id || ''
    return isbn === selectedIsbn
  })
}

const handleBookSelect = (book, selected) => {
  const isbn = book.isbn13 || book.isbn || book.id || ''
  
  if (selected) {
    if (!isBookSelected(book)) {
      selectedBooks.value.push(book)
    }
  } else {
    selectedBooks.value = selectedBooks.value.filter(selectedBook => {
      const selectedIsbn = selectedBook.isbn13 || selectedBook.isbn || selectedBook.id || ''
      return isbn !== selectedIsbn
    })
  }
  
  // 전체선택 체크박스 상태 업데이트
  selectAll.value = selectedBooks.value.length === filteredRegisteredBooks.value.length && filteredRegisteredBooks.value.length > 0
}

const handleSelectAll = (value) => {
  if (value) {
    selectedBooks.value = [...filteredRegisteredBooks.value]
  } else {
    selectedBooks.value = []
  }
}

// 필터링된 도서 목록이 변경될 때 전체선택 상태 업데이트
watch(() => filteredRegisteredBooks.value, () => {
  selectAll.value = selectedBooks.value.length === filteredRegisteredBooks.value.length && filteredRegisteredBooks.value.length > 0
})

// 도서 삭제 처리
const handleDeleteBooks = async () => {
  if (selectedBooks.value.length === 0) return

  if (!confirm(`선택한 ${selectedBooks.value.length}권의 도서를 삭제하시겠습니까?`)) {
    return
  }

  try {
    actionLoading.value = true
    const promises = selectedBooks.value.map(book => {
      const isbn = book.isbn13 || book.isbn || book.id
      return deleteBook(isbn)
    })
    await Promise.all(promises)
    selectedBooks.value = []
    await loadRegisteredBooks()
  } catch (error) {
    console.error('도서 삭제 오류:', error)
    alert('도서 삭제에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

// 도서 대여 처리
const handleRentBooks = async () => {
  if (selectedBooks.value.length === 0 || !user.value) return

  if (!confirm(`선택한 ${selectedBooks.value.length}권의 도서를 대여 처리하시겠습니까?`)) {
    return
  }

  try {
    actionLoading.value = true
    const promises = selectedBooks.value.map(book => {
      const isbn = book.isbn13 || book.isbn || book.id
      return rentBook(isbn, user.value.uid)
    })
    await Promise.all(promises)
    selectedBooks.value = []
    await loadRegisteredBooks()
  } catch (error) {
    console.error('도서 대여 오류:', error)
    alert('도서 대여에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

// 도서 반납 처리
const handleReturnBooks = async () => {
  if (selectedBooks.value.length === 0) return

  if (!confirm(`선택한 ${selectedBooks.value.length}권의 도서를 반납 처리하시겠습니까?`)) {
    return
  }

  try {
    actionLoading.value = true
    const promises = selectedBooks.value.map(book => {
      const isbn = book.isbn13 || book.isbn || book.id
      return returnBook(isbn)
    })
    await Promise.all(promises)
    selectedBooks.value = []
    await loadRegisteredBooks()
  } catch (error) {
    console.error('도서 반납 오류:', error)
    alert('도서 반납에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

// 페이지 메타데이터
useHead({
  title: '도서 관리 - CNX Library',
  meta: [
    { name: 'description', content: '도서 검색 및 등록 관리' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.books-admin-page {
  width: 100%;
}

.page-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.section-title {
  font-size: rem(24);
  font-weight: 600;
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

.action-buttons {
  gap: rem(5);
}

.action-btn {
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
