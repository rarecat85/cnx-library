<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="mypage">
        <!-- 반납 처리 다이얼로그 -->
        <v-dialog
          v-model="returnDialog"
          max-width="500"
        >
          <v-card class="rent-confirm-card">
            <v-card-title class="rent-confirm-title">
              반납 확인
            </v-card-title>
            
            <v-card-text class="rent-confirm-content">
              <div class="rent-confirm-info mb-4">
                <p>아래 도서들을 반납하시겠습니까?</p>
              </div>
              
              <div class="multi-rent-book-list">
                <div
                  v-for="book in returnDialogBooks"
                  :key="book.id"
                  class="rent-book-card"
                >
                  <div class="rent-book-card-inner">
                    <img
                      v-if="book.cover || book.image"
                      :src="book.cover || book.image"
                      :alt="book.title"
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
                        {{ book.title }}
                      </div>
                      <div
                        v-if="book.author"
                        class="rent-book-author"
                      >
                        <strong>저자:</strong> {{ book.author }}
                      </div>
                      <div
                        v-if="book.publisher"
                        class="rent-book-publisher"
                      >
                        <strong>출판사:</strong> {{ book.publisher }}
                      </div>
                      <div class="rent-book-details">
                        <span class="detail-item">
                          <v-icon
                            size="x-small"
                            class="mr-1"
                          >mdi-label</v-icon>
                          {{ book.labelNumber || '라벨없음' }}
                        </span>
                        <span class="detail-item location-item">
                          <v-icon
                            size="x-small"
                            class="mr-1"
                          >mdi-map-marker</v-icon>
                          <span class="location-text">{{ formatLocation(book.location) || '위치없음' }}</span>
                          <v-icon
                            v-if="hasLocationImage(selectedCenter || getCenterFromBook(book), book.location)"
                            size="x-small"
                            class="ml-1 location-info-icon"
                            @click.stop="openLocationPopupForBook(book)"
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
                위치와 라벨번호를 확인 후 해당 위치에 도서를 반납해주세요.
              </v-alert>
            </v-card-text>
            
            <v-card-actions class="rent-confirm-actions">
              <v-spacer />
              <v-btn
                variant="text"
                @click="closeReturnDialog"
              >
                취소
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                :loading="returnDialogLoading"
                @click="confirmReturnBooks"
              >
                반납하기
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- 페이지 헤더 -->
        <div class="page-header mb-6">
          <div class="page-header-inner">
            <h1 class="page-title mb-0">
              마이페이지
            </h1>
            <v-btn
              class="edit-profile-btn"
              variant="flat"
              size="small"
              to="/mypage/edit"
            >
              정보수정
            </v-btn>
          </div>
        </div>

        <!-- 내 대여 목록 섹션 -->
        <div class="rental-section mb-8">
          <div class="section-header-with-filter mb-4">
            <h2 class="section-title">
              내 대여 목록
            </h2>
            <v-select
              v-model="selectedCenter"
              :items="centerOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              class="center-filter-select"
            />
          </div>
          
          <!-- 대여 정보 및 반납하기 영역 -->
          <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
            <div class="text-body-1">
              총 <strong>{{ filteredRentedBooks.length }}</strong>권 대여중
              <span
                v-if="selectedBooks.length > 0"
                class="text-body-2 ml-2 text-medium-emphasis"
              >
                ({{ selectedBooks.length }}권 선택됨)
              </span>
            </div>
            <v-btn
              v-if="filteredRentedBooks.length > 0"
              class="return-btn"
              variant="flat"
              size="small"
              :disabled="selectedBooks.length === 0"
              :loading="returnLoading"
              @click="handleReturnBooks"
            >
              반납하기
            </v-btn>
          </div>

          <div
            v-if="rentedBooksLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-else-if="filteredRentedBooks.length > 0"
            class="rental-books-grid"
          >
            <v-row class="book-list-row">
              <v-col
                v-for="(book, index) in filteredRentedBooks"
                :key="`rented-${index}`"
                cols="12"
                sm="6"
                class="book-list-col"
              >
                <BookCard
                  :book="book"
                  :center="book.center || ''"
                  :show-action="false"
                  :selectable="true"
                  :selected="isBookSelected(book)"
                  :show-status-flags="false"
                  :show-return-date="true"
                  :return-date="getReturnDate(book)"
                  :show-label-number="true"
                  :label-number="book.labelNumber"
                  :show-location="true"
                  :location="book.location"
                  location-popup-mode="info"
                  @select="handleBookSelect"
                  @return="handleSingleReturn"
                />
              </v-col>
            </v-row>
          </div>
          <div
            v-else
            class="text-center py-8 text-medium-emphasis empty-state"
          >
            현재 대여중인 도서가 없습니다.
          </div>
        </div>

        <!-- 내가 신청한 책 목록 섹션 -->
        <div class="requested-section mb-8">
          <div class="section-header mb-4">
            <h2 class="section-title">
              내가 신청한 책
            </h2>
          </div>
          
          <div
            v-if="requestedBooksLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-else-if="myRequestedBooks.length > 0"
            class="requested-books-grid"
          >
            <v-row class="book-list-row">
              <v-col
                v-for="(book, index) in myRequestedBooks"
                :key="`requested-${index}`"
                cols="12"
                sm="6"
                class="book-list-col"
              >
                <div class="requested-book-item">
                  <BookCard
                    :book="book"
                    :center="book.center || ''"
                    :show-action="false"
                    :selectable="false"
                    :show-status-flags="false"
                    :show-label-number="!!book.labelNumber"
                    :label-number="book.labelNumber"
                    :show-location="!!book.location"
                    :location="book.location"
                  />
                  <div class="requested-book-actions">
                    <div class="requested-info">
                      <v-icon
                        size="small"
                        class="mr-1"
                      >
                        mdi-clock-outline
                      </v-icon>
                      {{ formatRequestedDate(book.requestedAt) }}
                    </div>
                    <v-btn
                      color="error"
                      variant="outlined"
                      size="small"
                      :loading="cancelRequestLoading === book.id"
                      @click="handleCancelRequest(book)"
                    >
                      신청 취소
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
          <div
            v-else
            class="text-center py-8 text-medium-emphasis empty-state"
          >
            신청한 도서가 없습니다.
          </div>
        </div>

        <!-- 읽은 책 목록 섹션 -->
        <div class="history-section">
          <div class="section-header mb-4">
            <h2 class="section-title">
              읽은 책 목록
            </h2>
          </div>
          
          <!-- 읽은 책 정보 및 삭제 영역 -->
          <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
            <div class="text-body-1">
              총 <strong>{{ rentalHistory.length }}</strong>권
              <span
                v-if="selectedHistoryBooks.length > 0"
                class="text-body-2 ml-2 text-medium-emphasis"
              >
                ({{ selectedHistoryBooks.length }}권 선택됨)
              </span>
            </div>
            <v-btn
              v-if="rentalHistory.length > 0"
              class="delete-history-btn"
              variant="flat"
              size="small"
              :disabled="selectedHistoryBooks.length === 0"
              :loading="deleteHistoryLoading"
              @click="handleDeleteHistory"
            >
              삭제하기
            </v-btn>
          </div>

          <div
            v-if="historyLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-else-if="rentalHistory.length > 0"
            class="history-books-grid"
          >
            <v-row class="book-list-row">
              <v-col
                v-for="record in rentalHistory"
                :key="`history-${record.id}`"
                cols="12"
                sm="6"
                class="book-list-col"
              >
                <BookCard
                  :book="record"
                  :center="record.center || ''"
                  :show-action="false"
                  :selectable="true"
                  :selected="isHistoryBookSelected(record)"
                  :show-status-flags="false"
                  @select="handleHistoryBookSelect"
                />
              </v-col>
            </v-row>
          </div>
          <div
            v-else
            class="text-center py-8 text-medium-emphasis empty-state"
          >
            아직 읽은 책이 없습니다.
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
    
    <!-- 위치 안내 팝업 (반납 다이얼로그용) -->
    <LocationGuidePopup
      v-model="locationPopupVisible"
      :center="locationPopupCenter"
      :location="locationPopupLocation"
      mode="return"
    />
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'
import { formatLocation } from '@/utils/labelConfig.js'
import { hasLocationImage } from '@/utils/locationCoordinates.js'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

