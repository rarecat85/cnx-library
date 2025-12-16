<template>
  <div class="book-list-swiper-section">
    <!-- 헤더 영역 -->
    <div class="book-list-swiper-header mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <!-- 타이틀 또는 검색 결과 정보 -->
        <div class="book-list-swiper-info">
          <h2
            v-if="title"
            class="section-title mb-0"
          >
            {{ title }}
          </h2>
          <div
            v-else-if="showSearchInfo"
            class="search-results-info"
          >
            <span class="text-body-1">
              총 <strong>{{ searchTotal }}</strong>개의 검색 결과
            </span>
            <span
              v-if="searchTotalPages > 1"
              class="text-body-2 ml-2 text-medium-emphasis"
            >
              ({{ currentSearchPage }} / {{ searchTotalPages }} 페이지)
            </span>
          </div>
        </div>
        <!-- 네비게이션 버튼 -->
        <div
          :class="navClass"
        >
          <div :class="`swiper-button-prev ${prevClass}`" />
          <div :class="`swiper-button-next ${nextClass}`" />
        </div>
      </div>
    </div>

    <!-- Swiper 영역 -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </div>
    <div
      v-else-if="books.length > 0"
      class="book-list-swiper"
    >
      <Swiper
        :modules="swiperModules"
        :space-between="16"
        :navigation="{
          nextEl: `.${nextClass}`,
          prevEl: `.${prevClass}`
        }"
        :pagination="{
          clickable: true,
          dynamicBullets: true
        }"
        :slides-per-view="1"
        :breakpoints="{
          601: {
            slidesPerView: 2
          }
        }"
        class="book-list-swiper-container"
      >
        <SwiperSlide
          v-for="(book, index) in books"
          :key="`book-${uniqueId}-${index}`"
        >
          <BookCard
            :book="book"
            :center="center"
            :registered-books="registeredBooks"
            :requested-books="requestedBooks"
            :action-button-text="actionButtonText"
            :registered-message="registeredMessage"
            :requested-message="requestedMessage"
            :show-action="showAction"
            :show-status-flags="showStatusFlags"
            :status="getBookStatus(book)"
            :show-rent-button="showRentButton"
            :hide-overdue-status="hideOverdueStatus"
            :disabled="isBookDisabled(book)"
            @register="handleRegister"
            @rent="handleRent"
          />
        </SwiperSlide>
      </Swiper>
    </div>
    <div
      v-else
      class="text-center py-8 text-medium-emphasis"
    >
      {{ emptyMessage }}
    </div>
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const props = defineProps({
  // 도서 목록
  books: {
    type: Array,
    required: true,
    default: () => []
  },
  // 센터명
  center: {
    type: String,
    required: true
  },
  // 등록된 도서 목록
  registeredBooks: {
    type: Array,
    default: () => []
  },
  // 타이틀 (타이틀 표시 시 사용)
  title: {
    type: String,
    default: ''
  },
  // 검색 결과 정보 표시 여부
  showSearchInfo: {
    type: Boolean,
    default: false
  },
  // 검색 결과 총 개수 (showSearchInfo가 true일 때 사용)
  searchTotal: {
    type: Number,
    default: 0
  },
  // 검색 결과 현재 페이지 (showSearchInfo가 true일 때 사용)
  currentSearchPage: {
    type: Number,
    default: 1
  },
  // 검색 결과 총 페이지 수 (showSearchInfo가 true일 때 사용)
  searchTotalPages: {
    type: Number,
    default: 1
  },
  // 로딩 상태
  loading: {
    type: Boolean,
    default: false
  },
  // 빈 목록 메시지
  emptyMessage: {
    type: String,
    default: '도서를 불러올 수 없습니다.'
  },
  // 네비게이션 버튼 클래스 (고유 ID)
  navId: {
    type: String,
    required: true
  },
  // 액션 버튼 텍스트 (BookCard에 전달)
  actionButtonText: {
    type: String,
    default: ''
  },
  // 등록됨 메시지 (BookCard에 전달)
  registeredMessage: {
    type: String,
    default: ''
  },
  // 신청된 도서 목록 (BookCard에 전달)
  requestedBooks: {
    type: Array,
    default: () => []
  },
  // 신청됨 메시지 (BookCard에 전달)
  requestedMessage: {
    type: String,
    default: ''
  },
  // 액션 버튼 표시 여부 (BookCard에 전달)
  showAction: {
    type: Boolean,
    default: true
  },
  // 상태 플래그 표시 여부 (BookCard에 전달)
  showStatusFlags: {
    type: Boolean,
    default: false
  },
  // 대여 버튼 표시 여부 (BookCard에 전달)
  showRentButton: {
    type: Boolean,
    default: false
  },
  // 연체중을 대여중으로 표시 (BookCard에 전달)
  hideOverdueStatus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['register', 'rent'])

// 도서 상태 계산
const { calculateBookStatus } = useBooks()

const getBookStatus = (book) => {
  return calculateBookStatus(book)
}

// 도서 비활성화 여부 (대여중, 연체중, 신청중인 도서)
const isBookDisabled = (book) => {
  const status = getBookStatus(book)
  return status === 'rented' || status === 'overdue' || status === 'requested'
}

// Swiper 모듈
const swiperModules = [Navigation, Pagination]

// 네비게이션 클래스
const navClass = computed(() => `${props.navId}-swiper-nav`)
const prevClass = computed(() => `${props.navId}-prev`)
const nextClass = computed(() => `${props.navId}-next`)
const uniqueId = computed(() => props.navId)

// 도서 등록 처리
const handleRegister = (book) => {
  emit('register', book)
}

// 도서 대여 처리
const handleRent = (book) => {
  emit('rent', book)
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.book-list-swiper-section {
  width: 100%;
  padding-top: rem(24);
  border-top: rem(1) solid #e0e0e0;
}

.book-list-swiper-header {
  width: 100%;
}

.section-title {
  font-size: rem(24);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.book-list-swiper {
  width: 100%;
  margin-top: rem(16);
}

.book-list-swiper-container {
  :deep(.swiper-wrapper) {
    align-items: stretch;
  }
}

/* Swiper 네비게이션 스타일 */
:deep([class$="-swiper-nav"]) {
  display: flex;
  gap: rem(8);
  align-items: center;
}

:deep([class$="-swiper-nav"] .swiper-button-next),
:deep([class$="-swiper-nav"] .swiper-button-prev) {
  position: relative;
  top: auto;
  left: auto;
  right: auto;
  margin: 0;
  color: #FFFFFF;
  background-color: #002C5B;
  width: rem(32);
  height: rem(32);
  border-radius: 50%;
  box-shadow: none;
  transition: opacity 0.2s;
}

:deep([class$="-swiper-nav"] .swiper-button-next.swiper-button-disabled),
:deep([class$="-swiper-nav"] .swiper-button-prev.swiper-button-disabled) {
  opacity: 0.3;
}

:deep([class$="-swiper-nav"] .swiper-button-next svg.swiper-navigation-icon),
:deep([class$="-swiper-nav"] .swiper-button-prev svg.swiper-navigation-icon) {
  width: rem(8);
  height: rem(11);
  fill: #FFFFFF;
  stroke: #FFFFFF;
  stroke-width: 2;
}

/* Swiper 페이지네이션 스타일 */
.book-list-swiper-container :deep(.swiper-pagination) {
  position: relative;
  margin-top: rem(16);
}

.book-list-swiper-container :deep(.swiper-pagination-bullet) {
  background-color: #002C5B;
  opacity: 0.3;
  width: rem(8);
  height: rem(8);
}

.book-list-swiper-container :deep(.swiper-pagination-bullet-active) {
  opacity: 1;
  background-color: #002C5B;
}
</style>

