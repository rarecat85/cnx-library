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
                총 <strong>{{ totalBookCount }}</strong>권 ({{ groupedBookCount }}종)
              </div>
              <div class="text-body-2 text-medium-emphasis">
                대여중 <strong>{{ rentedCount }}</strong>권, 연체중 <strong>{{ overdueCount }}</strong>권, 대여신청 <strong>{{ requestedCount }}</strong>권
              </div>
            </div>
            <div class="d-flex align-center registered-search-group">
              <v-text-field
                v-model="registeredBooksSearchQuery"
                label="도서/라벨번호 검색"
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
            v-else-if="filteredGroupedBooks.length > 0"
            class="registered-books-grid"
          >
            <!-- ISBN 그룹핑된 도서 목록 -->
            <div
              v-for="(group, index) in filteredGroupedBooks"
              :key="`group-${index}`"
              class="book-group"
            >
              <!-- 그룹 헤더 (클릭 시 펼침/접힘) -->
              <div
                class="book-group-header"
                :class="{ 'has-copies': group.copies.length > 1 }"
                @click="group.copies.length > 1 && toggleGroupExpand(group.isbn)"
              >
                <div class="book-group-info">
                  <v-checkbox
                    :model-value="isGroupSelected(group)"
                    :indeterminate="isGroupPartiallySelected(group)"
                    hide-details
                    class="group-checkbox"
                    @click.stop
                    @update:model-value="handleGroupSelect(group, $event)"
                  />
                  <img
                    v-if="group.image"
                    :src="group.image"
                    :alt="group.title"
                    class="group-thumbnail"
                  >
                  <div class="group-meta">
                    <div class="group-title">
                      {{ group.title }}
                    </div>
                    <div class="group-author">
                      {{ group.author }} | {{ group.publisher }}
                    </div>
                    <div class="group-stats">
                      <span class="stat-total">{{ group.totalCount }}권</span>
                      <span
                        v-if="group.availableCount > 0"
                        class="stat-available"
                      >대여가능 {{ group.availableCount }}권</span>
                      <span
                        v-if="group.rentedCount > 0"
                        class="stat-rented"
                      >대여중 {{ group.rentedCount }}권</span>
                      <span
                        v-if="group.requestedCount > 0"
                        class="stat-requested"
                      >신청 {{ group.requestedCount }}권</span>
                    </div>
                    <div
                      v-if="group.locations.length > 0"
                      class="group-locations"
                    >
                      <v-icon
                        size="small"
                        class="mr-1"
                      >
                        mdi-map-marker
                      </v-icon>
                      {{ formatGroupLocations(group.locations) }}
                    </div>
                  </div>
                </div>
                <v-icon
                  v-if="group.copies.length > 1"
                  class="expand-icon"
                  :class="{ 'expanded': expandedGroups.has(group.isbn) }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>

              <!-- 개별 도서 목록 (펼침 시 표시) -->
              <v-expand-transition>
                <div
                  v-if="group.copies.length === 1 || expandedGroups.has(group.isbn)"
                  class="book-copies-list"
                >
                  <div
                    v-for="book in group.copies"
                    :key="book.id"
                    class="book-copy-item"
                    :class="{ 'selected': isBookSelected(book) }"
                  >
                    <v-checkbox
                      :model-value="isBookSelected(book)"
                      hide-details
                      class="copy-checkbox"
                      @update:model-value="handleBookSelect(book, $event)"
                    />
                    <div class="copy-info">
                      <div class="copy-label-number">
                        <v-icon
                          size="small"
                          class="mr-1"
                        >
                          mdi-label
                        </v-icon>
                        {{ book.labelNumber || '라벨없음' }}
                      </div>
                      <div class="copy-location">
                        <v-icon
                          size="small"
                          class="mr-1"
                        >
                          mdi-map-marker
                        </v-icon>
                        {{ formatLocation(book.location) || '위치없음' }}
                      </div>
                      <div class="copy-category">
                        {{ book.category || '-' }}
                      </div>
                    </div>
                    <div class="copy-status">
                      <v-chip
                        v-if="getBookStatus(book) === 'rented'"
                        size="small"
                        color="primary"
                        variant="flat"
                      >
                        대여중
                      </v-chip>
                      <v-chip
                        v-else-if="getBookStatus(book) === 'overdue'"
                        size="small"
                        color="error"
                        variant="flat"
                      >
                        연체중
                      </v-chip>
                      <v-chip
                        v-else-if="getBookStatus(book) === 'requested'"
                        size="small"
                        color="warning"
                        variant="flat"
                      >
                        대여신청
                      </v-chip>
                      <v-chip
                        v-else
                        size="small"
                        color="success"
                        variant="outlined"
                      >
                        대여가능
                      </v-chip>
                    </div>
                    <div
                      v-if="getRenterInfo(book) || getRequesterInfo(book)"
                      class="copy-user-info"
                    >
                      <template v-if="getRenterInfo(book)">
                        <v-icon
                          size="small"
                          class="mr-1"
                        >
                          mdi-account
                        </v-icon>
                        {{ getRenterInfo(book) }}
                      </template>
                      <template v-else-if="getRequesterInfo(book)">
                        <v-icon
                          size="small"
                          class="mr-1"
                        >
                          mdi-account-clock
                        </v-icon>
                        {{ getRequesterInfo(book) }}
                      </template>
                    </div>
                    <div class="copy-actions">
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        title="수정"
                        @click="openEditDialog(book)"
                      >
                        <v-icon size="small">
                          mdi-pencil
                        </v-icon>
                      </v-btn>
                      <v-btn
                        v-if="getBookStatus(book) === 'rented' || getBookStatus(book) === 'overdue'"
                        icon
                        variant="text"
                        size="small"
                        title="반납 처리"
                        @click="handleSingleReturn(book)"
                      >
                        <v-icon size="small">
                          mdi-book-arrow-left
                        </v-icon>
                      </v-btn>
                      <v-btn
                        v-else-if="getBookStatus(book) === 'requested'"
                        icon
                        variant="text"
                        size="small"
                        title="대여 승인"
                        @click="openRentDialog(book)"
                      >
                        <v-icon size="small">
                          mdi-check
                        </v-icon>
                      </v-btn>
                      <v-btn
                        v-else
                        icon
                        variant="text"
                        size="small"
                        title="대여 처리"
                        @click="openRentDialog(book)"
                      >
                        <v-icon size="small">
                          mdi-book-arrow-right
                        </v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-expand-transition>
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

    <!-- 대여 처리 다이얼로그 -->
    <v-dialog
      v-model="rentDialog"
      max-width="400"
      persistent
    >
      <v-card class="rent-dialog-card">
        <div class="rent-dialog-title text-h6">
          대여자 정보 입력
        </div>
        <div class="rent-dialog-content">
          <div class="mb-4 text-body-2 text-medium-emphasis">
            대여 처리할 도서: {{ rentDialogBooks.length }}권
          </div>
          <v-select
            v-model="rentFormCenter"
            :items="centerOptions"
            label="센터"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="rentFormEmail"
            label="이메일"
            variant="outlined"
            density="comfortable"
            placeholder="example@email.com"
            :error-messages="rentFormError"
          />
        </div>
        <div class="rent-dialog-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeRentDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="rentDialogLoading"
            :disabled="!rentFormCenter || !rentFormEmail"
            @click="confirmRentBooks"
          >
            대여 처리
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- 도서 정보 수정 다이얼로그 -->
    <v-dialog
      v-model="editDialog"
      max-width="500"
      persistent
    >
      <v-card class="edit-dialog-card">
        <v-card-title class="edit-dialog-title">
          도서 정보 수정
        </v-card-title>
        
        <v-card-text class="edit-dialog-content">
          <!-- 도서 정보 표시 -->
          <div
            v-if="editingBook"
            class="book-info-preview mb-6"
          >
            <div class="book-info-preview-inner">
              <img
                v-if="editingBook.image"
                :src="editingBook.image"
                :alt="editingBook.title"
                class="book-thumbnail"
              >
              <div class="book-meta">
                <div class="book-title">
                  {{ editingBook.title }}
                </div>
                <div class="book-author">
                  {{ editingBook.author }}
                </div>
              </div>
            </div>
          </div>

          <!-- 카테고리 선택 -->
          <v-autocomplete
            v-model="editForm.category"
            :items="categoryOptions"
            label="카테고리 *"
            variant="outlined"
            density="comfortable"
            :loading="categoriesLoading"
            class="mb-4"
          />

          <!-- 라벨번호 입력 -->
          <div class="label-number-section mb-4">
            <div class="label-number-preview mb-2">
              <span class="label-preview-text">
                라벨번호: <strong>{{ editLabelNumberPreview || '(미입력)' }}</strong>
              </span>
            </div>
            <div class="label-number-inputs">
              <v-text-field
                :model-value="editCenterCode"
                label="센터코드"
                variant="outlined"
                density="comfortable"
                readonly
                disabled
                class="center-code-input"
              />
              <v-text-field
                v-model="editForm.fourDigits"
                label="4자리 번호 *"
                variant="outlined"
                density="comfortable"
                maxlength="4"
                :error-messages="editLabelNumberError"
                hint="0001~9999"
                persistent-hint
                class="four-digits-input"
                @input="handleEditFourDigitsInput"
                @blur="checkEditLabelNumberDuplicate"
              />
            </div>
          </div>

          <!-- 위치 선택 -->
          <v-select
            v-model="editForm.location"
            :items="locationOptions"
            label="위치 *"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        
        <v-card-actions class="edit-dialog-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeEditDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="editLoading"
            :disabled="!isEditFormValid"
            @click="handleUpdateBook"
          >
            저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'
