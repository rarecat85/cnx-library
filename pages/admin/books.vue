<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div>
        <h1 class="page-title mb-6">
          도서 관리
        </h1>

        <v-tabs
          v-model="tab"
          bg-color="primary"
          class="mb-4"
        >
          <v-tab value="search">검색/등록</v-tab>
          <v-tab value="list">등록된 도서 목록</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- 검색/등록 탭 -->
          <v-window-item value="search">
            <div class="search-section">
              <v-text-field
                v-model="searchQuery"
                label="도서 검색"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                :loading="searchLoading"
                class="mb-4"
                @keyup.enter="handleSearch"
              />
              <v-btn
                color="primary"
                block
                size="large"
                :loading="searchLoading"
                class="mb-4"
                @click="handleSearch"
              >
                검색
              </v-btn>

              <!-- 검색 결과 -->
              <div
                v-if="searchResults.length > 0"
                class="search-results"
              >
                <v-row>
                  <v-col
                    v-for="(book, index) in searchResults"
                    :key="index"
                    cols="12"
                    md="6"
                  >
                    <v-card class="book-card">
                      <v-row no-gutters>
                        <v-col cols="4">
                          <v-img
                            :src="book.image || '/placeholder-book.png'"
                            :alt="book.title"
                            height="150"
                            cover
                            class="book-image"
                          />
                        </v-col>
                        <v-col cols="8">
                          <v-card-text>
                            <div class="text-h6 mb-2">
                              {{ book.title }}
                            </div>
                            <div class="text-body-2 mb-1">
                              <strong>저자:</strong> {{ book.author }}
                            </div>
                            <div class="text-body-2 mb-1">
                              <strong>출판사:</strong> {{ book.publisher }}
                            </div>
                            <div class="text-body-2 mb-2">
                              <strong>출판일:</strong> {{ book.pubdate }}
                            </div>
                            <v-btn
                              color="primary"
                              size="small"
                              :loading="registerLoading === index"
                              @click="openRegisterDialog(book, index)"
                            >
                              등록하기
                            </v-btn>
                          </v-card-text>
                        </v-col>
                      </v-row>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- 검색 결과 없음 -->
              <v-alert
                v-if="searchQuery && !searchLoading && searchResults.length === 0 && !searchError"
                type="info"
                variant="tonal"
                class="mt-4"
              >
                검색 결과가 없습니다.
              </v-alert>

              <!-- 검색 오류 -->
              <v-alert
                v-if="searchError"
                type="error"
                variant="tonal"
                class="mt-4"
                closable
                @click:close="searchError = null"
              >
                {{ searchError }}
              </v-alert>
            </div>
          </v-window-item>

          <!-- 등록된 도서 목록 탭 -->
          <v-window-item value="list">
            <v-data-table
              :headers="tableHeaders"
              :items="registeredBooks"
              :loading="booksLoading"
              item-key="id"
              class="elevation-1"
            >
              <template #item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                >
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </div>
    </PageLayout>

    <!-- 등록 다이얼로그 -->
    <v-dialog
      v-model="registerDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>도서 등록</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedCenter"
            :items="centerOptions"
            label="센터 선택"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          />
          <div class="text-body-2">
            <strong>제목:</strong> {{ selectedBook?.title }}
          </div>
          <div class="text-body-2">
            <strong>저자:</strong> {{ selectedBook?.author }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="registerDialog = false"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            :loading="registerLoading !== null"
            @click="handleRegister"
          >
            등록
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
const { searchBooks, registerBook, getBooksByCenter, loading: booksLoading } = useNaverBooks()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

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

const tab = ref('search')
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchError = ref(null)

const registeredBooks = ref([])
const registerDialog = ref(false)
const selectedBook = ref(null)
const selectedCenter = ref('')
const registerLoading = ref(null)

const centerOptions = [
  '강남1센터',
  '강남2센터',
  '용산센터'
]

const tableHeaders = [
  { title: '제목', key: 'title', sortable: true },
  { title: '저자', key: 'author', sortable: true },
  { title: '센터', key: 'center', sortable: true },
  { title: '상태', key: 'status', sortable: true }
]

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

// 검색 실행
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  try {
    searchLoading.value = true
    searchError.value = null
    const result = await searchBooks(searchQuery.value, 1, 20)
    searchResults.value = result.items || []
  } catch (error) {
    console.error('도서 검색 오류:', error)
    searchError.value = error.message || '도서 검색에 실패했습니다.'
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// 등록 다이얼로그 열기
const openRegisterDialog = async (book, index) => {
  selectedBook.value = book
  registerLoading.value = index
  
  // 사용자 센터 정보 가져오기
  const userCenter = await getUserCenter()
  selectedCenter.value = userCenter || centerOptions[0]
  
  registerDialog.value = true
  registerLoading.value = null
}

// 도서 등록
const handleRegister = async () => {
  if (!selectedBook.value || !selectedCenter.value) {
    return
  }

  try {
    registerLoading.value = true
    await registerBook(selectedBook.value, selectedCenter.value)
    
    // 성공 메시지 표시 (간단한 알림)
    alert('도서가 성공적으로 등록되었습니다.')
    
    registerDialog.value = false
    selectedBook.value = null
    
    // 목록 탭으로 전환하고 목록 새로고침
    tab.value = 'list'
    await loadRegisteredBooks()
  } catch (error) {
    console.error('도서 등록 오류:', error)
    alert(error.message || '도서 등록에 실패했습니다.')
  } finally {
    registerLoading.value = null
  }
}

// 등록된 도서 목록 로드
const loadRegisteredBooks = async () => {
  try {
    const books = await getBooksByCenter()
    registeredBooks.value = books
  } catch (error) {
    console.error('도서 목록 로드 오류:', error)
  }
}

// 상태 색상 반환
const getStatusColor = (status) => {
  switch (status) {
    case 'available':
      return 'success'
    case 'rented':
      return 'warning'
    case 'reserved':
      return 'info'
    default:
      return 'grey'
  }
}

// 상태 텍스트 반환
const getStatusText = (status) => {
  switch (status) {
    case 'available':
      return '대여 가능'
    case 'rented':
      return '대여 중'
    case 'reserved':
      return '예약됨'
    default:
      return '알 수 없음'
  }
}

// 목록 탭 활성화 시 도서 목록 로드
watch(tab, (newTab) => {
  if (newTab === 'list') {
    loadRegisteredBooks()
  }
})

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

.page-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.search-section {
  margin-top: rem(16);
}

.book-card {
  margin-bottom: rem(16);
}

.book-image {
  object-fit: cover;
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
