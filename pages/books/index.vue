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
                placeholder="도서명 또는 ISBN-13으로 검색"
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
                v-for="(group, index) in displayedGroupedBooks"
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
                  :selectable="!isGroupUnavailable(group)"
                  :selected="isGroupSelected(group)"
                  :status="getGroupStatus(group)"
                  :show-status-flags="true"
                  :disabled="false"
                  :hide-overdue-status="true"
                  :show-rent-button="true"
                  :show-quantity="group.totalCount > 1"
                  :available-count="group.availableCount"
                  :total-count="group.totalCount"
                  :show-return-notify-button="isGroupUnavailable(group) && !isMyRentedIsbn(group.isbn)"
                  :is-subscribed-to-return="isSubscribedToBook(group.isbn)"
                  :return-notify-loading="returnNotifyLoadingIsbn === group.isbn"
                  @select="() => handleGroupSelectClick(group)"
                  @rent="() => handleSingleRent(group)"
                  @subscribe-return-notify="() => handleSubscribeReturnNotify(group)"
                />
              </v-col>
            </v-row>
            
            <!-- 페이지네이션 -->
            <div
              v-if="totalPages > 1"
              class="pagination-section"
            >
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="5"
                density="compact"
                size="small"
                class="pagination"
              />
            </div>
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
      
      <!-- 하단 고정 대여 신청 바 -->
      <Transition name="slide-up">
        <div
          v-if="selectedBooks.length > 0"
          class="sticky-rent-bar"
        >
          <div class="sticky-rent-info">
            <span class="selected-count">{{ selectedBooks.length }}권 선택</span>
            <span class="rent-status">({{ remainingRentCount }}권 추가 가능)</span>
          </div>
          <v-btn
            class="sticky-rent-btn"
            variant="flat"
            :loading="rentRequestLoading"
            @click="handleRentRequest"
          >
            대여 신청
          </v-btn>
        </div>
      </Transition>
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
    >
      <v-card class="label-select-card">
        <v-card-title class="label-select-title">
          대여할 도서 선택
        </v-card-title>
        
        <v-card-text class="label-select-content">
          <div
            v-if="selectedGroup"
            class="rent-book-card mb-4"
          >
            <div class="rent-book-card-inner">
              <img
                v-if="selectedGroup.image"
                :src="selectedGroup.image"
                :alt="selectedGroup.title"
                class="rent-book-thumbnail"
              >
              <div
                v-else
                class="rent-book-thumbnail-placeholder"
              >
                <span>NO IMAGE</span>
              </div>
              <div class="rent-book-meta">
                <div class="rent-book-title">
                  {{ selectedGroup.title }}
                </div>
                <div
                  v-if="selectedGroup.author"
                  class="rent-book-author"
                >
                  <strong>저자:</strong> {{ selectedGroup.author }}
                </div>
                <div
                  v-if="selectedGroup.publisher"
                  class="rent-book-publisher"
                >
                  <strong>출판사:</strong> {{ selectedGroup.publisher }}
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
                  <span class="location-text">{{ formatLocation(copy.location) || '위치없음' }}</span>
                  <v-icon
                    v-if="hasLocationImage(currentCenter, copy.location)"
                    size="small"
                    class="ml-1 location-info-icon"
                    @click.stop="openLocationPopup(copy.location)"
                  >
                    mdi-information-outline
                  </v-icon>
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
    >
      <v-card class="rent-confirm-card">
        <v-card-title class="rent-confirm-title">
          대여 확인
        </v-card-title>
        
        <v-card-text class="rent-confirm-content">
          <div class="rent-confirm-info mb-4">
            <p>아래 정보를 확인 후 대여해주세요.</p>
          </div>
          
          <!-- 도서 정보 카드 (라벨번호, 위치 포함) -->
          <div
            v-if="selectedBookForRent"
            class="rent-book-card"
          >
            <div class="rent-book-card-inner">
              <img
                v-if="selectedBookForRent.image"
                :src="selectedBookForRent.image"
                :alt="selectedBookForRent.title"
                class="rent-book-thumbnail"
              >
              <div
                v-else
                class="rent-book-thumbnail-placeholder"
              >
                <span>NO IMAGE</span>
              </div>
              <div class="rent-book-meta">
                <div class="rent-book-title">
                  {{ selectedBookForRent.title }}
                </div>
                <div
                  v-if="selectedBookForRent.author"
                  class="rent-book-author"
                >
                  <strong>저자:</strong> {{ selectedBookForRent.author }}
                </div>
                <div
                  v-if="selectedBookForRent.publisher"
                  class="rent-book-publisher"
                >
                  <strong>출판사:</strong> {{ selectedBookForRent.publisher }}
                </div>
                <div class="rent-book-details">
                  <span class="detail-item">
                    <v-icon
                      size="x-small"
                      class="mr-1"
                    >mdi-label</v-icon>
                    {{ selectedLabelNumber }}
                  </span>
                  <span class="detail-item location-item">
                    <v-icon
                      size="x-small"
                      class="mr-1"
                    >mdi-map-marker</v-icon>
                    <span class="location-text">{{ formatLocation(selectedLocation) }}</span>
                    <v-icon
                      v-if="hasLocationImageForCenter"
                      size="x-small"
                      class="ml-1 location-info-icon"
                      @click.stop="showLocationPopup"
                    >
                      mdi-information-outline
                    </v-icon>
                  </span>
                </div>
              </div>
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

    <!-- 다권 대여 확인 다이얼로그 -->
    <v-dialog
      v-model="multiRentConfirmDialog"
      max-width="500"
    >
      <v-card class="rent-confirm-card">
        <v-card-title class="rent-confirm-title">
          대여 확인
        </v-card-title>
        
        <v-card-text class="rent-confirm-content">
          <div class="rent-confirm-info mb-4">
            <p>아래 도서들을 대여하시겠습니까?</p>
            <p
              v-if="!isDirectRentMode"
              class="text-caption text-grey mt-1"
            >
              관리자 승인 후 대여가 완료됩니다.
            </p>
          </div>
          
          <div class="multi-rent-book-list">
            <div
              v-for="(item, index) in selectedBooks"
              :key="index"
              class="rent-book-card"
            >
              <div class="rent-book-card-inner">
                <img
                  v-if="item.book?.image"
                  :src="item.book.image"
                  :alt="item.book?.title"
                  class="rent-book-thumbnail"
                >
                <div
                  v-else
                  class="rent-book-thumbnail-placeholder"
                >
                  <span>NO IMAGE</span>
                </div>
                <div class="rent-book-meta">
                  <div class="rent-book-title">
                    {{ item.book?.title }}
                  </div>
                  <div
                    v-if="item.book?.author"
                    class="rent-book-author"
                  >
                    <strong>저자:</strong> {{ item.book.author }}
                  </div>
                  <div
                    v-if="item.book?.publisher"
                    class="rent-book-publisher"
                  >
                    <strong>출판사:</strong> {{ item.book.publisher }}
                  </div>
                  <div class="rent-book-details">
                    <span class="detail-item">
                      <v-icon
                        size="x-small"
                        class="mr-1"
                      >mdi-label</v-icon>
                      {{ item.labelNumber }}
                    </span>
                    <span class="detail-item location-item">
                      <v-icon
                        size="x-small"
                        class="mr-1"
                      >mdi-map-marker</v-icon>
                      <span class="location-text">{{ formatLocation(item.location) }}</span>
                      <v-icon
                        v-if="hasLocationImage(currentCenter, item.location)"
                        size="x-small"
                        class="ml-1 location-info-icon"
                        @click.stop="openLocationPopup(item.location)"
                      >
                        mdi-information-outline
                      </v-icon>
                    </span>
                  </div>
                </div>
              </div>
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
            @click="closeMultiRentConfirmDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="rentRequestLoading"
            @click="confirmMultiRent"
          >
            {{ isDirectRentMode ? '대여하기' : '대여 신청' }}
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

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

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