import { CENTER_CODE_MAP, createLabelNumber, parseLabelNumber, formatLocation, getLocationSelectOptions } from '@/utils/labelConfig.js'

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
  updateBookInfo,
  checkLabelNumberExists,
  getCategories,
  calculateBookStatus,
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
const sortBy = ref('title')
const sortOptions = [
  { title: '제목순', value: 'title' },
  { title: '등록일순', value: 'date' },
  { title: '대여중도서', value: 'rented' },
  { title: '연체중도서', value: 'overdue' },
  { title: '대여신청도서', value: 'requested' },
  { title: '신규등록도서', value: 'new' }
]

// 도서 선택 관련
const selectedBooks = ref([])
const selectAll = ref(false)
const actionLoading = ref(false)

// 그룹 펼침 상태
const expandedGroups = ref(new Set())

// 최대 대여 권수
const MAX_RENT_COUNT = 5

// 대여자/신청자 정보 캐시
const renterInfoCache = ref({})
const requesterInfoCache = ref({})

// 대여 다이얼로그 관련
const rentDialog = ref(false)
const rentDialogBooks = ref([])
const rentDialogLoading = ref(false)
const rentFormCenter = ref('')
const rentFormEmail = ref('')
const rentFormError = ref('')

// 수정 다이얼로그 관련
const editDialog = ref(false)
const editingBook = ref(null)
const editLoading = ref(false)
const categoryOptions = ref([])
const categoriesLoading = ref(false)
const editLabelNumberError = ref('')
const editForm = ref({
  category: '',
  fourDigits: '',
  location: ''
})

