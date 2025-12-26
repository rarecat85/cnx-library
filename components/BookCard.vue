<template>
  <v-card
    class="book-card"
    :class="{ 
      'book-card-selected': selectable && selected,
      'book-card-disabled': disabled
    }"
    elevation="0"
    @click="selectable ? handleCardClick() : null"
  >
    <!-- 상태 플래그 영역 -->
    <div
      v-if="showStatusFlags && (statusText || isNewBook)"
      class="book-card-header"
    >
      <v-chip
        v-if="isNewBook"
        color="primary"
        size="x-small"
        variant="flat"
        class="status-chip"
      >
        NEW
      </v-chip>
      <v-chip
        v-if="statusText"
        :color="statusColor"
        size="x-small"
        variant="flat"
        class="status-chip"
      >
        {{ statusText }}
      </v-chip>
    </div>
    
    <div class="book-card-inner">
      <div class="book-image-wrapper">
        <v-img
          v-if="hasBookImage"
          :src="bookImage"
          :alt="book.title"
          height="100%"
          cover
          class="book-image"
        />
        <div
          v-else
          class="book-image-placeholder"
        >
          <span>No Image</span>
        </div>
      </div>
      <div class="book-card-content">
        <div class="book-title mb-2">
          {{ book.title }}
        </div>
        <div
          v-if="book.author"
          class="book-info text-body-2 mb-1"
        >
          <strong>저자:</strong> {{ book.author }}
        </div>
        <div
          v-if="book.publisher"
          class="book-info book-info-publisher text-body-2"
        >
          <strong>출판사:</strong> {{ book.publisher }}
        </div>
        
        <!-- 위치 정보 표시 -->
        <div
          v-if="showLocation && displayLocation"
          class="book-location text-body-2"
        >
          <v-icon
            size="small"
            class="mr-1"
          >
            mdi-map-marker
          </v-icon>
          <span class="location-text">{{ displayLocation }}</span>
          <v-icon
            v-if="hasLocationImage"
            size="small"
            class="ml-1 location-info-icon clickable"
            @click.stop="handleLocationClick"
          >
            mdi-information-outline
          </v-icon>
        </div>
        
        <!-- 수량 정보 표시 (그룹핑 시) -->
        <div
          v-if="showQuantity && totalCount > 0"
          class="book-quantity text-body-2"
        >
          <v-icon
            size="small"
            class="mr-1"
          >
            mdi-book-multiple
          </v-icon>
          대여가능 {{ availableCount }}권 / 총 {{ totalCount }}권
        </div>
        
        <!-- 라벨번호 표시 -->
        <div
          v-if="showLabelNumber && labelNumber"
          class="book-label-number text-body-2"
        >
          <v-icon
            size="small"
            class="mr-1"
          >
            mdi-label
          </v-icon>
          {{ labelNumber }}
        </div>
      </div>
    </div>
    
    <!-- 대여 신청된 도서 (관리자용) - 신청자 정보 + 대여처리 버튼 -->
    <div
      v-if="showAdminRentButton && isRequested && requesterInfo"
      class="book-action-area book-action-area-admin"
    >
      <div class="admin-info-text text-body-2">
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-account-clock
        </v-icon>
        {{ requesterInfo }}
      </div>
      <v-btn
        color="primary"
        size="small"
        class="admin-rent-btn mt-2"
        @click.stop="handleAdminRent"
      >
        대여 처리
      </v-btn>
    </div>
    
    <!-- 관리자용 대여 버튼 (대여중/신청중이 아닌 경우) -->
    <div
      v-else-if="showAdminRentButton && !isRented && !isRequested"
      class="book-action-area"
    >
      <v-btn
        color="primary"
        size="small"
        class="admin-rent-btn"
        @click.stop="handleAdminRent"
      >
        대여 처리
      </v-btn>
    </div>
    
    <!-- 대여자 정보 및 반납예정일 (관리자 도서 관리 페이지용) -->
    <div
      v-else-if="renterInfo && isRented"
      class="book-action-area book-action-area-admin"
    >
      <div class="admin-info-text text-body-2">
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-account
        </v-icon>
        {{ renterInfo }}
      </div>
      <div
        v-if="returnDate"
        class="return-date-text text-body-2"
        :class="{ 'return-date-overdue': isOverdue }"
      >
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-calendar-clock
        </v-icon>
        반납예정일: {{ formattedReturnDate }}
      </div>
      <v-btn
        v-if="showAdminReturnButton"
        color="primary"
        size="small"
        class="admin-return-btn mt-2"
        @click.stop="handleAdminReturn"
      >
        반납 처리
      </v-btn>
    </div>
    
    <!-- 반납예정일 및 반납하기 버튼 (마이페이지용) -->
    <div
      v-if="showReturnDate && returnDate"
      class="book-action-area book-action-area-mypage"
    >
      <v-btn
        color="primary"
        size="small"
        class="return-btn"
        @click.stop="handleReturn"
      >
        반납하기
      </v-btn>
      <div
        class="return-date-text text-body-2"
        :class="{ 'return-date-overdue': isOverdue }"
      >
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-calendar-clock
        </v-icon>
        반납예정일: {{ formattedReturnDate }}
      </div>
    </div>
    
    <!-- 신청일 및 신청취소 버튼 (마이페이지 신청 도서용) -->
    <div
      v-else-if="showRequestedInfo && requestedDate"
      class="book-action-area book-action-area-mypage"
    >
      <v-btn
        color="error"
        variant="outlined"
        size="small"
        class="cancel-request-btn"
        :loading="cancelLoading"
        @click.stop="handleCancelRequest"
      >
        신청 취소
      </v-btn>
      <div class="requested-date-text text-body-2">
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-clock-outline
        </v-icon>
        신청일: {{ formattedRequestedDate }}
      </div>
    </div>
    
    <!-- 대여 신청 버튼 (도서 대여 페이지용) -->
    <div
      v-else-if="showRentButton"
      class="book-action-area"
    >
      <div
        v-if="isRented"
        class="rented-text text-body-2"
      >
        대여중인 도서입니다.
      </div>
      <div
        v-else-if="isRequested"
        class="requested-status-text text-body-2"
      >
        신청중인 도서입니다.
      </div>
      <v-btn
        v-else
        color="primary"
        size="small"
        class="rent-btn"
        @click.stop="handleRent"
      >
        대여 신청
      </v-btn>
    </div>
    
    <!-- 기본 액션 영역 (등록/신청) -->
    <div
      v-else-if="showAction"
      class="book-action-area"
      :class="{ 
        'book-action-area-admin': (requesterInfo || (isBookRequested && allowRegisterRequested)) && !isBookRegistered,
        'book-action-area-column': isBookRegistered && allowAdditionalRegister
      }"
    >
      <div
        v-if="isBookRegistered && !allowAdditionalRegister"
        class="registered-text text-body-2"
      >
        {{ registeredMessage || `${center}에 등록된 도서입니다.` }}
      </div>
      <template v-else-if="isBookRegistered && allowAdditionalRegister">
        <div class="registered-text text-body-2">
          {{ registeredMessage || `${center}에 등록된 도서입니다.` }}
        </div>
        <v-btn
          color="secondary"
          size="small"
          variant="outlined"
          :loading="isRegistering"
          :disabled="isRegistering"
          class="register-btn"
          @click.stop="handleRegister"
        >
          추가 등록
        </v-btn>
      </template>
      <div
        v-else-if="isBookRequested && !allowRegisterRequested"
        class="requested-text text-body-2"
      >
        {{ requestedMessage || `${center}에 이미 신청된 도서입니다.` }}
      </div>
      <template v-else>
        <div
          v-if="isBookRequested && allowRegisterRequested"
          class="admin-info-text text-body-2 requested-badge"
        >
          <v-icon
            size="small"
            class="mr-1"
          >
            mdi-book-clock
          </v-icon>
          신청된 도서
        </div>
        <div
          v-else-if="requesterInfo"
          class="admin-info-text text-body-2"
        >
          <v-icon
            size="small"
            class="mr-1"
          >
            mdi-account-clock
          </v-icon>
          {{ requesterInfo }}
        </div>
        <v-btn
          color="primary"
          size="small"
          :loading="isRegistering"
          :disabled="isRegistering"
          class="register-btn"
          :class="{ 'mt-2': requesterInfo || (isBookRequested && allowRegisterRequested) }"
          @click.stop="handleRegister"
        >
          {{ actionButtonText || `${center}에 등록하기` }}
        </v-btn>
      </template>
    </div>
  </v-card>
  
  <!-- 위치 안내 팝업 -->
  <LocationGuidePopup
    v-model="locationPopupVisible"
    :center="center"
    :location="singleLocation"
    :label-number="labelNumber"
    :mode="locationPopupMode"
  />