const { user } = useAuth()
const { returnBook, cancelRentRequest } = useBooks()
const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

// 반납 다이얼로그 관련
const returnDialog = ref(false)
const returnDialogBooks = ref([])
const returnDialogLoading = ref(false)

// 센터 필터
const centerOptions = [...CENTERS]
const selectedCenter = ref('')

// 위치 안내 팝업
const locationPopupVisible = ref(false)
const locationPopupCenter = ref('')
const locationPopupLocation = ref('')

const getCenterFromBook = (book) => {
  return book.center || ''
}

const openLocationPopupForBook = (book) => {
  locationPopupCenter.value = selectedCenter.value || book.center || ''
  locationPopupLocation.value = book.location || ''
  locationPopupVisible.value = true
}

// 대여중인 도서
const rentedBooks = ref([])
const rentedBooksLoading = ref(false)

// 내가 신청한 도서
const myRequestedBooks = ref([])
const requestedBooksLoading = ref(false)
const cancelRequestLoading = ref(null)

// 센터별 필터링된 대여 도서
const filteredRentedBooks = computed(() => {
  if (!selectedCenter.value) {
    return rentedBooks.value
  }
  return rentedBooks.value.filter(book => book.center === selectedCenter.value)
})

// 읽은 책 목록 (대여 이력) - ISBN 기준 중복 제거
const rentalHistory = ref([])
const historyLoading = ref(false)