// 위치 옵션
const locationOptions = computed(() => getLocationSelectOptions())

// 센터 코드 (수정용)
const editCenterCode = computed(() => {
  return CENTER_CODE_MAP[currentCenter.value] || '1'
})

// 수정 라벨번호 미리보기
const editLabelNumberPreview = computed(() => {
  if (!editForm.value.category || !editForm.value.fourDigits) {
    return ''
  }
  return createLabelNumber(editForm.value.category, currentCenter.value, editForm.value.fourDigits)
})

// 수정 폼 유효성
const isEditFormValid = computed(() => {
  return (
    editForm.value.category &&
    editForm.value.fourDigits &&
    editForm.value.fourDigits.length === 4 &&
    /^\d{4}$/.test(editForm.value.fourDigits) &&
    editForm.value.location &&
    !editLabelNumberError.value
  )
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
  
  await loadRegisteredBooks()
})

// 센터 변경 처리
const handleCenterChange = async () => {
  expandedGroups.value.clear()
  selectedBooks.value = []
  await loadRegisteredBooks()
}

// 등록된 도서 로드
const loadRegisteredBooks = async () => {
  try {
    registeredBooksLoading.value = true
    const books = await getBooksByCenter(currentCenter.value)
    registeredBooks.value = books
    
    await loadRenterInfoForBooks(books)
  } catch (error) {
    console.error('등록된 도서 로드 오류:', error)
    registeredBooks.value = []
  } finally {
    registeredBooksLoading.value = false
  }
}

// 대여자/신청자 정보 로드
const loadRenterInfoForBooks = async (books) => {
  if (!firestore) return
  
  const { doc, getDoc } = await import('firebase/firestore')
  
  const renterIds = [...new Set(
    books
      .filter(book => book.rentedBy)
      .map(book => book.rentedBy)
  )]
  
  const requesterIds = [...new Set(
    books
      .filter(book => book.requestedBy)
      .map(book => book.requestedBy)
  )]
  
  const allUserIds = [...new Set([...renterIds, ...requesterIds])]
  
  for (const userId of allUserIds) {
    if (renterInfoCache.value[userId] && requesterInfoCache.value[userId]) continue
    
    try {
      const userRef = doc(firestore, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const email = userData.email || ''
        const emailId = email.split('@')[0] || ''
        const name = userData.name || ''
        const workplace = userData.workplace || ''
        
        const infoString = `${workplace} ${name}(${emailId})`
        renterInfoCache.value[userId] = infoString
        requesterInfoCache.value[userId] = infoString
      }
    } catch (error) {
      console.error('대여자/신청자 정보 로드 오류:', error)
    }
  }
}

// 대여자 정보 반환
const getRenterInfo = (book) => {
  if (!book.rentedBy) return ''
  return renterInfoCache.value[book.rentedBy] || ''
}