</template>

<script setup>
import { formatLocation, formatMultipleLocations } from '@/utils/labelConfig.js'
import { hasLocationImage as checkHasLocationImage } from '@/utils/locationCoordinates.js'

const props = defineProps({
  book: {
    type: Object,
    required: true
  },
  center: {
    type: String,
    required: true
  },
  registeredBooks: {
    type: Array,
    default: () => []
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  showAction: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: null
  },
  showStatusFlags: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  actionButtonText: {
    type: String,
    default: ''
  },
  registeredMessage: {
    type: String,
    default: ''
  },
  requestedBooks: {
    type: Array,
    default: () => []
  },
  requestedMessage: {
    type: String,
    default: ''
  },
  hideOverdueStatus: {
    type: Boolean,
    default: false
  },
  showReturnDate: {
    type: Boolean,
    default: false
  },
  returnDate: {
    type: [Date, Object, String],
    default: null
  },
  showRentButton: {
    type: Boolean,
    default: false
  },
  renterInfo: {
    type: String,
    default: ''
  },
  requesterInfo: {
    type: String,
    default: ''
  },
  showAdminRentButton: {
    type: Boolean,
    default: false
  },
  showAdminReturnButton: {
    type: Boolean,
    default: false
  },
  allowRegisterRequested: {
    type: Boolean,
    default: false
  },
  allowAdditionalRegister: {
    type: Boolean,
    default: false
  },
  // 새로운 Props
  showLocation: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: ''
  },
  locations: {
    type: Array,
    default: () => []
  },
  showQuantity: {
    type: Boolean,
    default: false
  },
  availableCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  showLabelNumber: {
    type: Boolean,
    default: false
  },
  labelNumber: {
    type: String,
    default: ''
  },
  // 위치 안내 팝업 모드: 'rent' | 'return' | 'info'
  locationPopupMode: {
    type: String,
    default: 'rent'
  },
  // 신청 정보 표시 (마이페이지 신청 도서용)
  showRequestedInfo: {
    type: Boolean,
    default: false
  },
  requestedDate: {
    type: [Date, Object, String],
    default: null
  },
  cancelLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['register', 'select', 'return', 'rent', 'adminRent', 'adminReturn', 'locationClick', 'cancelRequest'])