// 선택된 도서 (반납용)
const selectedBooks = ref([])

// 선택된 읽은 책 (삭제용)
const selectedHistoryBooks = ref([])
const deleteHistoryLoading = ref(false)
const returnLoading = ref(false)

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

// 센터 변경 시 선택된 도서 초기화
watch(selectedCenter, () => {
  selectedBooks.value = []
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
  selectedCenter.value = workplace ? getCenterByWorkplace(workplace) : centerOptions[0]
  
  await Promise.all([
    loadRentedBooks(),
    loadMyRequestedBooks(),
    loadRentalHistory()
  ])
})

// 내가 신청한 도서 로드 (대여신청 상태의 도서)
const loadMyRequestedBooks = async () => {
  if (!user.value || !firestore) return

  try {
    requestedBooksLoading.value = true
    
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    
    // books 컬렉션에서 내가 신청한 도서 조회
    const booksRef = collection(firestore, 'books')
    const q = query(
      booksRef,
      where('requestedBy', '==', user.value.uid),
      where('status', '==', 'requested')
    )
    
    const snapshot = await getDocs(q)
    const books = []
    
    snapshot.forEach((doc) => {
      books.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    // 신청일 기준 내림차순 정렬
    books.sort((a, b) => {
      const dateA = a.requestedAt?.toDate?.() || new Date(0)
      const dateB = b.requestedAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })
    
    myRequestedBooks.value = books
  } catch (error) {
    console.error('신청 도서 로드 오류:', error)
    myRequestedBooks.value = []
  } finally {
    requestedBooksLoading.value = false
  }
}

// 대여중인 도서 로드
const loadRentedBooks = async () => {
  if (!user.value || !firestore) return

  try {
    rentedBooksLoading.value = true
    
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const booksRef = collection(firestore, 'books')
    const q = query(
      booksRef,
      where('rentedBy', '==', user.value.uid)
    )
    
    const snapshot = await getDocs(q)
    const books = []
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.rentedAt) {
        books.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    // 대여일 기준 내림차순 정렬
    books.sort((a, b) => {
      const dateA = a.rentedAt?.toDate?.() || new Date(0)
      const dateB = b.rentedAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })
    
    rentedBooks.value = books
  } catch (error) {
    console.error('대여 도서 로드 오류:', error)
    rentedBooks.value = []
  } finally {
    rentedBooksLoading.value = false
  }
}

// 대여 이력 로드 (반납 완료된 도서) - ISBN 기준 중복 제거
const loadRentalHistory = async () => {
  if (!user.value || !firestore) return

  try {
    historyLoading.value = true
    
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const historyRef = collection(firestore, 'rentalHistory')
    const q = query(
      historyRef,
      where('userId', '==', user.value.uid)
    )
    
    const snapshot = await getDocs(q)
    // ISBN 기준 중복 제거
    const historyMap = new Map()
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      // ISBN 기준으로 중복 체크 (isbn13 우선, 없으면 isbn)
      const isbn = data.isbn13 || data.isbn || ''
      
      if (!isbn) {
        // ISBN이 없는 경우 bookId로 처리 (기존 데이터 호환)
        const bookId = data.bookId
      if (!historyMap.has(bookId)) {
        historyMap.set(bookId, {
            id: doc.id,
            ...data
          })
        }
        return
      }
      
      // 같은 ISBN의 책이 여러 개 있으면 가장 최근 반납 기록만 유지
      if (!historyMap.has(isbn)) {
        historyMap.set(isbn, {
          id: doc.id,
          ...data
        })
      } else {
        const existing = historyMap.get(isbn)
        const existingDate = existing.returnedAt?.toDate?.() || new Date(0)
        const currentDate = data.returnedAt?.toDate?.() || new Date(0)
        
        if (currentDate > existingDate) {
          historyMap.set(isbn, {
            id: doc.id,
            ...data
          })
        }
      }
    })
    
    const history = Array.from(historyMap.values())
    
    // 반납일 기준 내림차순 정렬
    history.sort((a, b) => {
      const dateA = a.returnedAt?.toDate?.() || new Date(0)
      const dateB = b.returnedAt?.toDate?.() || new Date(0)
      return dateB - dateA
    })
    
    rentalHistory.value = history
  } catch (error) {
    console.error('대여 이력 로드 오류:', error)
    rentalHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

// 신청일 포맷
const formatRequestedDate = (requestedAt) => {
  if (!requestedAt) return ''
  
  const date = requestedAt?.toDate?.() || new Date(requestedAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day} 신청`
}

// 반납예정일 계산 (대여일 + 7일)
const getReturnDate = (book) => {
  if (!book.rentedAt) return null
  
  const rentedDate = book.rentedAt?.toDate?.() || new Date(book.rentedAt)
  const returnDate = new Date(rentedDate)
  returnDate.setDate(returnDate.getDate() + 7)
  
  return returnDate
}

// 도서 선택 여부 확인
const isBookSelected = (book) => {
  return selectedBooks.value.some(selected => selected.id === book.id)
}

// 도서 선택 처리
const handleBookSelect = (book, selected) => {
  if (selected) {
    if (!isBookSelected(book)) {
      selectedBooks.value.push(book)
    }
  } else {
    selectedBooks.value = selectedBooks.value.filter(b => b.id !== book.id)
  }
}

// 읽은 책 선택 여부 확인
const isHistoryBookSelected = (record) => {
  return selectedHistoryBooks.value.some(selected => selected.id === record.id)
}

// 읽은 책 선택 처리
const handleHistoryBookSelect = (record, selected) => {
  if (selected) {
    if (!isHistoryBookSelected(record)) {
      selectedHistoryBooks.value.push(record)
    }
  } else {
    selectedHistoryBooks.value = selectedHistoryBooks.value.filter(r => r.id !== record.id)
  }
}

// 대여 신청 취소
const handleCancelRequest = async (book) => {
  if (!user.value || !book) return

  if (!await confirm(`"${book.title}" 대여 신청을 취소하시겠습니까?`)) {
    return
  }

  try {
    cancelRequestLoading.value = book.id
    
    const labelNumber = book.labelNumber || book.id.split('_')[0]
    await cancelRentRequest(labelNumber, book.center, user.value.uid)
    
    // 목록에서 제거
    myRequestedBooks.value = myRequestedBooks.value.filter(b => b.id !== book.id)
    
    await alert('대여 신청이 취소되었습니다.', { type: 'success' })
  } catch (error) {
    console.error('신청 취소 오류:', error)
    await alert(error.message || '신청 취소에 실패했습니다.', { type: 'error' })
  } finally {
    cancelRequestLoading.value = null
  }
}

// 읽은 책 이력 삭제
const handleDeleteHistory = async () => {
  if (selectedHistoryBooks.value.length === 0 || !user.value) return

  const bookTitles = selectedHistoryBooks.value.map(record => record.title).join(', ')
  if (!await confirm(`다음 도서들을 읽은 책 목록에서 삭제하시겠습니까?\n\n${bookTitles}`)) {
    return
  }

  try {
    deleteHistoryLoading.value = true
    
    const { doc, deleteDoc } = await import('firebase/firestore')
    
    for (const record of selectedHistoryBooks.value) {
      await deleteDoc(doc(firestore, 'rentalHistory', record.id))
    }
    
    // 목록 새로고침
    await loadRentalHistory()
    
    await alert(`${selectedHistoryBooks.value.length}권이 읽은 책 목록에서 삭제되었습니다.`, { type: 'success' })
    selectedHistoryBooks.value = []
  } catch (error) {
    console.error('이력 삭제 오류:', error)
    await alert('삭제에 실패했습니다.', { type: 'error' })
  } finally {
    deleteHistoryLoading.value = false
  }
}

// 반납 다이얼로그 열기
const handleReturnBooks = () => {
  if (selectedBooks.value.length === 0 || !user.value) return
  returnDialogBooks.value = [...selectedBooks.value]
  returnDialog.value = true
}

// 반납 다이얼로그 닫기
const closeReturnDialog = () => {
  returnDialog.value = false
  returnDialogBooks.value = []
}

// 반납 확인 처리
const confirmReturnBooks = async () => {
  if (returnDialogBooks.value.length === 0 || !user.value) return

  try {
    returnDialogLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
    for (const book of returnDialogBooks.value) {
      // 1. 도서 상태 업데이트 (대여 정보 제거)
      const bookRef = doc(firestore, 'books', book.id)
      await updateDoc(bookRef, {
        status: 'available',
        rentedBy: deleteField(),
        rentedAt: deleteField(),
        expectedReturnDate: deleteField()
      })
      
      // 2. 대여 이력 확인 (ISBN 기준)
      const historyRef = collection(firestore, 'rentalHistory')
      const isbn = book.isbn13 || book.isbn || ''
      const historyQuery = query(
        historyRef,
        where('userId', '==', user.value.uid),
        where('isbn13', '==', isbn)
      )
      const historySnapshot = await getDocs(historyQuery)
      
      if (historySnapshot.empty) {
        // 새로운 책이면 이력 추가
        await addDoc(historyRef, {
          bookId: book.id,
          labelNumber: book.labelNumber || '',
          isbn13: book.isbn13 || '',
          isbn: book.isbn || '',
          title: book.title || '',
          author: book.author || '',
          publisher: book.publisher || '',
          cover: book.cover || book.image || '',
          center: book.center || '',
          userId: user.value.uid,
          rentedAt: book.rentedAt,
          returnedAt: serverTimestamp(),
          rentCount: 1
        })
      } else {
        // 이미 읽은 책이면 반납일과 대여 횟수만 업데이트
        const existingDoc = historySnapshot.docs[0]
        const existingData = existingDoc.data()
        await updateDoc(doc(firestore, 'rentalHistory', existingDoc.id), {
          rentedAt: book.rentedAt,
          returnedAt: serverTimestamp(),
          rentCount: (existingData.rentCount || 1) + 1
        })
      }
    }
    
    // 목록 새로고침
    await Promise.all([
      loadRentedBooks(),
      loadRentalHistory()
    ])
    
    const returnedCount = returnDialogBooks.value.length
    selectedBooks.value = selectedBooks.value.filter(book => 
      !returnDialogBooks.value.some(rb => rb.id === book.id)
    )
    closeReturnDialog()
    
    await alert(`${returnedCount}권의 도서가 반납되었습니다.`, { type: 'success' })
  } catch (error) {
    console.error('반납 처리 오류:', error)
    await alert('반납 처리에 실패했습니다.', { type: 'error' })
  } finally {
    returnDialogLoading.value = false
  }
}

// 개별 도서 반납 처리 - 다이얼로그 열기
const handleSingleReturn = (book) => {
  if (!user.value || !book) return
  returnDialogBooks.value = [book]
  returnDialog.value = true
}

// 페이지 메타데이터
useHead({
  title: '마이페이지 - CNX Library',
  meta: [
    { name: 'description', content: '내 대여 목록 및 읽은 책 이력' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.mypage {
  width: 100%;
}

.page-header {
  padding-bottom: rem(16);
  border-bottom: rem(1) solid #e0e0e0;
}

.page-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: rem(16);
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

.section-header {
  padding-bottom: rem(8);
}

.section-header-with-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: rem(10);
  padding-bottom: rem(8);
  
  .section-title {
    flex: 1;
    min-width: 0;
  }
  
  .center-filter-select {
    flex: 0 0 calc(30% - rem(5));
    min-width: rem(120);
    
    :deep(.v-input) {
      width: 100%;
    }
  }
  
  @media (max-width: 600px) {
    .center-filter-select {
      flex: 0 0 rem(120);
    }
  }
}

.section-title {
  font-size: rem(20);
  font-weight: 600;
  color: #002C5B;
  margin: 0;
  
  @media (max-width: 480px) {
    font-size: rem(18);
  }
}

.edit-profile-btn,
.return-btn,
.delete-history-btn {
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

.rental-section,
.requested-section,
.history-section {
  padding-top: rem(16);
}

.requested-section,
.history-section {
  border-top: rem(1) solid #e0e0e0;
}

// 신청 도서 아이템
.requested-book-item {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.requested-book-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(12) rem(16);
  background: #f5f5f5;
  border-radius: 0 0 rem(8) rem(8);
  margin-top: rem(-8);
}

.requested-info {
  display: flex;
  align-items: center;
  font-size: rem(12);
  color: #666;
}

.empty-state {
  background-color: #F5F5F5;
  border-radius: rem(8);
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

// 반납 다이얼로그 스타일 (대여 확인 다이얼로그와 동일)
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

.rent-confirm-actions {
  padding: rem(8) rem(24) rem(20);
}

// 도서 카드 스타일
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

// 다권 반납 목록 스타일
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
</style>