// 신청자 정보 반환
const getRequesterInfo = (book) => {
  if (!book.requestedBy) return ''
  return requesterInfoCache.value[book.requestedBy] || ''
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
        rentedCount: 0,
        requestedCount: 0,
        locations: []
      })
    }
    
    const group = groupMap.get(isbn)
    group.copies.push(book)
    group.totalCount++
    
    const status = calculateBookStatus(book)
    if (!status) {
      group.availableCount++
    } else if (status === 'rented' || status === 'overdue') {
      group.rentedCount++
    } else if (status === 'requested') {
      group.requestedCount++
    }
    
    if (book.location && !group.locations.includes(book.location)) {
      group.locations.push(book.location)
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

  // 검색 필터링 (제목, 저자, 출판사, 라벨번호)
  if (registeredBooksSearchQuery.value.trim()) {
    const query = registeredBooksSearchQuery.value.toLowerCase()
    groups = groups.filter(group => {
      const title = (group.title || '').toLowerCase()
      const author = (group.author || '').toLowerCase()
      const publisher = (group.publisher || '').toLowerCase()
      
      // 그룹 정보 매칭
      if (title.includes(query) || author.includes(query) || publisher.includes(query)) {
        return true
      }
      
      // 라벨번호 매칭
      return group.copies.some(book => {
        const labelNumber = (book.labelNumber || '').toLowerCase()
        return labelNumber.includes(query)
      })
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
  } else if (sortBy.value === 'rented') {
    groups = groups.filter(group => group.rentedCount > 0)
  } else if (sortBy.value === 'overdue') {
    groups = groups.filter(group => {
      return group.copies.some(book => calculateBookStatus(book) === 'overdue')
    })
  } else if (sortBy.value === 'requested') {
    groups = groups.filter(group => group.requestedCount > 0)
  } else if (sortBy.value === 'new') {
    // 구매칸에 위치한 도서가 있는 그룹만 필터링
    groups = groups.filter(group => {
      return group.copies.some(book => book.location === '구매칸')
    })
  }

  return groups
})

// 총 도서 수
const totalBookCount = computed(() => registeredBooks.value.length)
const groupedBookCount = computed(() => groupedBooks.value.length)

// 대여중, 연체중, 대여신청 도서 수 계산
const rentedCount = computed(() => {
  return registeredBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'rented'
  }).length
})

const overdueCount = computed(() => {
  return registeredBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'overdue'
  }).length
})

const requestedCount = computed(() => {
  return registeredBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'requested'
  }).length
})

// 도서 상태 계산
const getBookStatus = (book) => {
  return calculateBookStatus(book)
}

// 그룹 펼침/접힘
const toggleGroupExpand = (isbn) => {
  if (expandedGroups.value.has(isbn)) {
    expandedGroups.value.delete(isbn)
  } else {
    expandedGroups.value.add(isbn)
  }
  // 반응성을 위해 새로운 Set 생성
  expandedGroups.value = new Set(expandedGroups.value)
}

// 그룹 위치 포맷
const formatGroupLocations = (locations) => {
  if (locations.length === 0) return ''
  if (locations.length === 1) return formatLocation(locations[0])
  if (locations.length === 2) return locations.map(l => formatLocation(l)).join(', ')
  return `${formatLocation(locations[0])} 외 ${locations.length - 1}곳`
}

// 도서 선택 관련 함수
const isBookSelected = (book) => {
  return selectedBooks.value.some(selected => selected.id === book.id)
}

const isGroupSelected = (group) => {
  return group.copies.every(book => isBookSelected(book))
}

const isGroupPartiallySelected = (group) => {
  const selectedCount = group.copies.filter(book => isBookSelected(book)).length
  return selectedCount > 0 && selectedCount < group.copies.length
}

const handleBookSelect = (book, selected) => {
  if (selected) {
    if (!isBookSelected(book)) {
      selectedBooks.value.push(book)
    }
  } else {
    selectedBooks.value = selectedBooks.value.filter(selectedBook => selectedBook.id !== book.id)
  }
  
  updateSelectAllState()
}

const handleGroupSelect = (group, selected) => {
  if (selected) {
    for (const book of group.copies) {
      if (!isBookSelected(book)) {
        selectedBooks.value.push(book)
      }
    }
  } else {
    const groupBookIds = group.copies.map(b => b.id)
    selectedBooks.value = selectedBooks.value.filter(book => !groupBookIds.includes(book.id))
  }
  
  updateSelectAllState()
}

const handleSelectAll = (value) => {
  if (value) {
    selectedBooks.value = filteredGroupedBooks.value.flatMap(group => group.copies)
  } else {
    selectedBooks.value = []
  }
}

const updateSelectAllState = () => {
  const allBooks = filteredGroupedBooks.value.flatMap(group => group.copies)
  selectAll.value = allBooks.length > 0 && allBooks.every(book => isBookSelected(book))
}

// 필터링된 도서 목록이 변경될 때 전체선택 상태 업데이트
watch(() => filteredGroupedBooks.value, () => {
  updateSelectAllState()
})

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

// 수정 4자리 입력 핸들러
const handleEditFourDigitsInput = (e) => {
  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
  editForm.value.fourDigits = value
  editLabelNumberError.value = ''
}