// 위치 안내 팝업
const locationPopupVisible = ref(false)

// 도서 이미지
const hasBookImage = computed(() => {
  return !!(props.book.cover || props.book.image)
})

const bookImage = computed(() => {
  return props.book.cover || props.book.image || ''
})

// 표시할 위치 (단일 또는 다중)
const displayLocation = computed(() => {
  if (props.location) {
    return formatLocation(props.location)
  }
  
  if (props.locations && props.locations.length > 0) {
    return formatMultipleLocations(props.locations)
  }
  
  if (props.book.location) {
    return formatLocation(props.book.location)
  }
  
  return ''
})

// 단일 위치 (팝업용)
const singleLocation = computed(() => {
  if (props.location) {
    return props.location
  }
  
  if (props.locations && props.locations.length > 0) {
    return props.locations[0]
  }
  
  if (props.book.location) {
    return props.book.location
  }
  
  return ''
})

// 위치 안내 이미지 존재 여부
const hasLocationImage = computed(() => {
  return checkHasLocationImage(props.center)
})

// 위치 클릭 핸들러
const handleLocationClick = () => {
  if (hasLocationImage.value && singleLocation.value) {
    locationPopupVisible.value = true
    emit('locationClick', { center: props.center, location: singleLocation.value })
  }
}