// 페이지네이션
const currentPage = ref(1)
const ITEMS_PER_PAGE = 10

// 도서 선택 관련
const selectedBooks = ref([]) // { isbn, labelNumber, book } 형태
const rentRequestLoading = ref(false)
const MAX_RENT_COUNT = 5

// 현재 대여중인 도서 수
const currentRentedCount = ref(0)
// 내가 대여중인 도서 ISBN 목록
const myRentedIsbns = ref([])

// 라벨번호 선택 다이얼로그 관련
const labelSelectDialog = ref(false)
const selectedGroup = ref(null)
const selectedLabelNumber = ref('')
const selectedLocation = ref('')
const selectedBookForRent = ref(null)
const isDialogForMultiSelect = ref(false)

// 대여 확인 다이얼로그 관련
const rentConfirmDialog = ref(false)

// 다권 대여 확인 다이얼로그 관련
const multiRentConfirmDialog = ref(false)
const isDirectRentMode = ref(false)

// 위치 안내 팝업
const locationPopupVisible = ref(false)

// 반납 알림 구독 관련
const returnNotifySubscriptions = ref([]) // 내가 구독중인 ISBN 목록
const returnNotifyLoadingIsbn = ref(null)

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
    loadCurrentRentedCount(),
    loadReturnNotifySubscriptions()
  ])
})