// 수정 라벨번호 중복 체크
const checkEditLabelNumberDuplicate = async () => {
  if (!editForm.value.category || !editForm.value.fourDigits || editForm.value.fourDigits.length !== 4) {
    return
  }
  
  const newLabelNumber = createLabelNumber(editForm.value.category, currentCenter.value, editForm.value.fourDigits)
  
  // 기존 라벨번호와 같으면 체크 스킵
  if (editingBook.value && newLabelNumber === editingBook.value.labelNumber) {
    editLabelNumberError.value = ''
    return
  }
  
  try {
    const exists = await checkLabelNumberExists(newLabelNumber, currentCenter.value)
    
    if (exists) {
      editLabelNumberError.value = '이미 사용중인 라벨번호입니다.'
    } else {
      editLabelNumberError.value = ''
    }
  } catch (error) {
    console.error('라벨번호 중복 체크 오류:', error)
  }
}

// 수정 다이얼로그 열기
const openEditDialog = async (book) => {
  editingBook.value = book
  
  // 기존 라벨번호 파싱
  const parsed = parseLabelNumber(book.labelNumber)
  
  editForm.value = {
    category: book.category || (parsed?.category || ''),
    fourDigits: parsed?.fourDigits || '',
    location: book.location || '구매칸'
  }
  editLabelNumberError.value = ''
  
  await loadCategories()
  
  editDialog.value = true
}

// 수정 다이얼로그 닫기
const closeEditDialog = () => {
  editDialog.value = false
  editingBook.value = null
}

// 도서 정보 업데이트
const handleUpdateBook = async () => {
  if (!editingBook.value || !isEditFormValid.value) {
    return
  }
  
  try {
    editLoading.value = true
    
    const newLabelNumber = createLabelNumber(editForm.value.category, currentCenter.value, editForm.value.fourDigits)
    
    await updateBookInfo(
      editingBook.value.labelNumber || editingBook.value.id.split('_')[0],
      currentCenter.value,
      {
        category: editForm.value.category,
        labelNumber: newLabelNumber,
        location: editForm.value.location
      }
    )
    
    closeEditDialog()
    await loadRegisteredBooks()
    await alert('도서 정보가 수정되었습니다.', { type: 'success' })
  } catch (error) {
    console.error('도서 정보 수정 오류:', error)
    await alert(error.message || '도서 정보 수정에 실패했습니다.', { type: 'error' })
  } finally {
    editLoading.value = false
  }
}

// 도서 삭제 처리
const handleDeleteBooks = async () => {
  if (selectedBooks.value.length === 0) return

  const deletableBooks = []
  const undeletableBooks = []
  
  for (const book of selectedBooks.value) {
    const status = calculateBookStatus(book)
    if (status === 'rented' || status === 'overdue') {
      undeletableBooks.push({ book, reason: '대여중' })
    } else if (status === 'requested') {
      undeletableBooks.push({ book, reason: '대여신청중' })
    } else {
      deletableBooks.push(book)
    }
  }

  if (deletableBooks.length === 0) {
    const reasons = undeletableBooks.map(item => 
      `• ${item.book.title} (${item.reason})`
    ).join('\n')
    await alert(`선택한 도서를 삭제할 수 없습니다.\n\n${reasons}\n\n대여중/대여신청중인 도서는 반납 또는 신청 취소 후 삭제해주세요.`, { type: 'warning' })
    return
  }

  let confirmMessage = `선택한 ${selectedBooks.value.length}권 중 ${deletableBooks.length}권의 도서를 삭제하시겠습니까?`
  
  if (undeletableBooks.length > 0) {
    const undeletableList = undeletableBooks.map(item => 
      `• ${item.book.title} (${item.reason})`
    ).join('\n')
    confirmMessage += `\n\n⚠️ 다음 도서는 삭제할 수 없습니다:\n${undeletableList}`
  }

  if (!await confirm(confirmMessage)) {
    return
  }

  try {
    actionLoading.value = true
    const promises = deletableBooks.map(book => {
      const labelNumber = book.labelNumber || book.id.split('_')[0]
      return deleteBook(labelNumber, currentCenter.value)
    })
    await Promise.all(promises)
    selectedBooks.value = []
    await loadRegisteredBooks()
    
    if (undeletableBooks.length > 0) {
      await alert(`${deletableBooks.length}권의 도서가 삭제되었습니다.\n(${undeletableBooks.length}권은 대여중/대여신청중으로 삭제되지 않았습니다.)`, { type: 'success' })
    } else {
      await alert(`${deletableBooks.length}권의 도서가 삭제되었습니다.`, { type: 'success' })
    }
  } catch (error) {
    console.error('도서 삭제 오류:', error)
    await alert('도서 삭제에 실패했습니다.', { type: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// 도서 대여 처리
const handleRentBooks = async () => {
  if (selectedBooks.value.length === 0) return
  
  const availableBooks = selectedBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status !== 'rented' && status !== 'overdue'
  })
  
  if (availableBooks.length === 0) {
    await alert('선택한 도서가 모두 대여중입니다.', { type: 'warning' })
    return
  }
  
  rentDialogBooks.value = availableBooks
  rentFormCenter.value = currentCenter.value
  rentFormEmail.value = ''
  rentFormError.value = ''
  rentDialog.value = true
}

// 사용자의 현재 대여 권수 조회
const getUserRentedCount = async (userId) => {
  if (!firestore || !userId) return 0
  
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const booksRef = collection(firestore, 'books')
    const rentedQuery = query(booksRef, where('rentedBy', '==', userId))
    const snapshot = await getDocs(rentedQuery)
    let count = 0
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.status === 'rented' || data.status === 'overdue') {
        count++
      }
    })
    return count
  } catch (error) {
    console.error('대여 권수 조회 오류:', error)
    return 0
  }
}

