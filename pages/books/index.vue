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
                총 <strong>{{ totalBookCount }}</strong>권 ({{ groupedBookCount }}종)
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
            v-else-if="filteredGroupedBooks.length > 0"
            class="registered-books-grid mt-6"
          >
            <v-row class="book-list-row">
              <v-col
                v-for="(group, index) in filteredGroupedBooks"
                :key="`group-${index}`"
                cols="12"
                sm="6"
                class="book-list-col"
              >
                <BookCard
                  :book="getGroupDisplayBook(group)"
                  :center="currentCenter"
                  :registered-books="[getGroupDisplayBook(group)]"
                  :is-registered="true"
                  :show-action="false"
                  :selectable="true"
                  :selected="isGroupSelected(group)"
                  :status="getGroupStatus(group)"
                  :show-status-flags="true"
                  :disabled="isGroupUnavailable(group)"
                  :hide-overdue-status="true"
                  :show-rent-button="true"
                  :show-location="true"
                  :locations="group.locations"
                  :show-quantity="group.totalCount > 1"
                  :available-count="group.availableCount"
                  :total-count="group.totalCount"
                  @select="() => handleGroupSelectClick(group)"
                  @rent="() => handleSingleRent(group)"
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

    <!-- 라벨번호 선택 다이얼로그 -->
    <v-dialog
      v-model="labelSelectDialog"
      max-width="450"
      persistent
    >
      <v-card class="label-select-card">
        <v-card-title class="label-select-title">
          대여할 도서 선택
        </v-card-title>
        
        <v-card-text class="label-select-content">
          <div
            v-if="selectedGroup"
            class="book-info-preview mb-4"
          >
            <div class="book-info-preview-inner">
              <img
                v-if="selectedGroup.image"
                :src="selectedGroup.image"
                :alt="selectedGroup.title"
                class="book-thumbnail"
              >
              <div class="book-meta">
                <div class="book-title">
                  {{ selectedGroup.title }}
                </div>
                <div class="book-author">
                  {{ selectedGroup.author }}
                </div>
              </div>
            </div>
          </div>

          <div class="label-select-list">
            <div class="label-select-header mb-2">
              대여 가능한 도서 ({{ availableCopiesForDialog.length }}권)
            </div>
            <div
              v-for="copy in availableCopiesForDialog"
              :key="copy.id"
              class="label-option"
              :class="{ 'selected': selectedLabelNumber === copy.labelNumber }"
              @click="selectLabel(copy)"
            >
              <div class="label-info">
                <div class="label-number">
                  <v-icon
                    size="small"
                    class="mr-1"
                  >
                    mdi-label
                  </v-icon>
                  {{ copy.labelNumber || '라벨없음' }}
                </div>
                <div class="label-location">
                  <v-icon
                    size="small"
                    class="mr-1"
                  >
                    mdi-map-marker
                  </v-icon>
                  {{ formatLocation(copy.location) || '위치없음' }}
                </div>
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

    <!-- 대여 확인 다이얼로그 (위치 안내 포함) -->
    <v-dialog
      v-model="rentConfirmDialog"
      max-width="500"
      persistent
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
            class="book-info-preview mb-4"
          >
            <div class="book-info-preview-inner">
              <img
                v-if="selectedBookForRent.image"
                :src="selectedBookForRent.image"
                :alt="selectedBookForRent.title"
                class="book-thumbnail"
              >
              <div class="book-meta">
                <div class="book-title">
                  {{ selectedBookForRent.title }}
                </div>
                <div class="book-author">
                  {{ selectedBookForRent.author }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="rent-details">
            <div class="detail-item">
              <v-icon
                size="small"
                class="mr-2"
              >
                mdi-label
              </v-icon>
              <span class="detail-label">라벨번호:</span>
              <span class="detail-value">{{ selectedLabelNumber }}</span>
            </div>
            <div class="detail-item">
              <v-icon
                size="small"
                class="mr-2"
              >
                mdi-map-marker
              </v-icon>
              <span class="detail-label">위치:</span>
              <span class="detail-value">{{ formatLocation(selectedLocation) }}</span>
              <v-btn
                v-if="hasLocationImageForCenter"
                variant="text"
                size="small"
                color="primary"
                class="ml-2"
                @click="showLocationPopup"
              >
                위치 보기
              </v-btn>
            </div>
          </div>
          
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            위치와 라벨번호를 확인 후 해당 도서를 가져가주세요.
          </v-alert>
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
            :loading="rentRequestLoading"
            @click="confirmRent"
          >
            대여하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 위치 안내 팝업 -->
    <LocationGuidePopup
      v-model="locationPopupVisible"
      :center="currentCenter"
      :location="selectedLocation"
      :label-number="selectedLabelNumber"
    />
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace, canDirectRent } from '@/utils/centerMapping.js'
import { formatLocation } from '@/utils/labelConfig.js'
import { hasLocationImage } from '@/utils/locationCoordinates.js'

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
  checkAlreadyRentedSameIsbn,
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
const selectedBooks = ref([]) // { isbn, labelNumber, book } 형태
const rentRequestLoading = ref(false)
const MAX_RENT_COUNT = 5

