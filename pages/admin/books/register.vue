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
            placeholder="도서명 또는 ISBN-13으로 검색"
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

        <!-- 검색 로딩 -->
        <div
          v-if="searchLoading"
          class="search-loading-section mb-8"
        >
          <div class="text-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
            />
            <p class="mt-4 text-medium-emphasis">
              검색 중...
            </p>
          </div>
        </div>

        <!-- 검색 결과 없음 -->
        <div
          v-else-if="hasSearched && searchResults.length === 0"
          class="search-empty-section mb-8"
        >
          <div class="text-center py-8 text-medium-emphasis empty-state">
            <v-icon
              size="48"
              color="grey-lighten-1"
              class="mb-4"
            >
              mdi-book-search-outline
            </v-icon>
            <p class="mb-2">
              '<strong>{{ searchQuery }}</strong>'에 대한 검색 결과가 없습니다.
            </p>
            <p class="text-body-2 mb-2">
              ISBN-13으로 다시 검색하거나, 직접 등록해보세요.
            </p>
            <p class="text-body-2 text-grey mb-4">
              ISBN을 모르시면 아래 버튼을 통해 조회할 수 있습니다.
            </p>
            <div class="empty-actions">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                href="https://isbnsearch.org/"
                target="_blank"
              >
                ISBN 조회하기
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                @click="openManualRegisterDialog"
              >
                직접 등록하기
              </v-btn>
            </div>
          </div>
        </div>

        <!-- 검색 결과 영역 -->
        <div
          v-else-if="searchResults.length > 0"
          class="search-results-section mb-8"
        >
          <div class="search-results-header mb-4">
            <div class="text-body-1">
              <template v-if="searchTotal >= 10">
                검색 결과가 많습니다. (현재 <strong>{{ searchResults.length }}</strong>개 표시 중)
              </template>
              <template v-else>
                총 <strong>{{ searchResults.length }}</strong>개의 검색 결과
              </template>
            </div>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              href="https://isbnsearch.org/"
              target="_blank"
            >
              ISBN 조회하기
            </v-btn>
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
                :requested-books="bookRequests"
                :selectable="false"
                :show-action="true"
                :allow-register-requested="true"
                :allow-additional-register="true"
                @register="openRegisterDialog"
              />
            </v-col>
          </v-row>
          
          <div
            v-if="hasMoreResults"
            class="d-flex justify-center mt-6"
          >
            <v-btn
              variant="outlined"
              color="primary"
              @click="handleLoadMore"
            >
              더보기
            </v-btn>
          </div>
        </div>

        <!-- 베스트셀러 영역 -->
        <BookListSwiper
          :books="bestsellers"
          :center="currentCenter"
          :registered-books="registeredBooks"
          :requested-books="bookRequests"
          :title="'베스트셀러'"
          :loading="bestsellersLoading"
          :empty-message="'베스트셀러를 불러올 수 없습니다.'"
          :allow-register-requested="true"
          :allow-additional-register="true"
          nav-id="bestseller"
          class="mb-8"
          @register="openRegisterDialog"
        />

        <!-- 도서 신청 목록 영역 -->
        <div class="book-requests-section">
          <div class="book-requests-header mb-4">
            <h2 class="section-title mb-0">
              도서 신청 목록
            </h2>
            <div
              v-if="bookRequests.length > 0"
              class="text-body-2 text-medium-emphasis mt-2"
            >
              총 <strong>{{ bookRequestsTotal }}</strong>건의 신청
            </div>
          </div>

          <div
            v-if="bookRequestsLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-else-if="paginatedBookRequests.length > 0"
            class="book-requests-grid"
          >
            <v-row class="book-list-row">
              <v-col
                v-for="(request, index) in paginatedBookRequests"
                :key="`request-${index}`"
                cols="12"
                sm="6"
                class="book-list-col"
              >
                <BookCard
                  :book="request"
                  :center="currentCenter"
                  :registered-books="registeredBooks"
                  :selectable="false"
                  :show-action="true"
                  :action-button-text="`${currentCenter}에 등록하기`"
                  :requester-info="getRequesterInfo(request)"
                  @register="openRegisterDialogFromRequest"
                />
              </v-col>
            </v-row>
            
            <div
              v-if="bookRequestsTotalPages > 1"
              class="d-flex justify-center mt-6"
            >
              <v-pagination
                v-model="currentBookRequestsPage"
                :length="bookRequestsTotalPages"
                :total-visible="7"
              />
            </div>
          </div>
          <div
            v-else
            class="text-center py-8 text-medium-emphasis"
          >
            신청된 도서가 없습니다.
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

    <!-- 도서 등록 다이얼로그 -->
    <v-dialog
      v-model="registerDialogVisible"
      max-width="600"
    >
      <v-card class="register-dialog-card">
        <v-card-title class="register-dialog-title">
          도서 등록
        </v-card-title>
        
        <v-card-text class="register-dialog-content">
          <!-- 도서 정보 표시 -->
          <div
            v-if="selectedBook"
            class="book-info-preview mb-6"
          >
            <div class="book-info-preview-inner">
              <img
                v-if="selectedBook.cover || selectedBook.image"
                :src="selectedBook.cover || selectedBook.image"
                :alt="selectedBook.title"
                class="book-thumbnail"
              >
              <div
                v-else
                class="book-thumbnail-placeholder"
              >
                <span>No Image</span>
              </div>
              <div class="book-meta">
                <div class="book-title">
                  {{ selectedBook.title }}
                </div>
                <div
                  v-if="selectedBook.author"
                  class="book-author"
                >
                  <strong>저자:</strong> {{ selectedBook.author }}
                </div>
                <div
                  v-if="selectedBook.publisher"
                  class="book-publisher"
                >
                  <strong>출판사:</strong> {{ selectedBook.publisher }}
                </div>
              </div>
            </div>
          </div>

          <!-- 카테고리 선택 -->
          <div class="category-section mb-4">
            <div class="category-header mb-1">
              <a
                href="#"
                class="category-manage-link"
                @click.prevent="handleCategoryManageClick"
              >
                카테고리 관리
              </a>
            </div>
            <v-select
              v-model="registerForm.category"
              :items="categoryOptions"
              label="카테고리 *"
              variant="outlined"
              density="comfortable"
              :loading="categoriesLoading"
              :rules="[v => !!v || '카테고리를 선택해주세요']"
            />
          </div>

          <!-- 권수 입력 -->
          <div class="quantity-section mb-4">
            <v-text-field
              v-model.number="registerForm.quantity"
              label="등록 권수"
              variant="outlined"
              density="comfortable"
              type="number"
              min="1"
              max="20"
              :rules="[v => v >= 1 && v <= 20 || '1~20권까지 등록 가능합니다']"
              hint="같은 도서를 여러 권 등록할 수 있습니다"
              persistent-hint
              @update:model-value="handleQuantityChange"
            />
          </div>

          <!-- 라벨번호 및 위치 입력 (권수에 따라 동적 생성) -->
          <div class="copies-section">
            <div
              v-for="(copy, index) in registerForm.copies"
              :key="index"
              class="copy-entry mb-4"
            >
              <div class="copy-header mb-2">
                <span class="copy-number">{{ index + 1 }}권</span>
                <span
                  v-if="copy.labelPreview"
                  class="copy-label-preview"
                >
                  {{ copy.labelPreview }}
                </span>
              </div>
              <div class="copy-inputs">
                <v-text-field
                  :model-value="centerCode"
                  label="센터코드"
                  variant="outlined"
                  density="compact"
                  readonly
                  disabled
                  class="center-code-input"
                />
                <v-text-field
                  v-model="copy.fourDigits"
                  label="4자리 번호 *"
                  variant="outlined"
                  density="compact"
                  maxlength="4"
                  :rules="fourDigitsRules"
                  :error-messages="copy.error"
                  hint="0001~9999"
                  persistent-hint
                  class="four-digits-input"
                  @input="(e) => handleCopyFourDigitsInput(e, index)"
                  @blur="() => checkCopyLabelNumberDuplicate(index)"
                />
                <v-select
                  v-model="copy.location"
                  :items="locationOptions"
                  label="위치 *"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '위치를 선택해주세요']"
                  class="location-select"
                />
              </div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="register-dialog-actions">
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
            :loading="registering"
            :disabled="!isRegisterFormValid"
            @click="handleRegisterBook"
          >
            {{ registerForm.quantity > 1 ? `${registerForm.quantity}권 등록` : '등록' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 직접 등록 다이얼로그 -->
    <v-dialog
      v-model="manualRegisterDialog"
      max-width="600"
    >
      <v-card class="register-dialog-card">
        <v-card-title class="register-dialog-title">
          도서 직접 등록
        </v-card-title>
        
        <v-card-text class="register-dialog-content">
          <!-- 도서 정보 입력 -->
          <div class="manual-book-info-section mb-4">
            <div class="manual-section-title mb-2">
              도서 정보
            </div>
            <v-text-field
              v-model="manualForm.title"
              label="도서명 *"
              variant="outlined"
              density="compact"
              :hide-details="!manualForm.title || manualForm.title.length > 0 ? 'auto' : false"
              class="manual-input"
            />
            <v-text-field
              v-model="manualForm.author"
              label="저자"
              variant="outlined"
              density="compact"
              hide-details
              class="manual-input"
            />
            <v-text-field
              v-model="manualForm.publisher"
              label="출판사"
              variant="outlined"
              density="compact"
              hide-details
              class="manual-input"
            />
            <div class="isbn-input-row">
              <v-text-field
                v-model="manualForm.isbn"
                label="ISBN *"
                variant="outlined"
                density="compact"
                :hide-details="!manualForm.isbn || manualForm.isbn.length > 0 ? 'auto' : false"
                class="isbn-input"
              />
              <v-btn
                variant="outlined"
                size="small"
                color="primary"
                href="https://isbnsearch.org/"
                target="_blank"
                class="isbn-lookup-btn"
              >
                ISBN 조회
              </v-btn>
            </div>
            <div class="manual-info-notice">
              <v-icon
                size="small"
                class="mr-1"
              >
                mdi-information-outline
              </v-icon>
              표지 이미지는 기본 이미지로 대체됩니다.
            </div>
          </div>

          <!-- 카테고리 선택 -->
          <div class="category-section mb-4">
            <div class="category-header mb-1">
              <a
                href="#"
                class="category-manage-link"
                @click.prevent="handleCategoryManageClick"
              >
                카테고리 관리
              </a>
            </div>
            <v-select
              v-model="manualForm.category"
              :items="categoryOptions"
              label="카테고리 *"
              variant="outlined"
              density="comfortable"
              :loading="categoriesLoading"
            />
          </div>

          <!-- 권수 입력 -->
          <div class="quantity-section mb-4">
            <v-text-field
              v-model.number="manualForm.quantity"
              label="등록 권수"
              variant="outlined"
              density="comfortable"
              type="number"
              min="1"
              max="20"
              hint="같은 도서를 여러 권 등록할 수 있습니다"
              persistent-hint
              @update:model-value="handleManualQuantityChange"
            />
          </div>

          <!-- 라벨번호 및 위치 입력 -->
          <div class="copies-section">
            <div
              v-for="(copy, index) in manualForm.copies"
              :key="index"
              class="copy-entry mb-4"
            >
              <div class="copy-header mb-2">
                <span class="copy-number">{{ index + 1 }}권</span>
                <span
                  v-if="copy.labelPreview"
                  class="copy-label-preview"
                >
                  {{ copy.labelPreview }}
                </span>
              </div>
              <div class="copy-inputs">
                <v-text-field
                  :model-value="centerCode"
                  label="센터코드"
                  variant="outlined"
                  density="compact"
                  readonly
                  disabled
                  class="center-code-input"
                />
                <v-text-field
                  v-model="copy.fourDigits"
                  label="4자리 번호 *"
                  variant="outlined"
                  density="compact"
                  maxlength="4"
                  :rules="fourDigitsRules"
                  :error-messages="copy.error"
                  hint="0001~9999"
                  persistent-hint
                  class="four-digits-input"
                  @input="(e) => handleManualCopyFourDigitsInput(e, index)"
                  @blur="() => checkManualCopyLabelNumberDuplicate(index)"
                />
                <v-select
                  v-model="copy.location"
                  :items="locationOptions"
                  label="위치 *"
                  variant="outlined"
                  density="compact"
                  class="location-select"
                />
              </div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="register-dialog-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeManualRegisterDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="manualRegistering"
            :disabled="!isManualFormValid"
            @click="handleManualRegisterBook"
          >
            {{ manualForm.quantity > 1 ? `${manualForm.quantity}권 등록` : '등록' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'
import { CENTER_CODE_MAP, createLabelNumber, getLocationSelectOptions } from '@/utils/labelConfig.js'

definePageMeta({
  layout: false,
  middleware: 'admin'
})

const { user } = useAuth()
const { 
  searchBooks, 
  registerBookWithLabel,
  getBooksByCenter, 
  getBestsellers,
  getCategories,
  checkLabelNumberExists,
  loading: booksLoading 
} = useBooks()
const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

// 센터 관련
const centerOptions = [...CENTERS]
const currentCenter = ref('')
const userWorkplace = ref('')

// 검색 관련
const searchQuery = ref('')
const allSearchResults = ref([])
const displayCount = ref(10)
const searchLoading = ref(false)
const searchError = ref(null)
const hasSearched = ref(false)

const searchResults = computed(() => allSearchResults.value.slice(0, displayCount.value))
const searchTotal = computed(() => allSearchResults.value.length)
const hasMoreResults = computed(() => displayCount.value < allSearchResults.value.length)

// 베스트셀러 관련
const bestsellers = ref([])
const bestsellersLoading = ref(false)

// 등록된 도서 관련
const registeredBooks = ref([])

// 등록 처리 중인 도서
const registeringBooks = ref(new Set())

// 도서 신청 목록 관련
const bookRequests = ref([])
const requesterInfoCache = ref({})
const bookRequestsLoading = ref(false)
const currentBookRequestsPage = ref(1)
const REQUESTS_PER_PAGE = 4
const bookRequestsTotal = computed(() => bookRequests.value.length)
const bookRequestsTotalPages = computed(() => Math.ceil(bookRequestsTotal.value / REQUESTS_PER_PAGE))
const paginatedBookRequests = computed(() => {
  const start = (currentBookRequestsPage.value - 1) * REQUESTS_PER_PAGE
  const end = start + REQUESTS_PER_PAGE
  return bookRequests.value.slice(start, end)
})

// 등록 다이얼로그 관련
const registerDialogVisible = ref(false)
const selectedBook = ref(null)
const selectedRequestInfo = ref(null)
const registering = ref(false)
const categoryOptions = ref([])
const categoriesLoading = ref(false)
const labelCheckLoading = ref(false)

const registerForm = ref({
  category: '',
  quantity: 1,
  copies: [{ fourDigits: '', location: '구매칸' }]
})

// 직접 등록 다이얼로그 관련
const manualRegisterDialog = ref(false)
const manualRegistering = ref(false)
const manualForm = ref({
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  category: '',
  quantity: 1,
  copies: [{ fourDigits: '', location: '구매칸', error: '', labelPreview: '' }]
})

// 센터 코드
const centerCode = computed(() => {
  return CENTER_CODE_MAP[currentCenter.value] || '1'
})

// 카테고리 관리 클릭 핸들러
const handleCategoryManageClick = async () => {
  await alert('카테고리 관리 기능은 준비 중입니다.', { type: 'info' })
}

// 위치 옵션
const locationOptions = computed(() => getLocationSelectOptions())

// 4자리 입력 규칙
const fourDigitsRules = [
  v => !!v || '4자리 번호를 입력해주세요',
  v => /^\d{1,4}$/.test(v) || '숫자만 입력해주세요',
  v => v.length === 4 || '4자리를 입력해주세요'
]

// 각 권의 라벨번호 미리보기 업데이트
const updateLabelPreviews = () => {
  registerForm.value.copies.forEach((copy) => {
    if (registerForm.value.category && copy.fourDigits && copy.fourDigits.length === 4) {
      copy.labelPreview = createLabelNumber(registerForm.value.category, currentCenter.value, copy.fourDigits)
    } else {
      copy.labelPreview = ''
    }
  })
}

// 카테고리 변경 감시
watch(() => registerForm.value.category, () => {
  updateLabelPreviews()
})

// 등록 폼 유효성
const isRegisterFormValid = computed(() => {
  // 카테고리 체크
  if (!registerForm.value.category) return false
  
  // 수량 체크
  if (!registerForm.value.quantity || registerForm.value.quantity < 1) return false
  
  // 각 권의 유효성 체크
  for (const copy of registerForm.value.copies) {
    // 4자리 번호 체크
    if (!copy.fourDigits || copy.fourDigits.length !== 4 || !/^\d{4}$/.test(copy.fourDigits)) {
      return false
    }
    // 위치 체크
    if (!copy.location) return false
    // 에러 체크
    if (copy.error) return false
  }
  
  // 라벨번호 중복 체크 진행 중
  if (labelCheckLoading.value) return false
  
  return true
})

// 직접 등록 폼 유효성
const isManualFormValid = computed(() => {
  if (!manualForm.value.title) return false
  if (!manualForm.value.isbn) return false
  if (!manualForm.value.category) return false
  if (!manualForm.value.quantity || manualForm.value.quantity < 1) return false
  
  for (const copy of manualForm.value.copies) {
    if (!copy.fourDigits || copy.fourDigits.length !== 4 || !/^\d{4}$/.test(copy.fourDigits)) {
      return false
    }
    if (!copy.location) return false
    if (copy.error) return false
  }
  
  if (labelCheckLoading.value) return false
  
  return true
})

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
  currentCenter.value = workplace ? getCenterByWorkplace(workplace) : centerOptions[0]
  
  await Promise.all([
    loadBestsellers(),
    loadRegisteredBooks(),
    loadBookRequests()
  ])
})

// 센터 변경 처리
const handleCenterChange = async () => {
  currentBookRequestsPage.value = 1
  await Promise.all([
    loadBestsellers(),
    loadRegisteredBooks(),
    loadBookRequests()
  ])
}

// 검색 실행
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  try {
    searchLoading.value = true
    searchError.value = null
    displayCount.value = 10
    hasSearched.value = true
    
    const result = await searchBooks(searchQuery.value)
    
    allSearchResults.value = result.items || []
  } catch (error) {
    console.error('도서 검색 오류:', error)
    searchError.value = error.message || '도서 검색에 실패했습니다.'
    allSearchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// 검색 초기화
const clearSearch = () => {
  searchQuery.value = ''
  allSearchResults.value = []
  displayCount.value = 10
  hasSearched.value = false
}

// 더보기
const handleLoadMore = () => {
  displayCount.value += 10
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

// 등록된 도서 로드
const loadRegisteredBooks = async () => {
  try {
    const books = await getBooksByCenter(currentCenter.value)
    registeredBooks.value = books
  } catch (error) {
    console.error('등록된 도서 로드 오류:', error)
    registeredBooks.value = []
  }
}

// 도서 신청 목록 로드
const loadBookRequests = async () => {
  try {
    bookRequestsLoading.value = true
    
    if (!firestore) {
      bookRequests.value = []
      return
    }
    
    const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore')
    const requestsRef = collection(firestore, 'bookRequests')
    const q = query(
      requestsRef,
      where('center', '==', currentCenter.value),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(q)
    const requests = []
    
    snapshot.forEach((docSnapshot) => {
      requests.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      })
    })
    
    requests.sort((a, b) => {
      const dateA = a.requestedAt?.toDate?.() || new Date(0)
      const dateB = b.requestedAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })
    
    bookRequests.value = requests
    
    // 신청자 정보 로드
    const userIds = [...new Set(requests.filter(r => r.requestedBy).map(r => r.requestedBy))]
    for (const requestedBy of userIds) {
      if (requesterInfoCache.value[requestedBy]) continue
      
      try {
        const userRef = doc(firestore, 'users', requestedBy)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const emailId = (userData.email || '').split('@')[0]
          const name = userData.name || ''
          const workplace = userData.workplace || ''
          
          requesterInfoCache.value[requestedBy] = `${workplace} ${name}(${emailId})`
        }
      } catch (error) {
        console.error('신청자 정보 로드 오류:', error)
      }
    }
  } catch (error) {
    console.error('도서 신청 목록 로드 오류:', error)
    bookRequests.value = []
  } finally {
    bookRequestsLoading.value = false
  }
}

// 신청자 정보 반환
const getRequesterInfo = (request) => {
  if (!request.requestedBy) return ''
  return requesterInfoCache.value[request.requestedBy] || ''
}

// 카테고리 목록 로드
const loadCategories = async () => {
  try {
    categoriesLoading.value = true
    const categories = await getCategories(currentCenter.value)
    categoryOptions.value = categories
  } catch (error) {
    console.error('카테고리 로드 오류:', error)
    categoryOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}


// 권수 변경 핸들러
const handleQuantityChange = (newQuantity) => {
  const qty = Math.max(1, Math.min(20, newQuantity || 1))
  const currentCopies = registerForm.value.copies
  
  if (qty > currentCopies.length) {
    // 권수 증가 - 새로운 항목 추가
    for (let i = currentCopies.length; i < qty; i++) {
      currentCopies.push({ fourDigits: '', location: '구매칸', error: '', labelPreview: '' })
    }
  } else if (qty < currentCopies.length) {
    // 권수 감소 - 뒤에서 삭제
    registerForm.value.copies = currentCopies.slice(0, qty)
  }
  
  registerForm.value.quantity = qty
}

// 각 권의 4자리 입력 핸들러
const handleCopyFourDigitsInput = (e, index) => {
  // 숫자만 허용
  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
  registerForm.value.copies[index].fourDigits = value
  registerForm.value.copies[index].error = ''
  updateLabelPreviews()
}

// 각 권의 라벨번호 중복 체크
const checkCopyLabelNumberDuplicate = async (index) => {
  const copy = registerForm.value.copies[index]
  
  if (!registerForm.value.category || !copy.fourDigits || copy.fourDigits.length !== 4) {
    return
  }
  
  try {
    labelCheckLoading.value = true
    const labelNumber = createLabelNumber(registerForm.value.category, currentCenter.value, copy.fourDigits)
    
    // DB에서 중복 체크
    const exists = await checkLabelNumberExists(labelNumber, currentCenter.value)
    
    if (exists) {
      copy.error = '이미 사용중인 라벨번호입니다.'
      return
    }
    
    // 같은 폼 내에서 중복 체크
    for (let i = 0; i < registerForm.value.copies.length; i++) {
      if (i !== index) {
        const otherCopy = registerForm.value.copies[i]
        if (otherCopy.fourDigits === copy.fourDigits) {
          copy.error = '동일한 라벨번호가 이미 입력되어 있습니다.'
          return
        }
      }
    }
    
    copy.error = ''
  } catch (error) {
    console.error('라벨번호 중복 체크 오류:', error)
  } finally {
    labelCheckLoading.value = false
  }
}

// 등록 다이얼로그 열기
const openRegisterDialog = async (book) => {
  selectedBook.value = book
  selectedRequestInfo.value = null
  
  // 폼 초기화
  registerForm.value = {
    category: '',
    quantity: 1,
    copies: [{ fourDigits: '', location: '구매칸', error: '', labelPreview: '' }]
  }
  
  // 카테고리 로드
  await loadCategories()
  
  registerDialogVisible.value = true
}

// 신청 목록에서 등록 다이얼로그 열기
const openRegisterDialogFromRequest = async (book) => {
  selectedBook.value = book
  selectedRequestInfo.value = book
  
  // 폼 초기화
  registerForm.value = {
    category: '',
    quantity: 1,
    copies: [{ fourDigits: '', location: '구매칸', error: '', labelPreview: '' }]
  }
  
  // 카테고리 로드
  await loadCategories()
  
  registerDialogVisible.value = true
}

// 등록 다이얼로그 닫기
const closeRegisterDialog = () => {
  registerDialogVisible.value = false
  selectedBook.value = null
  selectedRequestInfo.value = null
}

// 직접 등록 다이얼로그 열기
const openManualRegisterDialog = async () => {
  manualForm.value = {
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    category: '',
    quantity: 1,
    copies: [{ fourDigits: '', location: '구매칸', error: '', labelPreview: '' }]
  }
  await loadCategories()
  manualRegisterDialog.value = true
}

// 직접 등록 다이얼로그 닫기
const closeManualRegisterDialog = () => {
  manualRegisterDialog.value = false
}

// 직접 등록 수량 변경 핸들러
const handleManualQuantityChange = (value) => {
  const newQuantity = Math.max(1, Math.min(20, parseInt(value) || 1))
  const currentCopies = manualForm.value.copies
  
  if (newQuantity > currentCopies.length) {
    for (let i = currentCopies.length; i < newQuantity; i++) {
      currentCopies.push({ fourDigits: '', location: '구매칸', error: '', labelPreview: '' })
    }
  } else if (newQuantity < currentCopies.length) {
    currentCopies.splice(newQuantity)
  }
  
  manualForm.value.quantity = newQuantity
  updateManualLabelPreviews()
}

// 직접 등록 라벨번호 미리보기 업데이트
const updateManualLabelPreviews = () => {
  manualForm.value.copies.forEach((copy) => {
    if (manualForm.value.category && copy.fourDigits && copy.fourDigits.length === 4) {
      copy.labelPreview = createLabelNumber(manualForm.value.category, currentCenter.value, copy.fourDigits)
    } else {
      copy.labelPreview = ''
    }
  })
}

// 직접 등록 카테고리 변경 감시
watch(() => manualForm.value.category, () => {
  updateManualLabelPreviews()
})

// 직접 등록 4자리 입력 핸들러
const handleManualCopyFourDigitsInput = (event, index) => {
  const value = event.target.value.replace(/[^0-9]/g, '')
  manualForm.value.copies[index].fourDigits = value
  manualForm.value.copies[index].error = ''
  updateManualLabelPreviews()
}

// 직접 등록 라벨번호 중복 체크
const checkManualCopyLabelNumberDuplicate = async (index) => {
  const copy = manualForm.value.copies[index]
  
  if (!copy.fourDigits || copy.fourDigits.length !== 4 || !manualForm.value.category) {
    return
  }
  
  const labelNumber = createLabelNumber(manualForm.value.category, currentCenter.value, copy.fourDigits)
  
  const duplicateInForm = manualForm.value.copies.some((c, i) => 
    i !== index && c.fourDigits === copy.fourDigits
  )
  
  if (duplicateInForm) {
    copy.error = '폼 내에서 중복된 라벨번호입니다.'
    return
  }
  
  try {
    labelCheckLoading.value = true
    const exists = await checkLabelNumberExists(labelNumber, currentCenter.value)
    if (exists) {
      copy.error = '이미 사용중인 라벨번호입니다.'
    } else {
      copy.error = ''
    }
  } catch (err) {
    console.error('라벨번호 중복 체크 오류:', err)
  } finally {
    labelCheckLoading.value = false
  }
}

// 직접 등록 처리
const handleManualRegisterBook = async () => {
  if (!isManualFormValid.value) {
    return
  }
  
  const isbn = manualForm.value.isbn.trim()
  
  try {
    manualRegistering.value = true
    
    const bookData = {
      title: manualForm.value.title.trim(),
      author: manualForm.value.author.trim(),
      publisher: manualForm.value.publisher.trim(),
      isbn13: isbn.length === 13 ? isbn : '',
      isbn: isbn.length === 10 ? isbn : isbn,
      image: '',
      cover: ''
    }
    
    const registeredLabelNumbers = []
    
    for (const copy of manualForm.value.copies) {
      const labelNumber = createLabelNumber(manualForm.value.category, currentCenter.value, copy.fourDigits)
      
      await registerBookWithLabel(
        bookData,
        currentCenter.value,
        user.value.uid,
        manualForm.value.category,
        labelNumber,
        copy.location
      )
      
      registeredLabelNumbers.push(labelNumber)
    }
    
    await loadRegisteredBooks()
    closeManualRegisterDialog()
    
    if (registeredLabelNumbers.length === 1) {
      await alert(`도서가 성공적으로 등록되었습니다.\n라벨번호: ${registeredLabelNumbers[0]}`, { type: 'success' })
    } else {
      await alert(`${registeredLabelNumbers.length}권의 도서가 성공적으로 등록되었습니다.\n라벨번호:\n${registeredLabelNumbers.join('\n')}`, { type: 'success' })
    }
  } catch (error) {
    console.error('도서 직접 등록 오류:', error)
    await alert(error.message || '도서 등록에 실패했습니다.', { type: 'error' })
  } finally {
    manualRegistering.value = false
  }
}

// 도서 등록
const handleRegisterBook = async () => {
  if (!selectedBook.value || !isRegisterFormValid.value) {
    return
  }
  
  const book = selectedBook.value
  const isbn = book.isbn13 || book.isbn || ''
  
  if (!isbn) {
    await alert('ISBN 정보가 없어 등록할 수 없습니다.', { type: 'error' })
    return
  }

  if (registeringBooks.value.has(isbn)) {
    return
  }

  try {
    registering.value = true
    registeringBooks.value.add(isbn)
    
    const registeredLabelNumbers = []
    
    // 각 권을 순차적으로 등록
    for (const copy of registerForm.value.copies) {
      const labelNumber = createLabelNumber(registerForm.value.category, currentCenter.value, copy.fourDigits)
      
      await registerBookWithLabel(
        book,
        currentCenter.value,
        user.value.uid,
        registerForm.value.category,
        labelNumber,
        copy.location
      )
      
      registeredLabelNumbers.push(labelNumber)
    }
    
    // 신청된 도서인지 확인하고 처리
    const matchingRequest = selectedRequestInfo.value || bookRequests.value.find(req => {
      const reqIsbn = req.isbn13 || req.isbn || ''
      return reqIsbn === isbn
    })
    
    if (matchingRequest && firestore) {
      const { doc, updateDoc, serverTimestamp, addDoc, collection } = await import('firebase/firestore')
      
      // 신청 상태 업데이트
      const requestRef = doc(firestore, 'bookRequests', matchingRequest.id)
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user.value.uid
      })
      
      // 신청자에게 알림 발송
      if (matchingRequest.requestedBy) {
        const notificationsRef = collection(firestore, 'notifications')
        await addDoc(notificationsRef, {
          userId: matchingRequest.requestedBy,
          type: 'book_registered',
          title: '신청 도서 등록 완료',
          message: `신청하신 도서 "${book.title}"이(가) ${currentCenter.value}에 등록되었습니다.`,
          bookTitle: book.title,
          bookIsbn: isbn,
          center: currentCenter.value,
          isRead: false,
          createdAt: serverTimestamp()
        })
      }
      
      // 로컬 상태에서 신청 목록 제거
      bookRequests.value = bookRequests.value.filter(req => req.id !== matchingRequest.id)
    }
    
    // 등록된 도서 목록 새로고침
    await loadRegisteredBooks()
    
    // 다이얼로그 닫기
    closeRegisterDialog()
    
    // 성공 메시지
    if (registeredLabelNumbers.length === 1) {
      await alert(`도서가 성공적으로 등록되었습니다.\n라벨번호: ${registeredLabelNumbers[0]}`, { type: 'success' })
    } else {
      await alert(`${registeredLabelNumbers.length}권의 도서가 성공적으로 등록되었습니다.\n라벨번호:\n${registeredLabelNumbers.join('\n')}`, { type: 'success' })
    }
  } catch (error) {
    console.error('도서 등록 오류:', error)
    await alert(error.message || '도서 등록에 실패했습니다.', { type: 'error' })
  } finally {
    registering.value = false
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: rem(16);
  margin-bottom: rem(16);
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: rem(12);
}

.manual-section-title {
  font-size: rem(14);
  font-weight: 600;
  color: #002C5B;
}

.manual-book-info-section {
  background: #f5f5f5;
  border-radius: rem(8);
  padding: rem(16);
}

.manual-input {
  margin-bottom: rem(8);
}

.isbn-input-row {
  display: flex;
  align-items: flex-start;
  gap: rem(8);
  margin-bottom: rem(8);
  
  .isbn-input {
    flex: 1;
  }
  
  .isbn-lookup-btn {
    flex-shrink: 0;
    height: rem(40);
  }
}

.manual-info-notice {
  display: flex;
  align-items: center;
  font-size: rem(12);
  color: #666;
  margin-top: rem(8);
}

.section-title {
  font-size: rem(24);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: rem(20);
  }
  
  @media (max-width: 480px) {
    font-size: rem(18);
  }
}

.book-requests-section {
  padding-top: rem(24);
  border-top: rem(1) solid #e0e0e0;
}

.book-requests-header {
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

// 등록 다이얼로그
.register-dialog-card {
  border-radius: rem(12);
}

.register-dialog-title {
  font-size: rem(20);
  font-weight: 600;
  color: #002C5B;
  padding: rem(20) rem(24) rem(8);
}

.register-dialog-content {
  padding: rem(16) rem(24) rem(8);
}

.book-info-preview {
  background: #f5f5f5;
  border-radius: rem(8);
  padding: rem(12);
}

.book-info-preview-inner {
  display: flex;
  gap: rem(12);
  align-items: flex-start;
}

.book-thumbnail {
  width: rem(80);
  height: rem(110);
  object-fit: cover;
  border-radius: rem(4);
  flex-shrink: 0;
}

.book-thumbnail-placeholder {
  width: rem(80);
  height: rem(110);
  background-color: #666;
  border-radius: rem(4);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  span {
    color: #fff;
    font-size: rem(11);
    font-weight: 500;
  }
}

.book-meta {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: rem(14);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.3;
  margin-bottom: rem(6);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-author {
  font-size: rem(12);
  color: #666;
  margin-bottom: rem(2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-publisher {
  font-size: rem(12);
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 카테고리 섹션
.category-section {
  .category-header {
    display: flex;
    justify-content: flex-end;
  }
  
  .category-manage-link {
    font-size: rem(13);
    color: #666;
    text-decoration: none;
    
    &:hover {
      color: #002C5B;
      text-decoration: underline;
    }
  }
}

// 권수 입력
.quantity-section {
  margin-bottom: rem(16);
}

// 복수 등록 섹션
.copies-section {
  max-height: rem(400);
  overflow-y: auto;
  padding-right: rem(4);
}

.copy-entry {
  background: #fafafa;
  border-radius: rem(8);
  padding: rem(16);
  border: rem(1) solid #e8e8e8;
  
  &:not(:last-child) {
    margin-bottom: rem(12);
  }
}

.copy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: rem(8);
}

.copy-number {
  font-size: rem(14);
  font-weight: 600;
  color: #002C5B;
  background: #e3f2fd;
  padding: rem(4) rem(10);
  border-radius: rem(4);
}

.copy-label-preview {
  font-size: rem(13);
  color: #666;
  font-family: monospace;
  background: #fff;
  padding: rem(4) rem(8);
  border-radius: rem(4);
  border: rem(1) solid #ddd;
}

.copy-inputs {
  display: flex;
  gap: rem(12);
  align-items: flex-start;
  flex-wrap: wrap;
}

.center-code-input {
  flex: 0 0 rem(90);
  min-width: rem(80);
}

.four-digits-input {
  flex: 1;
  min-width: rem(120);
}

.location-select {
  flex: 0 0 rem(130);
  min-width: rem(110);
}

@media (max-width: 500px) {
  .copy-inputs {
    flex-direction: column;
    gap: rem(8);
    
    .center-code-input,
    .four-digits-input,
    .location-select {
      flex: 0 0 auto;
      width: 100%;
    }
  }
}

.register-dialog-actions {
  padding: rem(8) rem(24) rem(20);
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