// 개별 대여 처리 (다이얼로그 열기)
const openRentDialog = async (book) => {
  const status = calculateBookStatus(book)
  
  // 대여 신청된 도서인 경우 신청자 정보로 바로 대여 처리
  if (status === 'requested' && book.requestedBy) {
    const currentRentedCount = await getUserRentedCount(book.requestedBy)
    if (currentRentedCount >= MAX_RENT_COUNT) {
      await alert(`신청자가 이미 ${MAX_RENT_COUNT}권을 대여중입니다.\n반납 후 대여 처리해주세요.`, { type: 'warning' })
      return
    }
    
    if (!await confirm(`신청자 정보로 대여 처리하시겠습니까?\n\n도서: ${book.title}\n라벨번호: ${book.labelNumber || '-'}\n신청자: ${getRequesterInfo(book)}`)) {
      return
    }
    
    try {
      actionLoading.value = true
      
      const labelNumber = book.labelNumber || book.id.split('_')[0]
      await rentBook(labelNumber, currentCenter.value, book.requestedBy, book.isbn)
      
      await loadRegisteredBooks()
      await alert('대여 처리가 완료되었습니다.', { type: 'success' })
    } catch (error) {
      console.error('대여 처리 오류:', error)
      await alert(error.message || '대여 처리에 실패했습니다.', { type: 'error' })
    } finally {
      actionLoading.value = false
    }
    return
  }
  
  rentDialogBooks.value = [book]
  rentFormCenter.value = currentCenter.value
  rentFormEmail.value = ''
  rentFormError.value = ''
  rentDialog.value = true
}

// 다이얼로그 닫기
const closeRentDialog = () => {
  rentDialog.value = false
  rentDialogBooks.value = []
  rentFormCenter.value = ''
  rentFormEmail.value = ''
  rentFormError.value = ''
}

// 대여 처리 확인
const confirmRentBooks = async () => {
  if (!rentFormCenter.value || !rentFormEmail.value) return
  
  try {
    rentDialogLoading.value = true
    rentFormError.value = ''
    
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const usersRef = collection(firestore, 'users')
    
    const emailQuery = query(usersRef, where('email', '==', rentFormEmail.value))
    const emailSnapshot = await getDocs(emailQuery)
    
    if (emailSnapshot.empty) {
      rentFormError.value = '해당 이메일의 사용자를 찾을 수 없습니다.'
      return
    }
    
    const userData = emailSnapshot.docs[0].data()
    if (userData.center !== rentFormCenter.value) {
      rentFormError.value = `해당 사용자는 ${userData.center} 소속입니다.`
      return
    }
    
    const targetUser = emailSnapshot.docs[0]
    const targetUserId = targetUser.id
    
    const currentRentedCount = await getUserRentedCount(targetUserId)
    const booksToRent = rentDialogBooks.value.length
    const remainingSlots = MAX_RENT_COUNT - currentRentedCount
    
    if (remainingSlots <= 0) {
      rentFormError.value = `해당 사용자가 이미 ${MAX_RENT_COUNT}권을 대여중입니다.`
      return
    }
    
    if (booksToRent > remainingSlots) {
      rentFormError.value = `해당 사용자는 ${remainingSlots}권까지만 추가 대여 가능합니다. (현재 ${currentRentedCount}권 대여중)`
      return
    }
    
    // 선택된 도서들 대여 처리
    for (const book of rentDialogBooks.value) {
      const labelNumber = book.labelNumber || book.id.split('_')[0]
      await rentBook(labelNumber, currentCenter.value, targetUserId, book.isbn)
    }
    
    const rentedBookCount = rentDialogBooks.value.length
    
    await loadRegisteredBooks()
    selectedBooks.value = selectedBooks.value.filter(book => 
      !rentDialogBooks.value.some(rb => rb.id === book.id)
    )
    closeRentDialog()
    
    await alert(`${rentedBookCount}권의 도서가 대여 처리되었습니다.`, { type: 'success' })
  } catch (error) {
    console.error('도서 대여 오류:', error)
    rentFormError.value = error.message || '대여 처리에 실패했습니다.'
  } finally {
    rentDialogLoading.value = false
  }
}