// 등록 상태 확인
const isBookRegistered = computed(() => {
  if (props.isRegistered) {
    return true
  }
  
  const isbn = props.book.isbn13 || props.book.isbn || ''
  if (!isbn) {
    return false
  }
  
  return props.registeredBooks.some(registeredBook => {
    const registeredIsbn = registeredBook.isbn13 || registeredBook.isbn || registeredBook.id || ''
    const normalizedIsbn = isbn.toString().trim()
    const normalizedRegisteredIsbn = registeredIsbn.toString().trim()
    return normalizedIsbn === normalizedRegisteredIsbn && registeredBook.center === props.center
  })
})

// 신청 상태 확인
const isBookRequested = computed(() => {
  const isbn = props.book.isbn13 || props.book.isbn || ''
  if (!isbn) {
    return false
  }
  
  return props.requestedBooks.some(requestedBook => {
    const requestedIsbn = requestedBook.isbn13 || requestedBook.isbn || ''
    const normalizedIsbn = isbn.toString().trim()
    const normalizedRequestedIsbn = requestedIsbn.toString().trim()
    return normalizedIsbn === normalizedRequestedIsbn && requestedBook.center === props.center
  })
})

// 등록 중 상태
const isRegistering = ref(false)

// 등록 처리
const handleRegister = async () => {
  if (isRegistering.value) {
    return
  }

  try {
    isRegistering.value = true
    emit('register', props.book)
  } finally {
    setTimeout(() => {
      isRegistering.value = false
    }, 1000)
  }
}

// 구매칸에 있는 도서인지 확인 (NEW 표시)
const isNewBook = computed(() => {
  const location = props.location || props.book?.location
  return location === '구매칸'
})

// 도서 상태
const bookStatus = computed(() => {
  if (props.status) {
    return props.status
  }
  return null
})

const statusText = computed(() => {
  const status = bookStatus.value
  
  if (props.hideOverdueStatus && status === 'overdue') {
    return '대여중'
  }
  
  const statusMap = {
    new: 'NEW',
    rented: '대여중',
    overdue: '연체중',
    requested: '대여신청'
  }
  return statusMap[status] || ''
})

const statusColor = computed(() => {
  const status = bookStatus.value
  
  if (props.hideOverdueStatus && status === 'overdue') {
    return 'info'
  }
  
  const colorMap = {
    new: 'primary',
    rented: 'info',
    overdue: 'error',
    requested: 'warning'
  }
  return colorMap[status] || 'primary'
})

// 대여중인지 확인
const isRented = computed(() => {
  return bookStatus.value === 'rented' || bookStatus.value === 'overdue'
})

// 대여 신청중인지 확인
const isRequested = computed(() => {
  return bookStatus.value === 'requested'
})

// 카드 클릭 처리
const handleCardClick = () => {
  if (props.selectable && !props.disabled) {
    emit('select', props.book, !props.selected)
  }
}

// 반납 처리
const handleReturn = () => {
  emit('return', props.book)
}

// 대여 신청 처리
const handleRent = () => {
  emit('rent', props.book)
}

// 관리자 대여 처리
const handleAdminRent = () => {
  emit('adminRent', props.book)
}

// 관리자 반납 처리
const handleAdminReturn = () => {
  emit('adminReturn', props.book)
}

// 반납예정일 포맷
const formattedReturnDate = computed(() => {
  if (!props.returnDate) return ''
  
  const date = props.returnDate?.toDate?.() || new Date(props.returnDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day}`
})

// 반납예정일이 지났는지 확인
const isOverdue = computed(() => {
  if (!props.returnDate) return false
  
  const date = props.returnDate?.toDate?.() || new Date(props.returnDate)
  return date < new Date()
})

// 신청일 포맷
const formattedRequestedDate = computed(() => {
  if (!props.requestedDate) return ''
  
  const date = props.requestedDate?.toDate?.() || new Date(props.requestedDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}.${month}.${day}`
})