// 현재 대여중인 도서 수
const currentRentedCount = ref(0)

// 라벨번호 선택 다이얼로그 관련
const labelSelectDialog = ref(false)
const selectedGroup = ref(null)
const selectedLabelNumber = ref('')
const selectedLocation = ref('')
const selectedBookForRent = ref(null)
const isDialogForMultiSelect = ref(false)

// 대여 확인 다이얼로그 관련
const rentConfirmDialog = ref(false)

// 위치 안내 팝업
const locationPopupVisible = ref(false)

// 위치 안내 이미지 존재 여부
const hasLocationImageForCenter = computed(() => {
  return hasLocationImage(currentCenter.value)
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
  selectedBooks.value = []
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

// ISBN 기준 그룹핑된 도서 목록
const groupedBooks = computed(() => {
  const groupMap = new Map()
  
  for (const book of registeredBooks.value) {
    const isbn = book.isbn13 || book.isbn || book.id
    
    if (!groupMap.has(isbn)) {
      groupMap.set(isbn, {
        isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        image: book.image,
        copies: [],
        totalCount: 0,
        availableCount: 0,
        locations: []
      })
    }
    
    const group = groupMap.get(isbn)
    group.copies.push(book)
    group.totalCount++
    
    const status = calculateBookStatus(book)
    if (!status) {
      group.availableCount++
      if (book.location && !group.locations.includes(book.location)) {
        group.locations.push(book.location)
      }
    }
  }
  
  // 각 그룹 내 복사본 라벨번호 순 정렬
  for (const group of groupMap.values()) {
    group.copies.sort((a, b) => {
      const labelA = a.labelNumber || ''
      const labelB = b.labelNumber || ''
      return labelA.localeCompare(labelB, 'ko')
    })
  }
  
  return Array.from(groupMap.values())
})

// 필터링 및 정렬된 그룹핑된 도서
const filteredGroupedBooks = computed(() => {
  let groups = [...groupedBooks.value]

  // 검색 필터링
  if (registeredBooksSearchQuery.value.trim()) {
    const query = registeredBooksSearchQuery.value.toLowerCase()
    groups = groups.filter(group => {
      const title = (group.title || '').toLowerCase()
      const author = (group.author || '').toLowerCase()
      const publisher = (group.publisher || '').toLowerCase()
      return title.includes(query) || author.includes(query) || publisher.includes(query)
    })
  }

  // 정렬
  if (sortBy.value === 'title') {
    groups.sort((a, b) => {
      const titleA = (a.title || '').toLowerCase()
      const titleB = (b.title || '').toLowerCase()
      return titleA.localeCompare(titleB, 'ko')
    })
  } else if (sortBy.value === 'date') {
    groups.sort((a, b) => {
      const dateA = a.copies[0]?.registeredAt?.toDate?.() || new Date(0)
      const dateB = b.copies[0]?.registeredAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })
  }

  return groups
})

// 총 도서 수
const totalBookCount = computed(() => registeredBooks.value.length)
const groupedBookCount = computed(() => groupedBooks.value.length)

// 그룹 표시용 도서 정보 반환
const getGroupDisplayBook = (group) => {
  return group.copies[0] || {
    title: group.title,
    author: group.author,
    publisher: group.publisher,
    image: group.image,
    isbn: group.isbn
  }
}

// 그룹 상태 계산
const getGroupStatus = (group) => {
  // 모든 도서가 대여 불가능한 경우
  if (group.availableCount === 0) {
    // 신청중인 도서가 있는지 확인
    const hasRequested = group.copies.some(book => calculateBookStatus(book) === 'requested')
    if (hasRequested) return 'requested'
    return 'rented'
  }
  return null
}

// 그룹 대여 불가 여부
const isGroupUnavailable = (group) => {
  return group.availableCount === 0
}

// 그룹 선택 여부
const isGroupSelected = (group) => {
  return selectedBooks.value.some(item => item.isbn === group.isbn)
}

// 다이얼로그용 대여 가능한 복사본 목록
const availableCopiesForDialog = computed(() => {
  if (!selectedGroup.value) return []
  
  return selectedGroup.value.copies.filter(book => {
    const status = calculateBookStatus(book)
    return !status // available
  })
})

// 그룹 선택 클릭
const handleGroupSelectClick = async (group) => {
  // 이미 선택된 그룹이면 선택 해제
  if (isGroupSelected(group)) {
    selectedBooks.value = selectedBooks.value.filter(item => item.isbn !== group.isbn)
    return
  }
  
  // 대여 가능 여부 체크
  if (!canRentMore.value) {
    await alert(`${MAX_RENT_COUNT}권을 대여중입니다. 대여중인 도서를 반납 후 대여해주세요.`, { type: 'warning' })
    return
  }
  
  if (selectedBooks.value.length >= remainingRentCount.value) {
    await alert(`현재 ${remainingRentCount.value}권까지 추가 대여 가능합니다.`, { type: 'warning' })
    return
  }
  
  // 대여 불가능한 그룹
  if (group.availableCount === 0) {
    await alert('현재 대여 가능한 도서가 없습니다.', { type: 'warning' })
    return
  }
  
  // 같은 ISBN 이미 대여중인지 체크
  const alreadyRented = await checkAlreadyRentedSameIsbn(user.value.uid, group.isbn, currentCenter.value)
  if (alreadyRented) {
    await alert(`이미 같은 도서를 대여중입니다.\n(라벨번호: ${alreadyRented.labelNumber || '-'})`, { type: 'warning' })
    return
  }
  
  // 대여 가능한 복사본이 1개면 바로 선택
  const availableCopies = group.copies.filter(book => !calculateBookStatus(book))
  
  if (availableCopies.length === 1) {
    const book = availableCopies[0]
    selectedBooks.value.push({
      isbn: group.isbn,
      labelNumber: book.labelNumber,
      location: book.location,
      book: book
    })
  } else {
    // 여러 복사본 중 선택
    selectedGroup.value = group
    selectedLabelNumber.value = ''
    selectedLocation.value = ''
    isDialogForMultiSelect.value = true
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
  isDialogForMultiSelect.value = false
}

// 라벨 선택 확인
const confirmLabelSelection = () => {
  if (!selectedGroup.value || !selectedLabelNumber.value) return
  
  if (isDialogForMultiSelect.value) {
    // 다중 선택용: 선택 목록에 추가
    selectedBooks.value.push({
      isbn: selectedGroup.value.isbn,
      labelNumber: selectedLabelNumber.value,
      location: selectedLocation.value,
      book: selectedBookForRent.value
    })
    closeLabelSelectDialog()
  } else {
    // 개별 대여용: 대여 확인 다이얼로그로 이동
    labelSelectDialog.value = false
    rentConfirmDialog.value = true
  }
}

// 개별 도서 대여 처리
const handleSingleRent = async (group) => {
  if (!user.value || !group) return
  
  // 대여 가능 여부 체크
  if (!canRentMore.value) {
    await alert(`${MAX_RENT_COUNT}권을 대여중입니다. 대여중인 도서를 반납 후 대여해주세요.`, { type: 'warning' })
    return
  }
  
  if (group.availableCount === 0) {
    await alert('현재 대여 가능한 도서가 없습니다.', { type: 'warning' })
    return
  }
  
  // 같은 ISBN 이미 대여중인지 체크
  const alreadyRented = await checkAlreadyRentedSameIsbn(user.value.uid, group.isbn, currentCenter.value)
  if (alreadyRented) {
    await alert(`이미 같은 도서를 대여중입니다.\n(라벨번호: ${alreadyRented.labelNumber || '-'})`, { type: 'warning' })
    return
  }
  
  // 대여 가능한 복사본 목록
  const availableCopies = group.copies.filter(book => !calculateBookStatus(book))
  
  if (availableCopies.length === 1) {
    // 복사본이 1개면 바로 대여 확인 다이얼로그
    const book = availableCopies[0]
    selectedGroup.value = group
    selectedLabelNumber.value = book.labelNumber
    selectedLocation.value = book.location
    selectedBookForRent.value = book
    isDialogForMultiSelect.value = false
    rentConfirmDialog.value = true
  } else {
    // 여러 복사본 중 선택
    selectedGroup.value = group
    selectedLabelNumber.value = ''
    selectedLocation.value = ''
    selectedBookForRent.value = null
    isDialogForMultiSelect.value = false
    labelSelectDialog.value = true
  }
}

// 대여 확인 다이얼로그 닫기
const closeRentConfirmDialog = () => {
  rentConfirmDialog.value = false
  selectedGroup.value = null
  selectedLabelNumber.value = ''
  selectedLocation.value = ''
  selectedBookForRent.value = null
}

// 위치 안내 팝업 표시
const showLocationPopup = () => {
  locationPopupVisible.value = true
}

// 대여 확인
const confirmRent = async () => {
  if (!selectedGroup.value || !selectedLabelNumber.value || !selectedBookForRent.value) return
  
  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)
  
  try {
    rentRequestLoading.value = true
    
    if (isDirectRent) {
      await rentBook(selectedLabelNumber.value, currentCenter.value, user.value.uid, selectedGroup.value.isbn)
      
      await Promise.all([
        loadRegisteredBooks(),
        loadCurrentRentedCount()
      ])
      
      closeRentConfirmDialog()
      await alert('도서 대여가 완료되었습니다.', { type: 'success' })
    } else {
      await requestRent(selectedLabelNumber.value, currentCenter.value, user.value.uid, selectedGroup.value.isbn)
      
      await loadRegisteredBooks()
      
      closeRentConfirmDialog()
      await alert('도서 대여가 신청되었습니다.\n관리자 승인 후 대여가 완료됩니다.', { type: 'success' })
    }
  } catch (err) {
    console.error('대여 처리 오류:', err)
    await alert(err.message || '대여 처리에 실패했습니다.', { type: 'error' })
  } finally {
    rentRequestLoading.value = false
  }
}

// 다중 대여 신청 처리
const handleRentRequest = async () => {
  if (selectedBooks.value.length === 0 || !user.value) return

  const isDirectRent = canDirectRent(userWorkplace.value, currentCenter.value)

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

  const bookTitles = selectedBooks.value.map(item => `${item.book.title} (${item.labelNumber})`).join('\n')
  const confirmMessage = isDirectRent 
    ? `다음 도서들을 대여하시겠습니까?\n\n${bookTitles}`
    : `대여 신청하시겠습니까?\n(관리자 승인 후 대여 가능)\n\n${bookTitles}`
  
  if (!await confirm(confirmMessage)) {
    return
  }

  try {
    rentRequestLoading.value = true
    const bookCount = selectedBooks.value.length
    
    if (isDirectRent) {
      for (const item of selectedBooks.value) {
        await rentBook(item.labelNumber, currentCenter.value, user.value.uid, item.isbn)
      }
      
      await Promise.all([
        loadRegisteredBooks(),
        loadCurrentRentedCount()
      ])
      
      await alert(`${bookCount}권의 도서 대여가 완료되었습니다.`, { type: 'success' })
    } else {
      for (const item of selectedBooks.value) {
        await requestRent(item.labelNumber, currentCenter.value, user.value.uid, item.isbn)
      }
      
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
      width: 100%;
      max-width: 100%;
      
      :deep(.v-input) {
        width: 100%;
        max-width: 100%;
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
  
  .sort-select {
    flex: 0 0 30%;
  }
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    
    .registered-search-input,
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

// 라벨 선택 다이얼로그
.label-select-card {
  border-radius: rem(12);
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
  width: rem(50);
  height: rem(70);
  object-fit: cover;
  border-radius: rem(4);
  flex-shrink: 0;
}

.book-meta {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: rem(14);
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  margin-bottom: rem(4);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-author {
  font-size: rem(12);
  color: #666;
}

.label-select-header {
  font-size: rem(14);
  font-weight: 600;
  color: #333;
}

.label-select-list {
  max-height: rem(250);
  overflow-y: auto;
}

.label-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(12);
  border: rem(1) solid #e0e0e0;
  border-radius: rem(8);
  margin-bottom: rem(8);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #002C5B;
    background: #f5f8ff;
  }
  
  &.selected {
    border-color: #002C5B;
    background: #e3f2fd;
  }
}

.label-info {
  display: flex;
  flex-direction: column;
  gap: rem(4);
}

.label-number {
  display: flex;
  align-items: center;
  font-size: rem(14);
  font-weight: 600;
  color: #002C5B;
}

.label-location {
  display: flex;
  align-items: center;
  font-size: rem(12);
  color: #666;
}

.label-select-actions {
  padding: rem(8) rem(24) rem(20);
}

// 대여 확인 다이얼로그
.rent-confirm-card {
  border-radius: rem(12);
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

.rent-confirm-info {
  text-align: center;
  color: #666;
}

.rent-details {
  background: #f5f5f5;
  border-radius: rem(8);
  padding: rem(16);
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: rem(8);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.detail-label {
  font-size: rem(13);
  color: #666;
  margin-right: rem(8);
}

.detail-value {
  font-size: rem(14);
  font-weight: 600;
  color: #002C5B;
}

.rent-confirm-actions {
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
