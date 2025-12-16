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
                대여중 <strong>{{ rentedCount }}</strong>권, 연체중 <strong>{{ overdueCount }}</strong>권, 대여신청 <strong>{{ requestedCount }}</strong>권
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
                  :show-status-flags="true"
                  :renter-info="getRenterInfo(book)"
                  :requester-info="getRequesterInfo(book)"
                  :return-date="getReturnDate(book)"
                  :show-admin-rent-button="true"
                  :show-admin-return-button="true"
                  @select="handleBookSelect"
                  @admin-rent="openRentDialog"
                  @admin-return="handleSingleReturn"
                />
              </v-col>
            </v-row>
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
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'

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
    
    // 대여중인 도서의 대여자 정보 로드
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
  
  // 대여중인 도서들의 rentedBy 수집
  const renterIds = [...new Set(
    books
      .filter(book => book.rentedBy)
      .map(book => book.rentedBy)
  )]
  
  // 신청중인 도서들의 requestedBy 수집
  const requesterIds = [...new Set(
    books
      .filter(book => book.requestedBy)
      .map(book => book.requestedBy)
  )]
  
  // 모든 사용자 ID 합치기 (중복 제거)
  const allUserIds = [...new Set([...renterIds, ...requesterIds])]
  
  // 각 사용자 정보 가져오기
  for (const userId of allUserIds) {
    // 이미 캐시에 있으면 스킵
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

// 반납예정일 계산 (대여일 + 7일)
const getReturnDate = (book) => {
  if (!book.rentedAt) return null
  
  const rentedDate = book.rentedAt?.toDate?.() || new Date(book.rentedAt)
  const returnDate = new Date(rentedDate)
  returnDate.setDate(returnDate.getDate() + 7)
  
  return returnDate
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
  } else if (sortBy.value === 'requested') {
    // 대여신청 도서만 필터링
    books = books.filter(book => {
      const status = calculateBookStatus(book)
      return status === 'requested'
    })
    // 신청일 기준 최신순 정렬
      books.sort((a, b) => {
      const dateA = a.requestedAt?.toDate?.() || new Date(0)
      const dateB = b.requestedAt?.toDate?.() || new Date(0)
      return dateB - dateA
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

  // 삭제 가능한 도서와 불가능한 도서 분리
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

  // 모든 도서가 삭제 불가능한 경우
  if (deletableBooks.length === 0) {
    const reasons = undeletableBooks.map(item => 
      `• ${item.book.title} (${item.reason})`
    ).join('\n')
    await alert(`선택한 도서를 삭제할 수 없습니다.\n\n${reasons}\n\n대여중/대여신청중인 도서는 반납 또는 신청 취소 후 삭제해주세요.`, { type: 'warning' })
    return
  }

  // 일부 도서만 삭제 가능한 경우
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
      const isbn = book.isbn13 || book.isbn
      return deleteBook(isbn, currentCenter.value)
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
// 다중 대여 처리 (다이얼로그 열기)
const handleRentBooks = async () => {
  if (selectedBooks.value.length === 0) return
  
  // 이미 대여중인 도서 필터링
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

// 개별 대여 처리 (다이얼로그 열기)
const openRentDialog = async (book) => {
  const status = calculateBookStatus(book)
  
  // 대여 신청된 도서인 경우 신청자 정보로 바로 대여 처리
  if (status === 'requested' && book.requestedBy) {
    if (!await confirm(`신청자 정보로 대여 처리하시겠습니까?\n\n도서: ${book.title}\n신청자: ${getRequesterInfo(book)}`)) {
      return
    }
    
    try {
      actionLoading.value = true
      
      const { doc, setDoc, serverTimestamp, deleteField } = await import('firebase/firestore')
      const bookId = book.id || book.isbn13 || book.isbn
      const bookRef = doc(firestore, 'books', bookId)
      
      await setDoc(bookRef, {
        status: 'rented',
        rentedBy: book.requestedBy,
        rentedAt: serverTimestamp(),
        requestedBy: deleteField(),
        requestedAt: deleteField(),
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      await loadRegisteredBooks()
      await alert('대여 처리가 완료되었습니다.', { type: 'success' })
    } catch (error) {
      console.error('대여 처리 오류:', error)
      await alert('대여 처리에 실패했습니다.', { type: 'error' })
    } finally {
      actionLoading.value = false
    }
    return
  }
  
  // 일반 대여 처리 (다이얼로그 열기)
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
    
    // 센터와 이메일이 모두 일치하는 사용자 찾기
    const { collection, query, where, getDocs, doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const usersRef = collection(firestore, 'users')
    
    // 먼저 이메일로만 검색하여 사용자 존재 여부 확인
    const emailQuery = query(usersRef, where('email', '==', rentFormEmail.value))
    const emailSnapshot = await getDocs(emailQuery)
    
    if (emailSnapshot.empty) {
      rentFormError.value = '해당 이메일의 사용자를 찾을 수 없습니다.'
      return
    }
    
    // 해당 사용자의 센터 확인
    const userData = emailSnapshot.docs[0].data()
    if (userData.center !== rentFormCenter.value) {
      rentFormError.value = `해당 사용자는 ${userData.center} 소속입니다.`
      return
    }
    
    const targetUser = emailSnapshot.docs[0]
    const targetUserId = targetUser.id
    
    // 선택된 도서들 대여 처리
    for (const book of rentDialogBooks.value) {
      const bookId = book.id || book.isbn13 || book.isbn
      const bookRef = doc(firestore, 'books', bookId)
      
      await setDoc(bookRef, {
        status: 'rented',
        rentedBy: targetUserId,
        rentedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })
    }
    
    // 대여 처리된 도서 수 저장
    const rentedBookCount = rentDialogBooks.value.length
    
    // 목록 새로고침 및 다이얼로그 닫기
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

  // 대여중인 도서만 필터링
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
      const bookId = book.id || book.isbn13 || book.isbn
      const rentedBy = book.rentedBy
      const rentedAt = book.rentedAt
      
      // 1. 도서 상태 업데이트 (대여 정보 제거)
      const bookRef = doc(firestore, 'books', bookId)
      await updateDoc(bookRef, {
        status: 'available',
        rentedBy: deleteField(),
        rentedAt: deleteField()
      })
      
      // 2. 대여자의 rentalHistory에 반납 기록 추가/업데이트
      if (rentedBy) {
        const historyRef = collection(firestore, 'rentalHistory')
        const historyQuery = query(
          historyRef,
          where('userId', '==', rentedBy),
          where('bookId', '==', bookId)
        )
        const historySnapshot = await getDocs(historyQuery)
        
        if (historySnapshot.empty) {
          // 새로운 기록 추가
          await addDoc(historyRef, {
            bookId: bookId,
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

  if (!await confirm(`"${book.title}" 도서를 반납 처리하시겠습니까?`)) {
    return
  }

  try {
    actionLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
    const bookId = book.id || book.isbn13 || book.isbn
    const rentedBy = book.rentedBy
    const rentedAt = book.rentedAt
    
    // 1. 도서 상태 업데이트 (대여 정보 제거)
    const bookRef = doc(firestore, 'books', bookId)
    await updateDoc(bookRef, {
      status: 'available',
      rentedBy: deleteField(),
      rentedAt: deleteField()
    })
    
    // 2. 대여자의 rentalHistory에 반납 기록 추가/업데이트
    if (rentedBy) {
      const historyRef = collection(firestore, 'rentalHistory')
      const historyQuery = query(
        historyRef,
        where('userId', '==', rentedBy),
        where('bookId', '==', bookId)
      )
      const historySnapshot = await getDocs(historyQuery)
      
      if (historySnapshot.empty) {
        // 새로운 기록 추가
        await addDoc(historyRef, {
          bookId: bookId,
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

/* 대여 다이얼로그 스타일 */
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
</style>