// 도서 반납 처리
const handleReturnBooks = async () => {
  if (selectedBooks.value.length === 0) return

  const rentedBooks = selectedBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'rented' || status === 'overdue'
  })

  if (rentedBooks.length === 0) {
    await alert('선택한 도서 중 대여중인 도서가 없습니다.', { type: 'warning' })
    return
  }

  if (!await confirm(`선택한 ${rentedBooks.length}권의 도서를 반납 처리하시겠습니까?`)) {
    return
  }

  try {
    actionLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
    for (const book of rentedBooks) {
      const labelNumber = book.labelNumber || book.id.split('_')[0]
      const bookId = book.id
      const rentedBy = book.rentedBy
      const rentedAt = book.rentedAt
      
      // 1. 도서 상태 업데이트
      const bookRef = doc(firestore, 'books', bookId)
      await updateDoc(bookRef, {
        status: 'available',
        rentedBy: deleteField(),
        rentedAt: deleteField(),
        expectedReturnDate: deleteField()
      })
      
      // 2. 대여자의 rentalHistory에 반납 기록 추가/업데이트
      if (rentedBy) {
        const historyRef = collection(firestore, 'rentalHistory')
        // ISBN 기준으로 기록 검색 (라벨번호가 아닌 ISBN으로)
        const isbn = book.isbn13 || book.isbn || ''
        const historyQuery = query(
          historyRef,
          where('userId', '==', rentedBy),
          where('isbn13', '==', isbn)
        )
        const historySnapshot = await getDocs(historyQuery)
        
        if (historySnapshot.empty) {
          // 새로운 기록 추가
          await addDoc(historyRef, {
            bookId: bookId,
            labelNumber: labelNumber,
            isbn13: book.isbn13 || '',
            isbn: book.isbn || '',
            title: book.title || '',
            author: book.author || '',
            publisher: book.publisher || '',
            cover: book.cover || book.image || '',
            center: book.center || '',
            userId: rentedBy,
            rentedAt: rentedAt,
            returnedAt: serverTimestamp(),
            rentCount: 1
          })
        } else {
          // 기존 기록 업데이트
          const existingDoc = historySnapshot.docs[0]
          const existingData = existingDoc.data()
          await updateDoc(doc(firestore, 'rentalHistory', existingDoc.id), {
            rentedAt: rentedAt,
            returnedAt: serverTimestamp(),
            rentCount: (existingData.rentCount || 1) + 1
          })
        }
      }
    }
    
    selectedBooks.value = []
    await loadRegisteredBooks()
    await alert(`${rentedBooks.length}권의 도서가 반납 처리되었습니다.`, { type: 'success' })
  } catch (error) {
    console.error('도서 반납 오류:', error)
    await alert('도서 반납에 실패했습니다.', { type: 'error' })
  } finally {
    actionLoading.value = false
  }
}

// 개별 도서 반납 처리
const handleSingleReturn = async (book) => {
  const status = calculateBookStatus(book)
  if (status !== 'rented' && status !== 'overdue') {
    await alert('대여중인 도서가 아닙니다.', { type: 'warning' })
    return
  }

  if (!await confirm(`"${book.title}" 도서를 반납 처리하시겠습니까?\n라벨번호: ${book.labelNumber || '-'}`)) {
    return
  }

  try {
    actionLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
    const bookId = book.id
    const rentedBy = book.rentedBy
    const rentedAt = book.rentedAt
    const labelNumber = book.labelNumber || book.id.split('_')[0]
    
    // 1. 도서 상태 업데이트
    const bookRef = doc(firestore, 'books', bookId)
    await updateDoc(bookRef, {
      status: 'available',
      rentedBy: deleteField(),
      rentedAt: deleteField(),
      expectedReturnDate: deleteField()
    })
    
    // 2. 대여자의 rentalHistory에 반납 기록 추가/업데이트
    if (rentedBy) {
      const historyRef = collection(firestore, 'rentalHistory')
      const isbn = book.isbn13 || book.isbn || ''
      const historyQuery = query(
        historyRef,
        where('userId', '==', rentedBy),
        where('isbn13', '==', isbn)
      )
      const historySnapshot = await getDocs(historyQuery)
      
      if (historySnapshot.empty) {
        await addDoc(historyRef, {
          bookId: bookId,
          labelNumber: labelNumber,
          isbn13: book.isbn13 || '',
          isbn: book.isbn || '',
          title: book.title || '',
          author: book.author || '',
          publisher: book.publisher || '',
          cover: book.cover || book.image || '',
          center: book.center || '',
          userId: rentedBy,
          rentedAt: rentedAt,
          returnedAt: serverTimestamp(),
          rentCount: 1
        })
      } else {
        const existingDoc = historySnapshot.docs[0]
        const existingData = existingDoc.data()
        await updateDoc(doc(firestore, 'rentalHistory', existingDoc.id), {
          rentedAt: rentedAt,
          returnedAt: serverTimestamp(),
          rentCount: (existingData.rentCount || 1) + 1
        })
      }
    }
    
    await loadRegisteredBooks()
    await alert('도서가 반납 처리되었습니다.', { type: 'success' })
  } catch (error) {
    console.error('도서 반납 오류:', error)
    await alert('도서 반납에 실패했습니다.', { type: 'error' })
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
}

// 그룹핑된 도서 목록 스타일
.book-group {
  border: rem(1) solid #e0e0e0;
  border-radius: rem(8);
  margin-bottom: rem(12);
  overflow: hidden;
}

.book-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(12) rem(16);
  background: #fafafa;
  
  &.has-copies {
    cursor: pointer;
    
    &:hover {
      background: #f0f0f0;
    }
  }
}

