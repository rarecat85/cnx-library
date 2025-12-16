<template>
  <v-card
    class="book-card"
    :class="{ 
      'book-card-selected': selectable && selected,
      'book-card-disabled': selectable && disabled
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
          :src="bookImage"
          :alt="book.title"
          height="100%"
          cover
          class="book-image"
        />
      </div>
      <div class="book-card-content">
        <div class="book-title mb-2">
          {{ book.title }}
        </div>
        <div class="book-info text-body-2 mb-1">
          <strong>저자:</strong> {{ book.author }}
        </div>
        <div class="book-info book-info-publisher text-body-2">
          <strong>출판사:</strong> {{ book.publisher }}
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
      :class="{ 'book-action-area-admin': (requesterInfo || (isBookRequested && allowRegisterRequested)) && !isBookRegistered }"
    >
      <div
        v-if="isBookRegistered"
        class="registered-text text-body-2"
      >
        {{ registeredMessage || `${center}에 등록된 도서입니다.` }}
      </div>
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
</template>

<script setup>
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
  selectable: { // 도서 관리 페이지에서 선택 가능 여부
    type: Boolean,
    default: false
  },
  selected: { // 선택 상태
    type: Boolean,
    default: false
  },
  status: { // 도서 상태 (임시 테스트용: 'new', 'rented', 'overdue')
    type: String,
    default: null
  },
  showStatusFlags: { // 상태 플래그 표시 여부
    type: Boolean,
    default: false
  },
  disabled: { // 선택 불가 상태
    type: Boolean,
    default: false
  },
  actionButtonText: { // 액션 버튼 텍스트 (기본: "[센터]에 등록하기")
    type: String,
    default: ''
  },
  registeredMessage: { // 등록됨 메시지 (기본: "[센터]에 등록된 도서입니다.")
    type: String,
    default: ''
  },
  requestedBooks: { // 신청된 도서 목록
    type: Array,
    default: () => []
  },
  requestedMessage: { // 신청됨 메시지 (기본: "[센터]에 이미 신청된 도서입니다.")
    type: String,
    default: ''
  },
  hideOverdueStatus: { // 연체중을 대여중으로 표시 (일반 사용자용)
    type: Boolean,
    default: false
  },
  showReturnDate: { // 반납예정일 표시 여부 (마이페이지용)
    type: Boolean,
    default: false
  },
  returnDate: { // 반납예정일
    type: [Date, Object, String],
    default: null
  },
  showRentButton: { // 대여 신청 버튼 표시 여부 (도서 대여 페이지용)
    type: Boolean,
    default: false
  },
  renterInfo: { // 대여자 정보 (관리자 도서 관리 페이지용)
    type: String,
    default: ''
  },
  requesterInfo: { // 신청자 정보 (관리자 도서 관리 페이지용)
    type: String,
    default: ''
  },
  showAdminRentButton: { // 관리자용 대여 버튼 표시 (도서 관리 페이지용)
    type: Boolean,
    default: false
  },
  showAdminReturnButton: { // 관리자용 반납 버튼 표시 (도서 관리 페이지용)
    type: Boolean,
    default: false
  },
  allowRegisterRequested: { // 신청된 도서도 등록 가능 (관리자용)
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['register', 'select', 'return', 'rent', 'adminRent', 'adminReturn'])

// 도서 이미지 (알라딘 API는 cover 필드 사용)
const bookImage = computed(() => {
  return props.book.cover || props.book.image || '/placeholder-book.png'
})

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
    // ISBN 비교 (앞뒤 공백 제거 및 대소문자 무시)
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
  // 등록 완료 후 약간의 딜레이를 두고 상태 초기화
  setTimeout(() => {
    isRegistering.value = false
  }, 1000)
}
}

// 등록일 기준 한 달 이내인지 확인
const isNewBook = computed(() => {
  if (props.book.registeredAt) {
    const registeredDate = props.book.registeredAt?.toDate?.() || new Date(props.book.registeredAt)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    return registeredDate >= oneMonthAgo
  }
  return false
})

// 도서 상태 (대여중, 연체중 등)
const bookStatus = computed(() => {
  // props로 상태가 전달된 경우 우선 사용
  if (props.status) {
    return props.status
  }
  return null
})

const statusText = computed(() => {
  const status = bookStatus.value
  
  // hideOverdueStatus가 true이면 연체중도 대여중으로 표시 (일반 사용자용)
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
  
  // hideOverdueStatus가 true이면 연체중도 대여중 색상 (일반 사용자용)
  if (props.hideOverdueStatus && status === 'overdue') {
    return 'info'
  }
  
  const colorMap = {
    new: 'primary',
    rented: 'info',
    overdue: 'error', // 연체중은 빨간색 계열
    requested: 'warning' // 대여신청은 주황색 계열
  }
  return colorMap[status] || 'primary'
})

// 대여중인지 확인 (연체중 포함)
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
  font-size: rem(9) !important;
  height: rem(16) !important;
  padding: 0 rem(6) !important;
  min-width: auto !important;
  
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
</style>

