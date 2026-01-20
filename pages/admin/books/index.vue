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
                <!-- 라벨번호순 또는 위치별보기 선택 시 오름차순/내림차순 셀렉트박스 -->
                <v-select
                  v-if="sortBy === 'label' || sortBy === 'location'"
                  v-model="sortOrder"
                  :items="sortOrderOptions"
                  label="정렬"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="sort-order-select"
                />
                <!-- 위치별보기 선택 시 칸 선택 셀렉트박스 -->
                <v-select
                  v-if="sortBy === 'location'"
                  v-model="selectedLocationFilter"
                  :items="locationFilterOptions"
                  label="위치"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="location-filter-select"
                />
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
            class="registered-books-section"
          >
            <div class="registered-books-grid">
              <!-- ISBN 그룹핑된 도서 목록 -->
              <div
                v-for="(group, index) in displayedGroupedBooks"
                :key="`group-${index}`"
                class="book-card"
                :class="{ 'book-card-selected': isGroupSelected(group) || isGroupPartiallySelected(group) }"
              >
                <!-- 책 정보 영역 (클릭 시 전체 선택) -->
                <div
                  class="book-card-header"
                  @click="handleGroupHeaderClick(group)"
                >
                  <img
                    v-if="group.image"
                    :src="group.image"
                    :alt="group.title"
                    class="book-thumbnail"
                  >
                  <div
                    v-else
                    class="book-thumbnail-placeholder"
                  >
                    <span>NO IMAGE</span>
                  </div>
                  <div class="book-meta">
                    <div class="book-title">
                      {{ group.title }}
                    </div>
                    <div
                      v-if="group.author"
                      class="book-author"
                    >
                      <strong>저자:</strong> {{ group.author }}
                    </div>
                    <div
                      v-if="group.publisher"
                      class="book-publisher"
                    >
                      <strong>출판사:</strong> {{ group.publisher }}
                    </div>
                    <div class="book-count">
                      등록 {{ group.totalCount }}권
                    </div>
                  </div>
                </div>

                <!-- 라벨별 도서 정보 (항상 표시) -->
                <div class="book-copies-list">
                  <div
                    v-for="book in group.copies"
                    :key="book.id"
                    class="book-copy-item"
                    :class="{ 'selected': isBookSelected(book) }"
                    @click="handleCopyItemClick(book)"
                  >
                    <div class="copy-content">
                      <!-- 1줄: 상태 플래그 + 정보수정 링크 -->
                      <div class="copy-row-top">
                        <div class="copy-status">
                          <v-chip
                            v-if="getBookStatus(book) === 'rented'"
                            size="x-small"
                            color="primary"
                            variant="flat"
                          >
                            대여중
                          </v-chip>
                          <v-chip
                            v-else-if="getBookStatus(book) === 'overdue'"
                            size="x-small"
                            color="error"
                            variant="flat"
                          >
                            연체중
                          </v-chip>
                          <v-chip
                            v-else-if="getBookStatus(book) === 'requested'"
                            size="x-small"
                            color="warning"
                            variant="flat"
                          >
                            대여신청
                          </v-chip>
                          <v-chip
                            v-else
                            size="x-small"
                            color="success"
                            variant="outlined"
                          >
                            대여가능
                          </v-chip>
                          <span
                            v-if="getRenterInfo(book) || getRequesterInfo(book)"
                            class="copy-user-info"
                          >
                            {{ getRenterInfo(book) || getRequesterInfo(book) }}
                          </span>
                        </div>
                        <a
                          href="#"
                          class="copy-edit-link"
                          @click.prevent.stop="openEditDialog(book)"
                        >
                          정보수정
                        </a>
                      </div>
                      <!-- 2줄: 라벨번호 | 위치 -->
                      <div class="copy-info-row">
                        <span class="copy-label-number">{{ book.labelNumber || '라벨없음' }}</span>
                        <span class="copy-divider">|</span>
                        <span class="copy-location">
                          <v-icon
                            size="small"
                            class="mr-1"
                          >
                            mdi-map-marker
                          </v-icon>
                          <span class="location-text">{{ formatLocation(book.location) || '위치없음' }}</span>
                          <v-icon
                            v-if="hasLocationImage(currentCenter, book.location)"
                            size="small"
                            class="ml-1 location-info-icon"
                            @click.stop="openLocationPopup(book.location)"
                          >
                            mdi-information-outline
                          </v-icon>
                        </span>
                      </div>
                      <!-- 3줄: 대여/반납 버튼 -->
                      <div class="copy-actions">
                        <v-btn
                          v-if="getBookStatus(book) === 'rented' || getBookStatus(book) === 'overdue'"
                          color="primary"
                          size="small"
                          variant="flat"
                          @click.stop="handleSingleReturn(book)"
                        >
                          반납처리
                        </v-btn>
                        <v-btn
                          v-else
                          color="primary"
                          size="small"
                          variant="flat"
                          @click.stop="openRentDialog(book)"
                        >
                          {{ getBookStatus(book) === 'requested' ? '대여승인' : '대여처리' }}
                        </v-btn>
                      </div>
                      <!-- 반납예정일 (대여중/연체중인 경우) -->
                      <div
                        v-if="(getBookStatus(book) === 'rented' || getBookStatus(book) === 'overdue') && getReturnDate(book)"
                        class="return-date-text"
                        :class="{ 'return-date-overdue': isReturnDateOverdue(book) }"
                      >
                        <v-icon
                          size="small"
                          class="mr-1"
                        >
                          mdi-calendar-clock
                        </v-icon>
                        반납예정일: {{ formatReturnDate(book.expectedReturnDate) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
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

      <!-- 하단 고정 액션 바 -->
      <Transition name="slide-up">
        <div
          v-if="selectedBooks.length > 0"
          class="sticky-action-bar"
        >
          <div class="sticky-action-info">
            <span class="selected-count">{{ selectedBooks.length }}권 선택</span>
          </div>
          <div class="sticky-action-buttons">
            <v-btn
              class="sticky-action-btn delete"
              variant="flat"
              size="small"
              :loading="actionLoading"
              @click="handleDeleteBooks"
            >
              삭제
            </v-btn>
            <v-btn
              class="sticky-action-btn rent"
              variant="flat"
              size="small"
              :loading="actionLoading"
              @click="handleRentBooks"
            >
              대여
            </v-btn>
            <v-btn
              class="sticky-action-btn return"
              variant="flat"
              size="small"
              :loading="actionLoading"
              @click="handleReturnBooks"
            >
              반납
            </v-btn>
          </div>
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

    <!-- 대여 처리 다이얼로그 -->
    <v-dialog
      v-model="rentDialog"
      max-width="400"
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
            <p>아래 도서들을 반납 처리하시겠습니까?</p>
          </div>
          
          <div class="multi-rent-book-list">
            <div
              v-for="book in returnDialogBooks"
              :key="book.id"
              class="rent-book-card"
            >
              <div class="rent-book-card-inner">
                <template v-if="book.image">
                  <img
                    :src="book.image"
                    :alt="book.title"
                    class="rent-book-thumbnail"
                  >
                </template>
                <template v-else>
                  <div class="rent-book-thumbnail-placeholder">
                    <span>NO IMAGE</span>
                  </div>
                </template>
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
                        v-if="hasLocationImage(currentCenter, book.location)"
                        size="x-small"
                        class="ml-1 location-info-icon"
                        @click.stop="openLocationPopup(book.location)"
                      >
                        mdi-information-outline
                      </v-icon>
                    </span>
                  </div>
                  <div
                    v-if="getRenterInfo(book)"
                    class="rent-book-renter"
                  >
                    대여자: {{ getRenterInfo(book) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <v-alert
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            대여자 정보와 라벨번호를 확인 후, 실제 반납이 완료된 도서만 반납 처리해주세요.
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
            반납 처리
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 도서 정보 수정 다이얼로그 -->
    <v-dialog
      v-model="editDialog"
      max-width="500"
    >
      <v-card class="edit-dialog-card">
        <v-card-title class="edit-dialog-title">
          도서 정보 수정
        </v-card-title>
        
        <v-card-text class="edit-dialog-content">
          <!-- 도서 정보 표시 -->
          <div
            v-if="editingBook"
            class="book-info-preview mb-4"
          >
            <div class="book-info-preview-inner">
              <img
                v-if="editingBook.image"
                :src="editingBook.image"
                :alt="editingBook.title"
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
                  {{ editingBook.title }}
                </div>
                <div class="book-current-label">
                  {{ editingBook.labelNumber || '라벨없음' }}
                </div>
                <div class="book-current-location">
                  <v-icon
                    size="small"
                    class="mr-1"
                  >
                    mdi-map-marker
                  </v-icon>
                  <span class="location-text">{{ formatLocation(editingBook.location) || '위치없음' }}</span>
                  <v-icon
                    v-if="hasLocationImage(currentCenter, editingBook.location)"
                    size="small"
                    class="ml-1 location-info-icon"
                    @click.stop="openLocationPopup(editingBook.location)"
                  >
                    mdi-information-outline
                  </v-icon>
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
            class="mb-3"
          />

          <!-- 라벨번호 입력 -->
          <div class="label-number-inputs mb-3">
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
    
    <!-- 대여 신청 도서 확인 다이얼로그 -->
    <v-dialog
      v-model="requestedBooksDialog"
      max-width="500"
    >
      <v-card class="rent-confirm-card">
        <v-card-title class="rent-confirm-title">
          대여 신청 도서 확인
        </v-card-title>
        
        <v-card-text class="rent-confirm-content">
          <div class="rent-confirm-info mb-4">
            <p>대여 신청된 도서가 {{ requestedBooksForAlert.length }}권 있습니다.</p>
          </div>
          
          <div class="multi-rent-book-list">
            <div
              v-for="book in requestedBooksForAlert"
              :key="book.id"
              class="rent-book-card"
            >
              <div class="rent-book-card-inner">
                <template v-if="book.image">
                  <img
                    :src="book.image"
                    :alt="book.title"
                    class="rent-book-thumbnail"
                  >
                </template>
                <template v-else>
                  <div class="rent-book-thumbnail-placeholder">
                    <span>NO IMAGE</span>
                  </div>
                </template>
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
                    <span class="detail-item">
                      <v-icon
                        size="x-small"
                        class="mr-1"
                      >mdi-map-marker</v-icon>
                      <span class="location-text">{{ formatLocation(book.location) || '위치없음' }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="rent-confirm-actions">
          <v-spacer />
          <v-btn
            variant="text"
            @click="requestedBooksDialog = false"
          >
            나중에 처리하기
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleProcessRequestedBooks"
          >
            지금 처리하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 위치 안내 팝업 -->
    <LocationGuidePopup
      v-model="locationPopupVisible"
      :center="currentCenter"
      :location="selectedPopupLocation"
      mode="info"
    />
  </v-app>
</template>

<script setup>
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping.js'
import { CENTER_CODE_MAP, createLabelNumber, parseLabelNumber, formatLocation } from '@/utils/labelConfig.js'

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
const { loadCenterLocations } = useSettings()
const { confirm, alert } = useDialog()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

// 센터 관련
const centerOptions = [...CENTERS]
const currentCenter = ref('')
const userWorkplace = ref('')

// 위치 안내 팝업
const locationPopupVisible = ref(false)
const selectedPopupLocation = ref('')

const openLocationPopup = (location) => {
  selectedPopupLocation.value = location
  locationPopupVisible.value = true
}

// 위치 안내 이미지 존재 여부 (Firestore 매핑 기반)
const { hasLocationMappingForCenter } = useSettings()
const centerHasLocationImage = ref(false)

// hasLocationImage 함수 (템플릿에서 사용, 센터 기반으로 체크)
const hasLocationImage = (center, location) => {
  return centerHasLocationImage.value
}

// 등록된 도서 관련
const registeredBooks = ref([])
const registeredBooksLoading = ref(false)
const registeredBooksSearchQuery = ref('')
const sortBy = ref('label')
const selectedLocationFilter = ref('')
const sortOrder = ref('asc') // 오름차순/내림차순
const sortOrderOptions = [
  { title: '오름차순', value: 'asc' },
  { title: '내림차순', value: 'desc' }
]
const sortOptions = [
  { title: '라벨번호순', value: 'label' },
  { title: '대여중도서', value: 'rented' },
  { title: '연체중도서', value: 'overdue' },
  { title: '대여신청도서', value: 'requested' },
  { title: '위치별로 보기', value: 'location' }
]

// 라벨번호에서 뒷자리 숫자만 추출하는 함수 (예: IT_10001 → 0001)
const extractLabelNumber = (labelNumber) => {
  if (!labelNumber) return 9999
  const parts = labelNumber.split('_')
  if (parts.length < 2) return 9999
  const numPart = parts[1] // 예: 10001
  return parseInt(numPart.slice(-4)) || 9999 // 뒤 4자리 숫자
}

// 도서 선택 관련
const selectedBooks = ref([])
const selectAll = ref(false)
const actionLoading = ref(false)

// 페이지네이션
const currentPage = ref(1)
const ITEMS_PER_PAGE = 10

// 최대 대여 권수
const MAX_RENT_COUNT = 5

// 그룹 펼침 상태 (기본: 접힘)

// 대여자/신청자 정보 캐시
const renterInfoCache = ref({})
const requesterInfoCache = ref({})

// 대여 신청 도서 확인 다이얼로그
const requestedBooksDialog = ref(false)
const requestedBooksForAlert = ref([])

// 대여 다이얼로그 관련
const rentDialog = ref(false)
const rentDialogBooks = ref([])
const rentDialogLoading = ref(false)
const rentFormCenter = ref('')
const rentFormEmail = ref('')
const rentFormError = ref('')

// 반납 다이얼로그 관련
const returnDialog = ref(false)
const returnDialogBooks = ref([])
const returnDialogLoading = ref(false)

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

// 위치 옵션 (센터별 동적 로드)
const locationOptions = ref([])

// 칸별보기 필터 옵션
const locationFilterOptions = computed(() => {
  return [
    { title: '전체', value: '' },
    ...locationOptions.value
  ]
})

// 센터별 위치 옵션 로드
const loadLocationOptions = async () => {
  try {
    const locations = await loadCenterLocations(currentCenter.value)
    locationOptions.value = locations.map(loc => ({
      title: loc.name,
      value: loc.name
    }))
  } catch (error) {
    console.error('위치 옵션 로드 오류:', error)
    locationOptions.value = []
  }
}

// 기본 위치값 가져오기 (첫 번째 칸)
const getDefaultLocation = () => {
  return locationOptions.value.length > 0 ? locationOptions.value[0].value : ''
}

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
  
  await Promise.all([
    loadRegisteredBooks(),
    loadLocationOptions()
  ])
  
  // 대여 신청된 도서가 있으면 알림
  checkAndAlertRequestedBooks()
})

// 센터 변경 시 위치 이미지 매핑 존재 여부 확인
watch(
  () => currentCenter.value,
  async (center) => {
    if (center) {
      centerHasLocationImage.value = await hasLocationMappingForCenter(center)
    } else {
      centerHasLocationImage.value = false
    }
  },
  { immediate: true }
)

// 대여 신청된 도서 확인 및 다이얼로그 표시
const checkAndAlertRequestedBooks = async () => {
  const requestedBooks = registeredBooks.value.filter(book => {
    const status = calculateBookStatus(book)
    return status === 'requested'
  })
  
  if (requestedBooks.length > 0) {
    requestedBooksForAlert.value = requestedBooks
    requestedBooksDialog.value = true
  }
}

// 지금 처리하기 버튼 핸들러
const handleProcessRequestedBooks = () => {
  requestedBooksDialog.value = false
  // 대여신청도서 탭으로 이동
  sortBy.value = 'requested'
}

// 센터 변경 처리
const handleCenterChange = async () => {
  selectedBooks.value = []
  await Promise.all([
    loadRegisteredBooks(),
    loadLocationOptions()
  ])
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
      // 1. 먼저 users 컬렉션에서 조회
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
      } else {
        // 2. users에 없으면 pendingUsers 컬렉션에서 조회
        const pendingRef = doc(firestore, 'pendingUsers', userId)
        const pendingDoc = await getDoc(pendingRef)
        
        if (pendingDoc.exists()) {
          const userData = pendingDoc.data()
          const email = userData.email || ''
          const emailId = email.split('@')[0] || ''
          const name = userData.name || ''
          const workplace = userData.workplace || ''
          
          const infoString = `${workplace} ${name}(${emailId}) [미가입]`
          renterInfoCache.value[userId] = infoString
          requesterInfoCache.value[userId] = infoString
        }
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

// 반납예정일 반환
const getReturnDate = (book) => {
  if (book.expectedReturnDate) {
    return book.expectedReturnDate?.toDate?.() || new Date(book.expectedReturnDate)
  }
  return null
}

// 반납예정일 포맷
const formatReturnDate = (returnDate) => {
  if (!returnDate) return ''
  
  const date = returnDate?.toDate?.() || new Date(returnDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day}`
}

// 반납예정일 지났는지 확인
const isReturnDateOverdue = (book) => {
  const returnDate = getReturnDate(book)
  if (!returnDate) return false
  
  return returnDate < new Date()
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
  if (sortBy.value === 'label') {
    groups.sort((a, b) => {
      // 그룹 내 첫 번째 복사본의 라벨번호로 정렬
      const labelA = extractLabelNumber(a.copies[0]?.labelNumber)
      const labelB = extractLabelNumber(b.copies[0]?.labelNumber)
      return sortOrder.value === 'asc' ? labelA - labelB : labelB - labelA
    })
  } else if (sortBy.value === 'rented') {
    groups = groups.filter(group => group.rentedCount > 0)
  } else if (sortBy.value === 'overdue') {
    groups = groups.filter(group => {
      return group.copies.some(book => calculateBookStatus(book) === 'overdue')
    })
  } else if (sortBy.value === 'requested') {
    groups = groups.filter(group => group.requestedCount > 0)
  } else if (sortBy.value === 'location') {
    // 위치별보기 - 선택한 칸에 위치한 도서가 있는 그룹만 필터링
    if (selectedLocationFilter.value) {
      groups = groups.filter(group => {
        return group.copies.some(book => book.location === selectedLocationFilter.value)
      })
    }
    // 라벨번호순 정렬 적용
    groups.sort((a, b) => {
      const labelA = extractLabelNumber(a.copies[0]?.labelNumber)
      const labelB = extractLabelNumber(b.copies[0]?.labelNumber)
      return sortOrder.value === 'asc' ? labelA - labelB : labelB - labelA
    })
  }

  return groups
})

// 화면에 표시할 도서 목록 (페이지네이션)
const displayedGroupedBooks = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return filteredGroupedBooks.value.slice(start, end)
})

// 총 페이지 수
const totalPages = computed(() => {
  return Math.ceil(filteredGroupedBooks.value.length / ITEMS_PER_PAGE)
})

// 검색이나 정렬 변경 시 페이지 리셋
watch([() => registeredBooksSearchQuery.value, () => sortBy.value, () => selectedLocationFilter.value], () => {
  currentPage.value = 1
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

// 그룹 헤더 클릭 핸들러 (전체 선택)
const handleGroupHeaderClick = (group) => {
  // 전체 선택/해제 토글
  const isCurrentlySelected = isGroupSelected(group)
  handleGroupSelect(group, !isCurrentlySelected)
}

// 개별 라벨 항목 클릭 핸들러
const handleCopyItemClick = (book) => {
  handleBookSelect(book, !isBookSelected(book))
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
  
  // 기본 위치값 가져오기 (도서에 저장된 위치가 없을 경우)
  const defaultLocation = getDefaultLocation()
  
  editForm.value = {
    category: book.category || (parsed?.category || ''),
    fourDigits: parsed?.fourDigits || '',
    location: book.location || defaultLocation
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
const getUserRentedCount = async (userId, userType = 'user') => {
  if (!firestore || !userId) return 0
  
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const booksRef = collection(firestore, 'books')
    
    // userType에 따라 쿼리 조건 다르게 설정
    let rentedQuery
    if (userType === 'pending') {
      rentedQuery = query(
        booksRef, 
        where('rentedBy', '==', userId),
        where('rentedByType', '==', 'pending')
      )
    } else {
      // 기존 데이터 호환성을 위해 'user' 타입이거나 rentedByType이 없는 경우 모두 포함
      rentedQuery = query(booksRef, where('rentedBy', '==', userId))
    }
    
    const snapshot = await getDocs(rentedQuery)
    let count = 0
    snapshot.forEach(doc => {
      const data = doc.data()
      if (data.status === 'rented' || data.status === 'overdue') {
        // user 타입인 경우 기존 데이터 호환성 체크
        if (userType === 'user') {
          // rentedByType이 없거나 'user'인 경우만 카운트
          if (!data.rentedByType || data.rentedByType === 'user') {
            count++
          }
        } else {
          count++
        }
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
      
      // 신청자 이메일 조회
      const { doc, getDoc } = await import('firebase/firestore')
      const userRef = doc(firestore, 'users', book.requestedBy)
      const userDoc = await getDoc(userRef)
      const requesterEmail = userDoc.exists() ? userDoc.data().email || '' : ''
      
      const labelNumber = book.labelNumber || book.id.split('_')[0]
      await rentBook(labelNumber, currentCenter.value, book.requestedBy, book.isbn, 'user', requesterEmail)
      
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
    
    let targetUserId = null
    let targetUserData = null
    let userType = 'user'
    
    // 1. 먼저 정식 회원에서 검색
    const usersRef = collection(firestore, 'users')
    const emailQuery = query(usersRef, where('email', '==', rentFormEmail.value))
    const emailSnapshot = await getDocs(emailQuery)
    
    if (!emailSnapshot.empty) {
      targetUserId = emailSnapshot.docs[0].id
      targetUserData = emailSnapshot.docs[0].data()
      userType = 'user'
    } else {
      // 2. 정식 회원이 아니면 미가입자에서 검색
      const pendingRef = collection(firestore, 'pendingUsers')
      const pendingQuery = query(pendingRef, where('email', '==', rentFormEmail.value))
      const pendingSnapshot = await getDocs(pendingQuery)
      
      if (!pendingSnapshot.empty) {
        targetUserId = pendingSnapshot.docs[0].id
        targetUserData = pendingSnapshot.docs[0].data()
        userType = 'pending'
      } else {
        rentFormError.value = '해당 이메일의 사용자를 찾을 수 없습니다.\n미가입자 관리에서 먼저 등록해주세요.'
        return
      }
    }
    
    // 센터 확인
    if (targetUserData.center !== rentFormCenter.value) {
      rentFormError.value = `해당 사용자는 ${targetUserData.center} 소속입니다.`
      return
    }
    
    // 대여 권수 확인 (userType에 따라 다르게 조회)
    const currentRentedCount = await getUserRentedCount(targetUserId, userType)
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
      await rentBook(labelNumber, currentCenter.value, targetUserId, book.isbn, userType, rentFormEmail.value)
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

// 도서 반납 처리 - 다이얼로그 열기
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

  returnDialogBooks.value = rentedBooks
  returnDialog.value = true
}

// 반납 다이얼로그 닫기
const closeReturnDialog = () => {
  returnDialog.value = false
  returnDialogBooks.value = []
}

// 반납 확인 처리
const confirmReturnBooks = async () => {
  if (returnDialogBooks.value.length === 0) return

  try {
    returnDialogLoading.value = true
    
    const { doc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp, deleteField } = await import('firebase/firestore')
    
    for (const book of returnDialogBooks.value) {
      const labelNumber = book.labelNumber || book.id.split('_')[0]
      const bookId = book.id
      const rentedBy = book.rentedBy
      const rentedByType = book.rentedByType || 'user'
      const rentedAt = book.rentedAt
      
      // 1. 도서 상태 업데이트
      const bookRef = doc(firestore, 'books', bookId)
      await updateDoc(bookRef, {
        status: 'available',
        rentedBy: deleteField(),
        rentedByType: deleteField(),
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
            userType: rentedByType,
            userEmail: book.rentedByEmail || '',
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
    
    const returnedCount = returnDialogBooks.value.length
    selectedBooks.value = selectedBooks.value.filter(book => 
      !returnDialogBooks.value.some(rb => rb.id === book.id)
    )
    closeReturnDialog()
    await loadRegisteredBooks()
    await alert(`${returnedCount}권의 도서가 반납 처리되었습니다.`, { type: 'success' })
  } catch (error) {
    console.error('도서 반납 오류:', error)
    await alert('도서 반납에 실패했습니다.', { type: 'error' })
  } finally {
    returnDialogLoading.value = false
  }
}

// 개별 도서 반납 처리 - 다이얼로그 열기
const handleSingleReturn = async (book) => {
  const status = calculateBookStatus(book)
  if (status !== 'rented' && status !== 'overdue') {
    await alert('대여중인 도서가 아닙니다.', { type: 'warning' })
    return
  }

  returnDialogBooks.value = [book]
  returnDialog.value = true
}

// 개별 도서 반납 처리 (기존 로직 - 삭제됨, confirmReturnBooks에서 처리)
const handleSingleReturnLegacy = async (book) => {
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

.sort-order-select {
  width: rem(110);
  min-width: rem(100);
  
  :deep(.v-field) {
    font-size: rem(12);
    min-height: rem(28);
  }
  
  :deep(.v-field__input) {
    padding: rem(4) rem(8);
    min-height: rem(28);
    font-size: rem(12);
  }
  
  :deep(.v-field-label) {
    font-size: rem(12);
  }
}

.location-filter-select {
  width: rem(100);
  min-width: rem(80);
  
  :deep(.v-field) {
    font-size: rem(12);
    min-height: rem(28);
  }
  
  :deep(.v-field__input) {
    padding: rem(4) rem(8);
    min-height: rem(28);
    font-size: rem(12);
  }
  
  :deep(.v-field-label) {
    font-size: rem(12);
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
    background-color: #fafafa;
    color: #bdbdbd;
    opacity: 1;
  }
}

// 그룹핑된 도서 목록 섹션
.registered-books-section {
  display: flex;
  flex-direction: column;
  gap: rem(24);
}

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

// 그룹핑된 도서 목록 스타일
.registered-books-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: rem(16);
  align-items: start;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 북카드 스타일 (다른 페이지와 동일)
.book-card {
  background-color: #F5F5F5;
  border-radius: rem(8);
  border: rem(2) solid #e0e0e0;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
  
  &:hover {
    box-shadow: 0 rem(2) rem(8) rgba(0, 0, 0, 0.1);
  }
}

.book-card-selected {
  border-color: #002C5B;
}

.book-card-header {
  display: flex;
  gap: rem(16);
  padding: rem(16);
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #ebebeb;
  }
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
  display: flex;
  flex-direction: column;
}

.book-title {
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

.book-author {
  font-size: rem(13);
  color: #6b7280;
  margin-bottom: rem(2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-publisher {
  font-size: rem(13);
  color: #6b7280;
  margin-bottom: rem(6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-count {
  font-size: rem(13);
  font-weight: 600;
  color: #002C5B;
  margin-top: auto;
}

.book-copies-list {
  border-top: rem(1) solid #e0e0e0;
  background: #fff;
}

.book-copy-item {
  display: flex;
  align-items: center;
  gap: rem(8);
  padding: rem(12) rem(16);
  border-bottom: rem(1) solid #f0f0f0;
  border-left: rem(3) solid transparent;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f9f9f9;
  }
  
  &.selected {
    background: #e3f2fd;
    border-left-color: #002C5B;
    
    &:hover {
      background: #d0e8fc;
    }
  }
}

.copy-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: rem(4);
  min-width: 0;
}

.copy-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: rem(8);
}

.copy-status {
  display: flex;
  align-items: center;
  gap: rem(8);
}

.copy-user-info {
  font-size: rem(11);
  color: #666;
}

.copy-edit-link {
  font-size: rem(12);
  color: #666;
  text-decoration: none;
  flex-shrink: 0;
  
  &:hover {
    color: #002C5B;
    text-decoration: underline;
  }
}

.copy-info-row {
  display: flex;
  align-items: center;
  gap: rem(6);
}

.copy-label-number {
  font-size: rem(13);
  font-weight: 600;
  color: #002C5B;
}

.copy-divider {
  font-size: rem(12);
  color: #ccc;
}

.copy-location {
  display: inline-flex;
  align-items: center;
  font-size: rem(12);
  color: #666;
  
  .v-icon {
    vertical-align: middle;
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

.copy-actions {
  margin-top: rem(4);
  
  .v-btn {
    width: 100%;
  }
}

// 반납예정일 스타일
.return-date-text {
  color: #6b7280;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(20);
  box-sizing: border-box;
  margin-top: rem(2);
  margin-bottom: rem(2);
  font-size: rem(12);
}

.return-date-overdue {
  color: #ef4444;
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

.book-current-label {
  font-size: rem(13);
  font-weight: 600;
  color: #002C5B;
  margin-bottom: rem(4);
}

.book-current-location {
  display: flex;
  align-items: center;
  font-size: rem(12);
  color: #666;
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

// 반납 확인 다이얼로그 스타일 (대여 확인과 동일)
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

// 다권 대여/반납 목록 스타일
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

// 개별 대여/반납 도서 카드 스타일
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

.rent-book-renter {
  font-size: rem(12);
  color: #f59e0b;
  margin-top: rem(4);
}

// 반납 도서 목록 스타일 (기존 - 필요시 사용)
.return-book-list {
  max-height: rem(300);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: rem(12);
}

.return-book-item {
  border: rem(1) solid #e0e0e0;
  border-radius: rem(8);
  padding: rem(12);
  background-color: #f5f5f5;
}

.return-book-info {
  display: flex;
  gap: rem(12);
}

.return-book-thumbnail {
  width: rem(50);
  height: rem(70);
  object-fit: cover;
  border-radius: rem(4);
  flex-shrink: 0;
  
  &.no-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #666;
    color: #fff;
    font-size: rem(10);
  }
}

.return-book-meta {
  flex: 1;
  min-width: 0;
}

.return-book-title {
  font-size: rem(14);
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

.return-book-details {
  display: flex;
  flex-wrap: wrap;
  gap: rem(8);
  font-size: rem(11);
  color: #666;
  margin-bottom: rem(4);
  
  .detail-item {
    display: inline-flex;
    align-items: center;
  }
}

.return-book-renter {
  font-size: rem(11);
  color: #999;
}

// 반응형

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

// 하단 고정 액션 바
.sticky-action-bar {
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
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
}

.sticky-action-info {
  .selected-count {
    color: #FFFFFF;
    font-size: rem(14);
    font-weight: 500;
  }
}

.sticky-action-buttons {
  display: flex;
  gap: rem(8);
}

.sticky-action-btn {
  font-weight: 600;
  font-size: rem(13);
  
  &.delete {
    background-color: #DC3545;
    color: #FFFFFF;
    
    &:hover {
      background-color: #C82333;
    }
  }
  
  &.rent {
    background-color: #28A745;
    color: #FFFFFF;
    
    &:hover {
      background-color: #218838;
    }
  }
  
  &.return {
    background-color: #007BFF;
    color: #FFFFFF;
    
    &:hover {
      background-color: #0056B3;
    }
  }
}

// 슬라이드 업 트랜지션
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}
</style>
