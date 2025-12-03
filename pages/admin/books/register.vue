<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="books-register-page">
        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              {{ currentCenter }} 도서 등록
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

        <!-- 도서 검색 인풋 -->
        <div class="search-section mb-6">
          <v-text-field
            v-model="searchQuery"
            label="도서 검색"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            :loading="searchLoading"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
            @click:clear="clearSearch"
          />
        </div>

        <!-- 검색 결과 영역 -->
        <div
          v-if="searchResults.length > 0"
          class="search-results-section mb-8"
        >
          <div class="search-results-header mb-4">
            <div class="text-body-1">
              총 <strong>{{ searchTotal }}</strong>개의 검색 결과
              <span
                v-if="searchTotalPages > 1"
                class="text-body-2 ml-2 text-medium-emphasis"
              >
                ({{ currentSearchPage }} / {{ searchTotalPages }} 페이지)
              </span>
            </div>
          </div>
          
          <v-row class="book-list-row">
            <v-col
              v-for="(book, index) in searchResults"
              :key="`search-${index}`"
              cols="12"
              sm="6"
              class="book-list-col"
            >
              <BookCard
                :book="book"
                :center="currentCenter"
                :registered-books="registeredBooks"
                :selectable="false"
                :show-action="true"
                @register="handleBookRegister"
              />
            </v-col>
          </v-row>
          
          <div
            v-if="searchTotalPages > 1"
            class="d-flex justify-center mt-6"
          >
            <v-pagination
              v-model="currentSearchPage"
              :length="searchTotalPages"
              :total-visible="7"
              @update:model-value="handleSearchPageChange"
            />
          </div>
        </div>

        <!-- 베스트셀러 영역 -->
        <BookListSwiper
          :books="bestsellers"
          :center="currentCenter"
          :registered-books="registeredBooks"
          :title="'베스트셀러'"
          :loading="bestsellersLoading"
          :empty-message="'베스트셀러를 불러올 수 없습니다.'"
          nav-id="bestseller"
          class="mb-8"
          @register="handleBookRegister"
        />
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
  searchBooks, 
  registerBook, 
  getBooksByCenter, 
  getBestsellers,
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

// 검색 관련
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchError = ref(null)
const searchTotal = ref(0)
const currentSearchPage = ref(1)
const searchTotalPages = computed(() => Math.ceil(searchTotal.value / 10))

// 베스트셀러 관련
const bestsellers = ref([])
const bestsellersLoading = ref(false)

// 등록된 도서 관련 (등록 상태 확인용)
const registeredBooks = ref([])

// 등록 처리 중인 도서
const registeringBooks = ref(new Set())

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
  
  await Promise.all([
    loadBestsellers(),
    loadRegisteredBooks()
  ])
})

// 센터 변경 처리
const handleCenterChange = async () => {
  await Promise.all([
    loadBestsellers(),
    loadRegisteredBooks()
  ])
  // 검색 결과는 센터 변경 시 유지 (등록 상태만 업데이트됨)
}

// 검색 실행
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  try {
    searchLoading.value = true
    searchError.value = null
    currentSearchPage.value = 1
    
    const start = (currentSearchPage.value - 1) * 10 + 1
    const result = await searchBooks(searchQuery.value, start, 10)
    
    searchResults.value = result.items || []
    searchTotal.value = result.total || 0
  } catch (error) {
    console.error('도서 검색 오류:', error)
    searchError.value = error.message || '도서 검색에 실패했습니다.'
    searchResults.value = []
    searchTotal.value = 0
  } finally {
    searchLoading.value = false
  }
}

// 검색 초기화
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchTotal.value = 0
  currentSearchPage.value = 1
}

// 검색 페이지 변경
const handleSearchPageChange = async (page) => {
  if (!searchQuery.value.trim()) {
    return
  }

  try {
    searchLoading.value = true
    currentSearchPage.value = page
    const start = (page - 1) * 10 + 1
    const result = await searchBooks(searchQuery.value, start, 10)
    
    searchResults.value = result.items || []
    searchTotal.value = result.total || 0
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('도서 검색 오류:', error)
    searchError.value = error.message || '도서 검색에 실패했습니다.'
  } finally {
    searchLoading.value = false
  }
}

// 베스트셀러 로드
const loadBestsellers = async () => {
  try {
    bestsellersLoading.value = true
    const result = await getBestsellers(10)
    bestsellers.value = result.items || []
  } catch (error) {
    console.error('베스트셀러 로드 오류:', error)
    bestsellers.value = []
  } finally {
    bestsellersLoading.value = false
  }
}

// 등록된 도서 로드 (등록 상태 확인용)
const loadRegisteredBooks = async () => {
  try {
    const books = await getBooksByCenter(currentCenter.value)
    registeredBooks.value = books
  } catch (error) {
    console.error('등록된 도서 로드 오류:', error)
    registeredBooks.value = []
  }
}

// 도서 등록
const handleBookRegister = async (book) => {
  const isbn = book.isbn13 || book.isbn || ''
  if (!isbn) {
    alert('ISBN 정보가 없어 등록할 수 없습니다.')
    return
  }

  if (registeringBooks.value.has(isbn)) {
    return
  }

  try {
    registeringBooks.value.add(isbn)
    await registerBook(book, currentCenter.value, user.value.uid)
    
    // 등록된 도서 목록 새로고침
    await loadRegisteredBooks()
    
    // 성공 메시지
    alert('도서가 성공적으로 등록되었습니다.')
  } catch (error) {
    console.error('도서 등록 오류:', error)
    alert(error.message || '도서 등록에 실패했습니다.')
  } finally {
    registeringBooks.value.delete(isbn)
  }
}

// 페이지 메타데이터
useHead({
  title: '도서 등록 - CNX Library',
  meta: [
    { name: 'description', content: '도서 검색 및 등록' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.books-register-page {
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
      width: 100% !important;
      max-width: 100% !important;
      
      :deep(.v-input) {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  }
}

.search-section {
  margin-top: rem(24);
  
  .search-input {
    width: 100%;
  }
}

.search-results-section {
  padding-top: rem(24);
  border-top: rem(1) solid #e0e0e0;
}

.search-results-header {
  margin-bottom: rem(16);
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

