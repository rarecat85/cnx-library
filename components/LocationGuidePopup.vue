<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="600"
    :fullscreen="isMobile"
  >
    <v-card class="location-guide-card">
      <div class="location-guide-header">
        <div class="location-guide-title">
          도서 위치 안내
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      
      <div class="location-guide-content">
        <!-- 이미지가 있는 경우 -->
        <div
          v-if="imageInfo"
          class="shelf-image-container"
        >
          <img
            :src="imageInfo.imagePath"
            :alt="`${center} 서가 이미지`"
            class="shelf-image"
            @load="onImageLoad"
          >
          <!-- 하이라이트 영역 -->
          <div
            v-if="imageLoaded && imageInfo.area"
            class="location-highlight"
            :style="highlightStyle"
          />
        </div>
        
        <!-- 이미지가 없는 경우 -->
        <div
          v-else
          class="no-image-message"
        >
          <v-icon
            size="48"
            color="grey-lighten-1"
            class="mb-4"
          >
            mdi-image-off-outline
          </v-icon>
          <p>위치 안내 이미지가 준비되지 않았습니다.</p>
        </div>
        
        <!-- 위치 안내 텍스트 -->
        <div class="location-info-text">
          <v-icon
            size="small"
            class="mr-1"
          >
            mdi-map-marker
          </v-icon>
          <template v-if="labelNumber">
            "<strong>{{ labelNumber }}</strong>" 도서는 
          </template>
          <strong>{{ formattedLocation }}</strong>에 있습니다.
        </div>
        
        <div
          v-if="labelNumber"
          class="location-confirm-text"
        >
          위치와 라벨번호를 확인 후 대여해주세요.
        </div>
      </div>
      
      <div class="location-guide-actions">
        <v-btn
          color="primary"
          variant="flat"
          block
          @click="close"
        >
          확인
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getLocationImageInfo, hasLocationImage } from '@/utils/locationCoordinates.js'
import { formatLocation } from '@/utils/labelConfig.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  center: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  labelNumber: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const imageLoaded = ref(false)

// 다이얼로그 표시 상태
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 모바일 여부
const isMobile = ref(false)

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 600
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkMobile)
  })
})

// 이미지 정보
const imageInfo = computed(() => {
  if (!hasLocationImage(props.center)) {
    return null
  }
  return getLocationImageInfo(props.center, props.location)
})

// 포맷된 위치
const formattedLocation = computed(() => {
  return formatLocation(props.location)
})

// 하이라이트 스타일
const highlightStyle = computed(() => {
  if (!imageInfo.value?.area) {
    return {}
  }
  
  const { x, y, width, height } = imageInfo.value.area
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${width}%`,
    height: `${height}%`
  }
})

// 이미지 로드 완료
const onImageLoad = () => {
  imageLoaded.value = true
}

// 다이얼로그 닫기
const close = () => {
  dialogVisible.value = false
  imageLoaded.value = false
}

// props 변경 시 이미지 로드 상태 초기화
watch(() => [props.center, props.location], () => {
  imageLoaded.value = false
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.location-guide-card {
  border-radius: rem(12) !important;
  overflow: hidden;
}

.location-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: rem(16) rem(20);
  border-bottom: rem(1) solid #e0e0e0;
}

.location-guide-title {
  font-size: rem(18);
  font-weight: 600;
  color: #002C5B;
}

.location-guide-content {
  padding: rem(20);
}

.shelf-image-container {
  position: relative;
  width: 100%;
  margin-bottom: rem(16);
  border-radius: rem(8);
  overflow: hidden;
  background-color: #f5f5f5;
}

.shelf-image {
  display: block;
  width: 100%;
  height: auto;
}

.location-highlight {
  position: absolute;
  border: rem(3) solid #FF5722;
  background: rgba(255, 87, 34, 0.25);
  border-radius: rem(4);
  animation: pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 rem(8) rem(4) rgba(255, 87, 34, 0.3);
  }
}

.no-image-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: rem(40) rem(20);
  background-color: #f5f5f5;
  border-radius: rem(8);
  text-align: center;
  color: #9e9e9e;
}

.location-info-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: rem(15);
  color: #333;
  margin-bottom: rem(8);
  text-align: center;
  flex-wrap: wrap;
}

.location-confirm-text {
  font-size: rem(13);
  color: #f59e0b;
  text-align: center;
  
  &::before {
    content: '⚠️ ';
  }
}

.location-guide-actions {
  padding: rem(16) rem(20);
  border-top: rem(1) solid #e0e0e0;
}

// 모바일 대응
@media (max-width: 599px) {
  .location-guide-card {
    border-radius: 0 !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .location-guide-content {
    flex: 1;
    overflow-y: auto;
  }
}
</style>