// 반납 알림 구독 목록 로드
const loadReturnNotifySubscriptions = async () => {
  if (!user.value || !firestore) return

  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const subscriptionsRef = collection(firestore, 'returnNotifySubscriptions')
    const q = query(
      subscriptionsRef,
      where('userId', '==', user.value.uid),
      where('center', '==', currentCenter.value),
      where('notified', '==', false)
    )
    
    const snapshot = await getDocs(q)
    const subscriptions = []
    snapshot.forEach(doc => {
      subscriptions.push(doc.data().isbn)
    })
    returnNotifySubscriptions.value = subscriptions
  } catch (error) {
    console.error('반납 알림 구독 목록 로드 오류:', error)
    returnNotifySubscriptions.value = []
  }
}

// 특정 도서 구독 여부 확인
const isSubscribedToBook = (isbn) => {
  return returnNotifySubscriptions.value.includes(isbn)
}

// 반납 알림 구독
const handleSubscribeReturnNotify = async (group) => {
  if (!user.value || !firestore || !group) return

  try {
    returnNotifyLoadingIsbn.value = group.isbn
    
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    const subscriptionsRef = collection(firestore, 'returnNotifySubscriptions')
    
    await addDoc(subscriptionsRef, {
      userId: user.value.uid,
      userEmail: user.value.email,
      isbn: group.isbn,
      title: group.title,
      center: currentCenter.value,
      notified: false,
      createdAt: serverTimestamp()
    })
    
    // 로컬 상태 업데이트
    returnNotifySubscriptions.value.push(group.isbn)
    
    await alert('반납 알림이 신청되었습니다.\n도서가 반납되면 알림을 받으실 수 있습니다.', { type: 'success' })
  } catch (error) {
    console.error('반납 알림 구독 오류:', error)
    await alert('반납 알림 신청에 실패했습니다.', { type: 'error' })
  } finally {
    returnNotifyLoadingIsbn.value = null
  }
}

// 현재 대여중인 도서 수 및 ISBN 목록 로드
const loadCurrentRentedCount = async () => {
  if (!user.value || !firestore) {
    currentRentedCount.value = 0
    myRentedIsbns.value = []
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
    const isbns = []
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.status === 'rented' || data.status === 'overdue') {
        count++
        const isbn = data.isbn13 || data.isbn
        if (isbn) {
          isbns.push(isbn)
        }
      }
    })
    currentRentedCount.value = count
    myRentedIsbns.value = isbns
  } catch (error) {
    console.error('대여중인 도서 수 로드 오류:', error)
    currentRentedCount.value = 0
    myRentedIsbns.value = []
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
  await Promise.all([
    loadRegisteredBooks(),
    loadReturnNotifySubscriptions()
  ])
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

// 페이지네이션된 도서 목록
const totalPages = computed(() => {
  return Math.ceil(filteredGroupedBooks.value.length / ITEMS_PER_PAGE)
})

const displayedGroupedBooks = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return filteredGroupedBooks.value.slice(start, end)
})

