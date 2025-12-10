<template>
  <v-app>
    <PageLayout
      header-type="home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="home-page">
        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              {{ currentCenter }} 신규 도서
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

        <!-- 신규 도서 스와이퍼 -->
        <div class="new-books-section">
          <BookListSwiper
            :books="newBooks"
            :center="currentCenter"
            :registered-books="newBooks"
            :loading="newBooksLoading"
            :empty-message="'신규 입고된 도서가 없습니다.'"
            nav-id="new-books"
            :show-action="false"
            :show-status-flags="true"
            :show-rent-button="true"
            :hide-overdue-status="true"
            @rent="handleRent"
          />
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
  middleware: 'auth'
})

const { user } = useAuth()
const { getBooksByCenter, rentBook, requestRent } = useNaverBooks()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// 대여 처리 로딩 상태
const rentLoading = ref(false)

const drawer = useState('navigationDrawer', () => false)

// 반응형 drawer 너비 계산
const drawerWidth = ref(280)

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

// 센터 관련
const centerOptions = [
  '강남1센터',
  '강남2센터',
  '용산센터'
]
const currentCenter = ref('')
const userCenter = ref('')

// 신규 도서 관련
const newBooks = ref([])
const newBooksLoading = ref(false)

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
  
  await loadNewBooks()
})

// 센터 변경 처리
const handleCenterChange = async () => {
  await loadNewBooks()
}

// 신규 도서 로드 (등록일 기준 한 달 이내)
const loadNewBooks = async () => {
  try {
    newBooksLoading.value = true
    const books = await getBooksByCenter(currentCenter.value)
    
    // 한 달 이내 등록된 도서만 필터링
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    newBooks.value = books.filter(book => {
      if (book.registeredAt) {
        const registeredDate = book.registeredAt?.toDate?.() || new Date(book.registeredAt)
        return registeredDate >= oneMonthAgo
      }
      return false
    })
  } catch (error) {
    console.error('신규 도서 로드 오류:', error)
    newBooks.value = []
  } finally {
    newBooksLoading.value = false
  }
}

// 도서 대여 처리
const handleRent = async (book) => {
  if (!user.value || !book) return
  
  // 사용자 센터와 도서 센터가 같은지 확인
  const isSameCenter = userCenter.value === currentCenter.value
  
  const confirmMessage = isSameCenter 
    ? `"${book.title}"을(를) 대여 신청하시겠습니까?`
    : `다른 센터의 도서입니다. "${book.title}"을(를) 대여 신청하시겠습니까?\n(관리자 승인 후 대여 가능)`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  try {
    rentLoading.value = true
    
    const bookId = book.id || book.isbn13 || book.isbn
    
    if (isSameCenter) {
      // 같은 센터: 바로 대여 처리
      await rentBook(bookId, user.value.uid)
      await loadNewBooks()
      alert('도서 대여가 완료되었습니다.')
    } else {
      // 다른 센터: 대여 신청 처리
      await requestRent(bookId, user.value.uid)
      await loadNewBooks()
      alert('도서 대여가 신청되었습니다.\n관리자 승인 후 대여가 완료됩니다.')
    }
  } catch (err) {
    console.error('대여 신청 오류:', err)
    alert(err.message || '대여 신청에 실패했습니다.')
  } finally {
    rentLoading.value = false
  }
}

// 페이지 메타데이터
useHead({
  title: '홈 - CNX Library',
  meta: [
    { name: 'description', content: 'CNX Library 도서 관리 시스템' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.home-page {
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
      width: 100%;
      max-width: 100%;
      
      :deep(.v-input) {
        width: 100%;
        max-width: 100%;
      }
    }
  }
}

.new-books-section {
  margin-top: rem(24);
  
  :deep(.book-list-swiper-section) {
    border-top: none;
    padding-top: 0;
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
