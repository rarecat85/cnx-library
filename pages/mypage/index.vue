<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="mypage">
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
                v-for="(record, index) in rentalHistory"
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
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

const { user } = useAuth()
const { returnBook, cancelRentRequest } = useBooks()
const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

const drawer = useState('navigationDrawer', () => false)
const drawerWidth = ref(280)

// 센터 필터
const centerOptions = [...CENTERS]
const selectedCenter = ref('')

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

// 반납 처리
const handleReturnBooks = async () => {
  if (selectedBooks.value.length === 0 || !user.value) return

  const bookTitles = selectedBooks.value.map(book => `${book.title} (${book.labelNumber || '-'})`).join('\n')
  if (!await confirm(`다음 도서들을 반납하시겠습니까?\n\n${bookTitles}`)) {
    return
  }

  try {
    returnLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
    for (const book of selectedBooks.value) {
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
    
    await alert(`${selectedBooks.value.length}권의 도서가 반납되었습니다.`, { type: 'success' })
    selectedBooks.value = []
  } catch (error) {
    console.error('반납 처리 오류:', error)
    await alert('반납 처리에 실패했습니다.', { type: 'error' })
  } finally {
    returnLoading.value = false
  }
}

// 개별 도서 반납 처리
const handleSingleReturn = async (book) => {
  if (!user.value || !book) return

  if (!await confirm(`"${book.title}"을(를) 반납하시겠습니까?\n라벨번호: ${book.labelNumber || '-'}`)) {
    return
  }

  try {
    returnLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
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
    
    // 목록 새로고침
    await Promise.all([
      loadRentedBooks(),
      loadRentalHistory()
    ])
    
    // 선택 목록에서도 제거
    selectedBooks.value = selectedBooks.value.filter(b => b.id !== book.id)
    
    await alert('도서가 반납되었습니다.', { type: 'success' })
  } catch (error) {
    console.error('반납 처리 오류:', error)
    await alert('반납 처리에 실패했습니다.', { type: 'error' })
  } finally {
    returnLoading.value = false
  }
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
    background-color: #e0e0e0;
    color: #9e9e9e;
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
</style>