// 신청 취소 처리
const handleCancelRequest = () => {
  emit('cancelRequest', props.book)
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.book-card {
  height: 100%;
  background-color: #F5F5F5;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  border: rem(2) solid transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  padding: rem(24) rem(20);
}

.book-card:hover {
  transform: translateY(rem(-2));
  box-shadow: 0 rem(4) rem(12) rgba(0, 0, 0, 0.15);
}

.book-card-selected {
  border-color: #002C5B;
}

.book-card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  
  &:hover {
    transform: none;
    box-shadow: none;
  }
}

.book-card-header {
  display: flex;
  align-items: center;
  gap: rem(5);
  margin-bottom: rem(10);
}

.status-chip {
  flex: 0 0 auto;
  font-size: rem(9);
  height: rem(16);
  padding: 0 rem(6);
  min-width: auto;
  
  :deep(.v-chip__content) {
    font-size: rem(9);
    line-height: 1;
    padding: 0;
  }
}

.book-card-inner {
  display: flex;
  gap: rem(16);
  margin-bottom: rem(10);
  min-height: rem(115);
}

.book-image-wrapper {
  flex: 0 0 auto;
  width: rem(80);
  height: rem(110);
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: rem(4);
}

.book-image-placeholder {
  width: 100%;
  height: 100%;
  background-color: #666;
  border-radius: rem(4);
  display: flex;
  align-items: center;
  justify-content: center;
  
  span {
    color: #fff;
    font-size: rem(11);
    font-weight: 500;
  }
}

.book-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  color: #000000;
  min-width: 0;
}

.book-title {
  font-size: rem(16);
  font-weight: 600;
  color: #002C5B;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-info {
  color: #6b7280;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-info-publisher {
  -webkit-line-clamp: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  max-width: 100%;
}

// 위치 정보
.book-location {
  display: flex;
  align-items: center;
  color: #666;
  margin-top: rem(4);
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #002C5B;
  }
  
  .location-text {
    flex: 0 0 auto;
  }
  
  .location-info-icon {
    color: #999;
    transition: color 0.2s;
    
    &.clickable {
      cursor: pointer;
      
      &:hover {
        color: #002C5B;
      }
    }
  }
}

// 수량 정보
.book-quantity {
  display: flex;
  align-items: center;
  color: #10b981;
  margin-top: rem(4);
  font-weight: 500;
}

// 라벨번호
.book-label-number {
  display: flex;
  align-items: center;
  color: #002C5B;
  margin-top: rem(4);
  font-weight: 500;
}

.book-action-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: rem(10);
}

.register-btn {
  width: 100%;
  box-sizing: border-box;
}

.registered-text {
  color: #10b981;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(28);
  box-sizing: border-box;
}

.requested-text {
  color: #f59e0b;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(28);
  box-sizing: border-box;
}

.book-action-area-mypage {
  flex-direction: column;
  gap: rem(8);
}

.book-action-area-admin {
  flex-direction: column;
  gap: rem(4);
}

.book-action-area-column {
  flex-direction: column;
  gap: rem(4);
  margin-top: 0;
}

.admin-info-text {
  color: #6b7280;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.return-btn,
.rent-btn,
.admin-rent-btn,
.admin-return-btn {
  width: 100%;
  box-sizing: border-box;
}

.rented-text {
  color: #3b82f6;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(28);
  box-sizing: border-box;
}

.requested-status-text {
  color: #f59e0b;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(28);
  box-sizing: border-box;
}

.requested-badge {
  color: #f59e0b;
}

.return-date-text {
  color: #6b7280;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(28);
  box-sizing: border-box;
}

.return-date-overdue {
  color: #ef4444;
}

.cancel-request-btn {
  width: 100%;
  box-sizing: border-box;
}

.requested-date-text {
  color: #6b7280;
  font-weight: 500;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: rem(28);
  box-sizing: border-box;
}
</style>