.book-group-info {
  display: flex;
  align-items: center;
  gap: rem(12);
  flex: 1;
  min-width: 0;
}

.group-checkbox {
  flex-shrink: 0;
}

.group-thumbnail {
  width: rem(50);
  height: rem(70);
  object-fit: cover;
  border-radius: rem(4);
  flex-shrink: 0;
}

.group-meta {
  flex: 1;
  min-width: 0;
}

.group-title {
  font-size: rem(14);
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  margin-bottom: rem(2);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-author {
  font-size: rem(12);
  color: #666;
  margin-bottom: rem(4);
}

.group-stats {
  display: flex;
  flex-wrap: wrap;
  gap: rem(8);
  font-size: rem(11);
  
  .stat-total {
    color: #002C5B;
    font-weight: 600;
  }
  
  .stat-available {
    color: #4caf50;
  }
  
  .stat-rented {
    color: #1976d2;
  }
  
  .stat-requested {
    color: #f59e0b;
  }
}

.group-locations {
  display: flex;
  align-items: center;
  font-size: rem(11);
  color: #666;
  margin-top: rem(4);
}

.expand-icon {
  transition: transform 0.3s;
  color: #666;
  
  &.expanded {
    transform: rotate(180deg);
  }
}

.book-copies-list {
  border-top: rem(1) solid #e0e0e0;
}

.book-copy-item {
  display: flex;
  align-items: center;
  gap: rem(12);
  padding: rem(12) rem(16);
  border-bottom: rem(1) solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.selected {
    background: #e3f2fd;
  }
}

.copy-checkbox {
  flex-shrink: 0;
}

.copy-info {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: rem(8) rem(16);
  min-width: 0;
}

.copy-label-number,
.copy-location,
.copy-category {
  display: flex;
  align-items: center;
  font-size: rem(12);
  color: #666;
}

.copy-label-number {
  color: #002C5B;
  font-weight: 600;
}

.copy-status {
  flex-shrink: 0;
}

.copy-user-info {
  display: flex;
  align-items: center;
  font-size: rem(11);
  color: #666;
  max-width: rem(150);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-actions {
  display: flex;
  gap: rem(4);
  flex-shrink: 0;
}

// 수정 다이얼로그 스타일
.edit-dialog-card {
  border-radius: rem(12);
}

.edit-dialog-title {
  font-size: rem(20);
  font-weight: 600;
  color: #002C5B;
  padding: rem(20) rem(24) rem(8);
}

.edit-dialog-content {
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
  width: rem(60);
  height: rem(80);
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

.label-number-section {
  background: #fafafa;
  border-radius: rem(8);
  padding: rem(16);
}

.label-number-preview {
  text-align: center;
}

.label-preview-text {
  font-size: rem(14);
  color: #666;
  
  strong {
    color: #002C5B;
    font-size: rem(16);
  }
}

.label-number-inputs {
  display: flex;
  gap: rem(12);
  align-items: flex-start;
}

.center-code-input {
  flex: 0 0 rem(100);
}

.four-digits-input {
  flex: 1;
}

.edit-dialog-actions {
  padding: rem(8) rem(24) rem(20);
}

// 대여 다이얼로그 스타일
.rent-dialog-card {
  padding: rem(24);
}

.rent-dialog-title {
  font-weight: 600;
  color: #002C5B;
  margin-bottom: rem(16);
}

.rent-dialog-content {
  margin-bottom: rem(16);
}

.rent-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: rem(8);
}

// 반응형
@media (max-width: 600px) {
  .book-copy-item {
    flex-wrap: wrap;
  }
  
  .copy-info {
    order: 1;
    width: 100%;
    margin-top: rem(8);
  }
  
  .copy-user-info {
    order: 2;
    width: 100%;
    max-width: none;
    margin-top: rem(4);
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
</style>