// 검색/정렬 변경 시 페이지 리셋
watch([registeredBooksSearchQuery, sortBy], () => {
  currentPage.value = 1
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

// 내가 대여중인 ISBN인지 확인
const isMyRentedIsbn = (isbn) => {
  return myRentedIsbns.value.includes(isbn)
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
  
  // 읽은 책 목록에 있는지 확인
  const inReadHistory = await checkIfInReadHistory(group.isbn)
  if (inReadHistory) {
    const confirmed = await confirm(`이미 읽은 책입니다.\n정말로 대여하시겠습니까?`)
    if (!confirmed) {
      return
    }
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

// 읽은 책 목록에서 동일 도서 확인 (isbn13 또는 isbn으로 검색)
const checkIfInReadHistory = async (isbn) => {
  if (!user.value || !firestore || !isbn) return null

  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const historyRef = collection(firestore, 'rentalHistory')
    
    // isbn13으로 먼저 검색
    const q1 = query(
      historyRef,
      where('userId', '==', user.value.uid),
      where('isbn13', '==', isbn)
    )
    
    const snapshot1 = await getDocs(q1)
    if (!snapshot1.empty) {
      return snapshot1.docs[0].data()
    }
    
    // isbn으로도 검색 (isbn13이 없는 경우 대비)
    const q2 = query(
      historyRef,
      where('userId', '==', user.value.uid),
      where('isbn', '==', isbn)
    )
    
    const snapshot2 = await getDocs(q2)
    if (!snapshot2.empty) {
      return snapshot2.docs[0].data()
    }
    
    return null
  } catch (error) {
    console.error('읽은 책 목록 확인 오류:', error)
    return null
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
  
  // 읽은 책 목록에 있는지 확인
  const inReadHistory = await checkIfInReadHistory(group.isbn)
  if (inReadHistory) {
    const confirmed = await confirm(`이미 읽은 책입니다.\n정말로 대여하시겠습니까?`)
    if (!confirmed) {
      return
    }
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

// 위치 안내 팝업 열기 (특정 위치)
const openLocationPopup = (location) => {
  selectedLocation.value = location
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

  // 다권 대여 확인 다이얼로그 열기
  isDirectRentMode.value = isDirectRent
  multiRentConfirmDialog.value = true
}

// 다권 대여 확인 다이얼로그 닫기
const closeMultiRentConfirmDialog = () => {
  multiRentConfirmDialog.value = false
}

// 다권 대여 확정
const confirmMultiRent = async () => {
  try {
    rentRequestLoading.value = true
    const bookCount = selectedBooks.value.length
    
    if (isDirectRentMode.value) {
      for (const item of selectedBooks.value) {
        await rentBook(item.labelNumber, currentCenter.value, user.value.uid, item.isbn)
      }
      
      await Promise.all([
        loadRegisteredBooks(),
        loadCurrentRentedCount()
      ])
      
      closeMultiRentConfirmDialog()
      await alert(`${bookCount}권의 도서 대여가 완료되었습니다.`, { type: 'success' })
    } else {
      for (const item of selectedBooks.value) {
        await requestRent(item.labelNumber, currentCenter.value, user.value.uid, item.isbn)
      }
      
      await loadRegisteredBooks()
      
      closeMultiRentConfirmDialog()
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
    background-color: #fafafa;
    color: #bdbdbd;
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

.location-info-icon {
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #002C5B;
  }
}

.location-item {
  display: inline-flex;
  align-items: center;
}

.location-text {
  flex: 0 0 auto;
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

// 개별 대여 도서 카드 스타일
.rent-book-card {
  background: #f5f5f5;
  border-radius: rem(8);
  border: rem(2) solid #e0e0e0;
  overflow: hidden;
}

.rent-book-card-inner {
  display: flex;
  gap: rem(16);
  padding: rem(16);
}

.rent-book-thumbnail {
  width: rem(80);
  height: rem(110);
  object-fit: cover;
  border-radius: rem(4);
  flex-shrink: 0;
}

.rent-book-thumbnail-placeholder {
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

.rent-book-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.rent-book-title {
  font-size: rem(15);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.3;
  margin-bottom: rem(4);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rent-book-author,
.rent-book-publisher {
  font-size: rem(13);
  color: #6b7280;
  margin-bottom: rem(2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rent-book-details {
  display: flex;
  flex-wrap: wrap;
  gap: rem(12);
  font-size: rem(12);
  color: #666;
  margin-top: rem(8);
  
  .detail-item {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0;
  }
  
  .location-btn {
    margin-left: rem(4);
    padding: 0 rem(4);
    min-width: auto;
    height: auto;
  }
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

// 다권 대여 목록 스타일
.multi-rent-book-list {
  max-height: rem(350);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: rem(12);
  
  .rent-book-card {
    flex-shrink: 0;
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

// 페이지네이션 스타일
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: rem(16) 0 rem(70); // 하단 스티키 바 높이 고려
}

.pagination {
  :deep(.v-pagination__list) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: rem(2);
  }
  
  :deep(.v-pagination__item),
  :deep(.v-pagination__prev),
  :deep(.v-pagination__next) {
    font-size: rem(12);
    min-width: rem(28);
    height: rem(28);
    
    .v-btn {
      min-width: rem(28);
      height: rem(28);
    }
  }
  
  :deep(.v-pagination__item--is-active) {
    .v-btn {
      background-color: #002C5B;
      color: #fff;
    }
  }
}

// 하단 고정 대여 신청 바
.sticky-rent-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: rem(768);
  background: #002C5B;
  padding: rem(12) rem(20);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  box-shadow: 0 rem(-4) rem(12) rgba(0, 0, 0, 0.15);
}

.sticky-rent-info {
  display: flex;
  flex-direction: column;
  gap: rem(2);
  color: #FFFFFF;
}

.selected-count {
  font-size: rem(16);
  font-weight: 600;
}

.rent-status {
  font-size: rem(12);
  opacity: 0.8;
}

.sticky-rent-btn {
  background-color: #FFFFFF;
  color: #002C5B;
  font-weight: 600;
  min-width: rem(100);
  
  &:hover {
    background-color: #f0f0f0;
  }
}

// 슬라이드 업 애니메이션
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}
</style>
