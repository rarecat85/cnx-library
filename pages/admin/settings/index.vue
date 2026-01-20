<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="settings-admin-page">
        <!-- 센터 정보 헤더 -->
        <div class="center-header mb-6">
          <div class="center-header-inner">
            <h1 class="page-title mb-0">
              설정 관리
            </h1>
            <v-select
              v-model="currentCenter"
              :items="centerOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              class="center-select"
            />
          </div>
        </div>

        <!-- 카테고리 관리 섹션 -->
        <div class="section mb-8">
          <div class="section-header d-flex align-center justify-space-between mb-4">
            <h3 class="section-title mb-0">
              카테고리 관리
            </h3>
            <div class="section-actions">
              <v-btn
                v-if="selectedCategories.length > 0"
                class="action-btn"
                variant="flat"
                size="small"
                :loading="categoryDeleteLoading"
                @click="handleDeleteSelectedCategories"
              >
                카테고리 삭제 ({{ selectedCategories.length }})
              </v-btn>
            </div>
          </div>

          <div
            v-if="categoriesLoading"
            class="text-center py-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <div
            v-else
            class="categories-grid"
          >
            <!-- 카테고리 아이템들 -->
            <div
              v-for="category in filteredCategories"
              :key="category.name"
              class="category-item"
              :class="{ 'category-item-selected': selectedCategories.includes(category.name) }"
              @click="toggleCategorySelection(category.name)"
            >
              <span class="category-label">
                {{ category.name }}
                <span class="category-count">({{ category.bookCount || 0 }})</span>
              </span>
            </div>

            <!-- 카테고리 추가 버튼 (점선 스타일) -->
            <div
              class="category-item category-add-item"
              @click="openAddCategoryDialog"
            >
              <v-icon
                size="18"
                color="primary"
              >
                mdi-plus
              </v-icon>
              <span class="category-add-label">카테고리 추가</span>
            </div>
          </div>
        </div>

        <!-- 서가 이미지 관리 섹션 -->
        <div class="section mb-8">
          <h3 class="section-title mb-4">
            서가 이미지
          </h3>

          <div
            v-if="imagesLoading"
            class="text-center py-6"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <div
            v-else
            class="shelf-images-container"
          >
            <!-- 등록된 이미지들 (현재 센터 기준 필터링) -->
            <div
              v-for="image in filteredShelfImages"
              :key="image.id"
              class="shelf-image-item"
            >
              <div
                class="shelf-image-wrapper"
                @click="openImagePreview(image)"
              >
                <img
                  :src="image.url"
                  :alt="image.name"
                >
                <div class="image-overlay">
                  <v-icon
                    color="white"
                    size="24"
                  >
                    mdi-magnify-plus
                  </v-icon>
                </div>
                <v-btn
                  icon
                  size="small"
                  color="error"
                  variant="flat"
                  class="delete-image-btn"
                  @click.stop="handleDeleteImage(image)"
                >
                  <v-icon size="small">
                    mdi-delete
                  </v-icon>
                </v-btn>
              </div>
              <div class="shelf-image-name">
                {{ image.name }}
              </div>
            </div>

            <!-- 이미지 추가 버튼 -->
            <div
              class="shelf-image-item add-image-item"
              @click="triggerFileInput"
            >
              <div class="add-image-placeholder">
                <v-icon
                  size="32"
                  color="grey"
                >
                  mdi-plus
                </v-icon>
              </div>
              <div class="shelf-image-name text-grey">
                이미지 추가
              </div>
            </div>
          </div>

          <!-- 숨겨진 파일 입력 -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileSelect"
          >
        </div>

        <!-- 칸-이미지 매핑 섹션 -->
        <div class="section">
          <h3 class="section-title mb-4">
            칸-이미지 매핑
          </h3>

          <div
            v-if="mappingLoading"
            class="text-center py-6"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <div
            v-else
            class="location-grid"
          >
            <!-- 칸 아이템들 -->
            <div
              v-for="location in allLocations"
              :key="location.value"
              class="location-item"
            >
              <!-- 수정 모드 -->
              <template v-if="editingLocation === location.value">
                <div class="location-edit-form">
                  <v-text-field
                    v-model="editLocationNameValue"
                    label="칸 이름"
                    density="compact"
                    hide-details
                    variant="outlined"
                    class="location-edit-input mb-2"
                  />
                  <v-select
                    v-model="editLocationImageValue"
                    :items="imageSelectOptions"
                    item-title="name"
                    item-value="id"
                    label="서가 이미지"
                    density="compact"
                    hide-details
                    variant="outlined"
                    placeholder="이미지 선택"
                    clearable
                    class="location-edit-input"
                  />
                  <div class="location-edit-actions mt-2">
                    <v-btn
                      size="small"
                      color="primary"
                      variant="flat"
                      @click="saveLocationEdit(location.value)"
                    >
                      저장
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="text"
                      @click="cancelLocationEdit"
                    >
                      취소
                    </v-btn>
                  </div>
                </div>
              </template>

              <!-- 보기 모드 -->
              <template v-else>
                <div class="location-view">
                  <div class="location-info">
                    <div class="location-name-row">
                      <span class="location-name">{{ location.text }}</span>
                      <v-chip
                        v-if="defaultLocation === location.value"
                        size="x-small"
                        color="primary"
                        variant="flat"
                        class="default-badge"
                      >
                        기본
                      </v-chip>
                      <v-btn
                        v-else
                        size="x-small"
                        variant="text"
                        color="grey"
                        class="set-default-btn"
                        @click.stop="handleSetDefaultLocation(location.value)"
                      >
                        기본으로 설정
                      </v-btn>
                    </div>
                    <span class="location-image-name">
                      {{ getMappedImageName(location.value) }}
                    </span>
                  </div>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    class="location-edit-btn"
                    @click="startLocationEdit(location)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                  </v-btn>
                </div>
              </template>
            </div>

            <!-- 칸 추가 버튼 -->
            <div
              class="location-item location-add-item"
              @click="openAddLocationDialog"
            >
              <v-icon
                size="24"
                color="primary"
              >
                mdi-plus
              </v-icon>
              <span class="location-add-label">칸 추가</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>

    <!-- 카테고리 추가 다이얼로그 -->
    <v-dialog
      v-model="categoryDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-card-title class="dialog-title">
          카테고리 추가
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="categoryForm.name"
            label="카테고리명"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeCategoryDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            :loading="categoryLoading"
            @click="handleSaveCategory"
          >
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 칸 추가 다이얼로그 -->
    <v-dialog
      v-model="locationDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-card-title class="dialog-title">
          칸 추가
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="locationForm.name"
            label="칸 이름"
            variant="outlined"
            density="comfortable"
            placeholder="예: 17번 칸, 신규칸 등"
            class="mb-4"
          />
          <v-select
            v-model="locationForm.imageId"
            :items="imageSelectOptions"
            item-title="name"
            item-value="id"
            label="서가 이미지"
            variant="outlined"
            density="comfortable"
            placeholder="이미지 선택 (선택사항)"
            clearable
            :no-data-text="'등록된 이미지가 없습니다. 먼저 서가 이미지를 추가해주세요.'"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeAddLocationDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            :loading="locationLoading"
            @click="handleAddLocation"
          >
            추가
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 이미지 업로드 다이얼로그 -->
    <v-dialog
      v-model="uploadImageDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-card-title class="dialog-title">
          서가 이미지 업로드
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="imageForm.name"
            label="이미지 이름"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          />
          <v-file-input
            v-model="imageForm.file"
            label="이미지 파일"
            variant="outlined"
            density="comfortable"
            accept="image/*"
            prepend-icon=""
            prepend-inner-icon="mdi-image"
          />
          <div
            v-if="imageForm.file && imageForm.file.length > 0"
            class="image-preview-small mt-4"
          >
            <img
              :src="getFilePreviewUrl(imageForm.file[0])"
              alt="미리보기"
            >
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeUploadImageDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            :loading="imageLoading"
            :disabled="!imageForm.name || !imageForm.file || imageForm.file.length === 0"
            @click="handleUploadImage"
          >
            업로드
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 이미지 이름 수정 다이얼로그 -->
    <v-dialog
      v-model="editImageDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-card-title class="dialog-title">
          이미지 이름 수정
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editImageForm.name"
            label="이미지 이름"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeEditImageDialog"
          >
            취소
          </v-btn>
          <v-btn
            color="primary"
            :loading="imageLoading"
            @click="handleUpdateImageName"
          >
            수정
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 이미지 미리보기 다이얼로그 -->
    <v-dialog
      v-model="imagePreviewDialog"
      max-width="800"
    >
      <v-card class="image-preview-card">
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="dialog-title">{{ previewImage?.name }}</span>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="closeImagePreview"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <div class="preview-image-container">
            <img
              v-if="previewImage"
              :src="previewImage.url"
              :alt="previewImage.name"
              class="preview-image"
            >
          </div>
        </v-card-text>
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
import { CENTERS, getCenterByWorkplace } from '@/utils/centerMapping'

definePageMeta({
  layout: false,
  middleware: 'admin'
})

const { confirm, alert } = useDialog()
const { user } = useAuth()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore
const {
  loadCategoriesByCenter,
  addCategory,
  deleteCategories,
  getBookCountByCategory,
  loadShelfImages,
  uploadShelfImage,
  deleteShelfImage,
  updateShelfImageName,
  loadLocationMapping,
  saveLocationMapping,
  loadCenterLocations,
  addCenterLocation,
  updateLocationName,
  getDefaultLocation,
  setDefaultLocation
} = useSettings()

// Navigation Drawer 상태 및 반응형 너비
const { drawer, drawerWidth } = useDrawer()

// 파일 입력 참조
const fileInputRef = ref(null)

// 센터 관련
const centerOptions = [...CENTERS]
const currentCenter = ref('')

// ==================== 카테고리 관련 상태 ====================
const categoriesLoading = ref(false)
const allCategories = ref([]) // [{ name, bookCount }]
const selectedCategories = ref([]) // 선택된 카테고리명 배열
const categoryDialog = ref(false)
const categoryForm = ref({
  name: ''
})
const categoryLoading = ref(false)
const categoryDeleteLoading = ref(false)

// 현재 센터의 카테고리 목록
const filteredCategories = computed(() => {
  return allCategories.value
})

// ==================== 이미지 관련 상태 ====================
const imagesLoading = ref(false)
const shelfImages = ref([])
const uploadImageDialog = ref(false)
const editImageDialog = ref(false)
const imagePreviewDialog = ref(false)
const editingImage = ref(null)
const previewImage = ref(null)
const imageForm = ref({
  name: '',
  file: null
})
const editImageForm = ref({
  name: ''
})
const imageLoading = ref(false)

// ==================== 매핑 관련 상태 ====================
const mappingLoading = ref(false)
const locationMappingData = ref({})
const currentMapping = ref({})

// ==================== 칸 관련 상태 ====================
const customLocations = ref([])
const locationDialog = ref(false)
const locationForm = ref({ name: '', imageId: null })
const locationLoading = ref(false)
const editingLocation = ref(null)
const editLocationNameValue = ref('')
const editLocationImageValue = ref(null)
const defaultLocation = ref(null)

// 전체 칸 목록 (센터별 커스텀 칸만 사용)
const allLocations = computed(() => {
  return customLocations.value.map(loc => ({
    value: loc.name,
    text: loc.name
  }))
})

// 현재 센터 기준으로 필터링된 서가 이미지
const filteredShelfImages = computed(() => {
  return shelfImages.value.filter(img => img.center === currentCenter.value)
})

// 이미지 선택 옵션 (현재 센터 기준)
const imageSelectOptions = computed(() => {
  return filteredShelfImages.value.map(img => ({
    id: img.id,
    name: img.name
  }))
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
      return userDoc.data().workplace || ''
    }
  } catch (error) {
    console.error('근무지 정보 로드 오류:', error)
  }

  return ''
}

// 초기화
onMounted(async () => {
  // 사용자 센터 설정 (도서 관리 페이지와 동일한 방식)
  const workplace = await getUserWorkplace()
  if (workplace) {
    const mappedCenter = getCenterByWorkplace(workplace)
    currentCenter.value = mappedCenter || centerOptions[0]
  } else {
    currentCenter.value = centerOptions[0]
  }
  
  await Promise.all([
    loadCategoriesData(),
    loadAllImages(),
    loadAllMapping(),
    loadCustomLocations()
  ])
})

// 센터 변경 시 카테고리, 매핑 및 커스텀 칸 업데이트
watch(currentCenter, async () => {
  selectedCategories.value = [] // 선택 초기화
  await loadCategoriesData()
  updateCurrentMapping()
  await loadCustomLocations()
})

// ==================== 카테고리 함수 ====================

const loadCategoriesData = async () => {
  try {
    categoriesLoading.value = true

    // 현재 센터의 카테고리 목록 로드
    const categoryNames = await loadCategoriesByCenter(currentCenter.value)
    
    // 카테고리 목록 생성 (이름과 도서 수)
    const categories = []
    for (const name of categoryNames) {
      let bookCount = 0
      try {
        bookCount = await getBookCountByCategory(currentCenter.value, name)
      } catch (err) {
        console.warn(`카테고리 ${name} 도서 수 로드 실패:`, err)
      }
      categories.push({ name, bookCount })
    }

    // 가나다순 정렬
    categories.sort((a, b) => a.name.localeCompare(b.name, 'ko'))

    allCategories.value = categories
  } catch (error) {
    console.error('카테고리 로드 오류:', error)
    allCategories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

const openAddCategoryDialog = () => {
  categoryForm.value = {
    name: ''
  }
  categoryDialog.value = true
}

const closeCategoryDialog = () => {
  categoryDialog.value = false
}

const handleSaveCategory = async () => {
  try {
    categoryLoading.value = true
    
    // 현재 센터에 카테고리 추가
    await addCategory(currentCenter.value, categoryForm.value.name)
    await alert('카테고리가 추가되었습니다.', { type: 'success' })

    closeCategoryDialog()
    await loadCategoriesData()
  } catch (error) {
    console.error('카테고리 저장 오류:', error)
    await alert(error.message || '카테고리 저장에 실패했습니다.', { type: 'error' })
  } finally {
    categoryLoading.value = false
  }
}

// 카테고리 선택 토글
const toggleCategorySelection = (categoryName) => {
  const index = selectedCategories.value.indexOf(categoryName)
  if (index === -1) {
    selectedCategories.value.push(categoryName)
  } else {
    selectedCategories.value.splice(index, 1)
  }
}

// 선택된 카테고리 삭제
const handleDeleteSelectedCategories = async () => {
  if (selectedCategories.value.length === 0) return

  const confirmed = await confirm(
    `선택한 ${selectedCategories.value.length}개의 카테고리를 삭제하시겠습니까?\n도서가 등록된 카테고리는 삭제되지 않습니다.`
  )
  if (!confirmed) return

  try {
    categoryDeleteLoading.value = true
    
    const result = await deleteCategories(currentCenter.value, selectedCategories.value)
    
    // 결과 메시지 생성
    let message = ''
    if (result.deleted.length > 0) {
      message += `${result.deleted.length}개 카테고리가 삭제되었습니다.`
    }
    if (result.failed.length > 0) {
      const failedNames = result.failed.map(f => f.name).join(', ')
      message += message ? '\n' : ''
      message += `삭제 실패: ${failedNames}\n(도서가 등록되어 있습니다.)`
    }
    
    if (result.deleted.length > 0 && result.failed.length === 0) {
      await alert(message, { type: 'success' })
    } else if (result.deleted.length > 0 && result.failed.length > 0) {
      await alert(message, { type: 'warning' })
    } else {
      await alert(message, { type: 'error' })
    }
    
    selectedCategories.value = []
    await loadCategoriesData()
  } catch (error) {
    console.error('카테고리 삭제 오류:', error)
    await alert('카테고리 삭제에 실패했습니다.', { type: 'error' })
  } finally {
    categoryDeleteLoading.value = false
  }
}

// ==================== 이미지 함수 ====================

const loadAllImages = async () => {
  try {
    imagesLoading.value = true
    
    // Firestore에서 이미지 로드
    const images = await loadShelfImages()
    shelfImages.value = images
  } catch (error) {
    console.error('이미지 로드 오류:', error)
    shelfImages.value = []
  } finally {
    imagesLoading.value = false
  }
}

const openUploadImageDialog = () => {
  imageForm.value = {
    name: '',
    file: null
  }
  uploadImageDialog.value = true
}

const closeUploadImageDialog = () => {
  uploadImageDialog.value = false
}

const handleUploadImage = async () => {
  try {
    imageLoading.value = true
    await uploadShelfImage(imageForm.value.file[0], imageForm.value.name)
    await alert('이미지가 업로드되었습니다.', { type: 'success' })
    closeUploadImageDialog()
    await loadAllImages()
  } catch (error) {
    console.error('이미지 업로드 오류:', error)
    await alert(error.message || '이미지 업로드에 실패했습니다.', { type: 'error' })
  } finally {
    imageLoading.value = false
  }
}

const openEditImageDialog = (image) => {
  editingImage.value = image
  editImageForm.value = {
    name: image.name
  }
  editImageDialog.value = true
}

const closeEditImageDialog = () => {
  editImageDialog.value = false
  editingImage.value = null
}

// 이미지 미리보기
const openImagePreview = (image) => {
  previewImage.value = image
  imagePreviewDialog.value = true
}

const closeImagePreview = () => {
  imagePreviewDialog.value = false
  previewImage.value = null
}

const handleUpdateImageName = async () => {
  try {
    imageLoading.value = true
    await updateShelfImageName(editingImage.value.id, editImageForm.value.name)
    await alert('이미지 이름이 수정되었습니다.', { type: 'success' })
    closeEditImageDialog()
    await loadAllImages()
  } catch (error) {
    console.error('이미지 이름 수정 오류:', error)
    await alert(error.message || '이미지 이름 수정에 실패했습니다.', { type: 'error' })
  } finally {
    imageLoading.value = false
  }
}

const handleDeleteImage = async (image) => {
  const confirmed = await confirm(`"${image.name}" 이미지를 삭제하시겠습니까?`)
  if (!confirmed) return

  try {
    await deleteShelfImage(image.id)
    await alert('이미지가 삭제되었습니다.', { type: 'success' })
    await loadAllImages()
  } catch (error) {
    console.error('이미지 삭제 오류:', error)
    await alert(error.message || '이미지 삭제에 실패했습니다.', { type: 'error' })
  }
}

const getFilePreviewUrl = (file) => {
  if (file) {
    return URL.createObjectURL(file)
  }
  return ''
}

const getImageUrl = (imageId) => {
  const image = shelfImages.value.find(img => img.id === imageId)
  return image?.url || ''
}

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 현재 센터의 다음 이미지 번호 계산
const getNextImageNumber = () => {
  const centerImages = filteredShelfImages.value
  if (centerImages.length === 0) return 1
  
  // "서가 이미지 N" 형식에서 숫자 추출
  const numbers = centerImages
    .map(img => {
      const match = img.name.match(/서가 이미지 (\d+)/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter(n => n > 0)
  
  if (numbers.length === 0) return centerImages.length + 1
  return Math.max(...numbers) + 1
}

// 파일 선택 처리 (직접 업로드)
const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 현재 센터의 다음 번호로 이름 자동 생성
  const nextNumber = getNextImageNumber()
  const imageName = `서가 이미지 ${nextNumber}`
  
  try {
    imageLoading.value = true
    // 현재 센터 정보와 함께 업로드
    await uploadShelfImage(file, imageName, currentCenter.value)
    await alert('이미지가 업로드되었습니다.', { type: 'success' })
    await loadAllImages()
  } catch (error) {
    console.error('이미지 업로드 오류:', error)
    await alert(error.message || '이미지 업로드에 실패했습니다.', { type: 'error' })
  } finally {
    imageLoading.value = false
    // 파일 입력 초기화
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 매핑된 이미지 이름 가져오기
const getMappedImageName = (locationValue) => {
  const imageId = currentMapping.value[locationValue]
  if (!imageId) return '-'
  const image = shelfImages.value.find(img => img.id === imageId)
  return image?.name || '-'
}

// ==================== 매핑 함수 ====================

const loadAllMapping = async () => {
  try {
    mappingLoading.value = true
    
    // Firestore에서 매핑 로드
    const mapping = await loadLocationMapping()
    locationMappingData.value = mapping || {}
    updateCurrentMapping()
  } catch (error) {
    console.error('매핑 로드 오류:', error)
    locationMappingData.value = {}
    updateCurrentMapping()
  } finally {
    mappingLoading.value = false
  }
}

const updateCurrentMapping = () => {
  currentMapping.value = locationMappingData.value[currentCenter.value] || {}
}

const handleMappingChange = async (location) => {
  try {
    const mapping = { ...currentMapping.value }
    
    // null이면 키 삭제
    if (!mapping[location]) {
      delete mapping[location]
    }
    
    await saveLocationMapping(currentCenter.value, mapping)
    
    // 로컬 데이터 업데이트
    locationMappingData.value[currentCenter.value] = mapping
  } catch (error) {
    console.error('매핑 저장 오류:', error)
    await alert('저장에 실패했습니다.', { type: 'error' })
  }
}

// ==================== 칸 함수 ====================

// 커스텀 칸 로드
const loadCustomLocations = async () => {
  try {
    customLocations.value = await loadCenterLocations(currentCenter.value)
    // 기본 칸도 함께 로드
    defaultLocation.value = await getDefaultLocation(currentCenter.value)
  } catch (error) {
    console.error('커스텀 칸 로드 오류:', error)
    customLocations.value = []
    defaultLocation.value = null
  }
}

// 기본 칸 설정
const handleSetDefaultLocation = async (locationName) => {
  try {
    await setDefaultLocation(currentCenter.value, locationName)
    defaultLocation.value = locationName
    await alert('기본 칸이 설정되었습니다.', { type: 'success' })
  } catch (error) {
    console.error('기본 칸 설정 오류:', error)
    await alert('기본 칸 설정에 실패했습니다.', { type: 'error' })
  }
}

// 칸 추가 다이얼로그
const openAddLocationDialog = () => {
  locationForm.value = { name: '', imageId: null }
  locationDialog.value = true
}

const closeAddLocationDialog = () => {
  locationDialog.value = false
}

const handleAddLocation = async () => {
  try {
    locationLoading.value = true
    
    // 1. 칸 추가
    await addCenterLocation(currentCenter.value, locationForm.value.name)
    
    // 2. 이미지 매핑 저장 (선택한 경우에만)
    if (locationForm.value.imageId) {
      const mapping = { ...currentMapping.value }
      mapping[locationForm.value.name] = locationForm.value.imageId
      await saveLocationMapping(currentCenter.value, mapping)
      
      // 로컬 데이터 업데이트
      locationMappingData.value[currentCenter.value] = mapping
      currentMapping.value = mapping
    }
    
    await alert('칸이 추가되었습니다.', { type: 'success' })
    closeAddLocationDialog()
    await loadCustomLocations()
  } catch (error) {
    console.error('칸 추가 오류:', error)
    await alert(error.message || '칸 추가에 실패했습니다.', { type: 'error' })
  } finally {
    locationLoading.value = false
  }
}

// 칸 수정 (이름 + 이미지 통합)
const startLocationEdit = (location) => {
  editingLocation.value = location.value
  editLocationNameValue.value = location.text
  editLocationImageValue.value = currentMapping.value[location.value] || null
}

const cancelLocationEdit = () => {
  editingLocation.value = null
  editLocationNameValue.value = ''
  editLocationImageValue.value = null
}

const saveLocationEdit = async (oldValue) => {
  const newName = editLocationNameValue.value.trim()
  if (!newName) {
    await alert('칸 이름을 입력해주세요.', { type: 'error' })
    return
  }

  try {
    locationLoading.value = true
    let nameChanged = false
    let imageChanged = false

    // 1. 칸 이름 변경 (변경된 경우에만)
    if (newName !== oldValue) {
      const result = await updateLocationName(currentCenter.value, oldValue, newName)
      nameChanged = true
      
      // 이름이 변경되면 매핑 키도 변경됨
      if (result.updatedCount > 0) {
        await loadCustomLocations()
        await loadAllMapping()
      }
    }

    // 2. 이미지 매핑 변경
    const currentImageId = currentMapping.value[nameChanged ? newName : oldValue]
    if (editLocationImageValue.value !== currentImageId) {
      const mapping = { ...currentMapping.value }
      const targetKey = nameChanged ? newName : oldValue
      
      if (editLocationImageValue.value) {
        mapping[targetKey] = editLocationImageValue.value
      } else {
        delete mapping[targetKey]
      }
      
      await saveLocationMapping(currentCenter.value, mapping)
      
      // 로컬 데이터 업데이트
      locationMappingData.value[currentCenter.value] = mapping
      currentMapping.value = mapping
      imageChanged = true
    }

    // 결과 메시지
    if (nameChanged || imageChanged) {
      await alert('변경사항이 저장되었습니다.', { type: 'success' })
    }
    
    cancelLocationEdit()
    
    if (nameChanged) {
      await loadCustomLocations()
      await loadAllMapping()
    }
  } catch (error) {
    console.error('칸 정보 변경 오류:', error)
    await alert(error.message || '저장에 실패했습니다.', { type: 'error' })
  } finally {
    locationLoading.value = false
  }
}

// 페이지 메타데이터
useHead({
  title: '설정 관리 - CNX Library',
  meta: [
    { name: 'description', content: '카테고리 및 위치 설정 관리' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.settings-admin-page {
  width: 100%;
}

// 센터 헤더 (도서 관리 페이지와 동일)
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
    }
  }
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

.section {
  padding-bottom: rem(24);
  border-bottom: rem(1) solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.section-title {
  font-size: rem(18);
  font-weight: 600;
  color: #002C5B;
  margin: 0;
}

// 카테고리 그리드
.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: rem(8);
}

.category-item {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: rem(8);
  padding: rem(8) rem(12);
  gap: rem(8);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  &:hover {
    background-color: #eeeeee;
  }
  
  &.category-item-selected {
    background-color: #e3f2fd;
    border-color: #1976d2;
  }
}

.category-label {
  font-size: rem(14);
  color: #333;
  white-space: nowrap;
}

.category-count {
  color: #666;
  font-size: rem(12);
}

.category-add-item {
  cursor: pointer;
  border: rem(2) dashed #bdbdbd;
  background-color: transparent;
  
  &:hover {
    background-color: #e3f2fd;
    border-color: #1976d2;
  }
}

.category-add-label {
  font-size: rem(14);
  color: #1976d2;
  font-weight: 500;
}

// 액션 버튼 (도서 관리 페이지와 동일)
.action-btn {
  background-color: #002C5B;
  color: #FFFFFF;
  
  &:hover:not(:disabled) {
    background-color: #003d7a;
  }
  
  &:disabled {
    background-color: #fafafa;
    color: #bdbdbd;
  }
}

// 서가 이미지 컨테이너
.shelf-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: rem(20);
}

.shelf-image-item {
  width: calc(50% - rem(10));
  
  @media (max-width: 600px) {
    width: 100%;
  }
}

.shelf-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: rem(8);
  overflow: hidden;
  background-color: #f5f5f5;
  cursor: pointer;
  box-shadow: 0 rem(2) rem(8) rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s, transform 0.2s;
  
  &:hover {
    box-shadow: 0 rem(4) rem(16) rgba(0, 0, 0, 0.15);
    transform: translateY(rem(-2));
    
    .image-overlay {
      opacity: 1;
    }
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.delete-image-btn {
  position: absolute;
  top: rem(8);
  right: rem(8);
  opacity: 0.9;
  z-index: 1;
  
  &:hover {
    opacity: 1;
  }
}

.shelf-image-name {
  margin-top: rem(10);
  font-size: rem(14);
  color: #333;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.add-image-item {
  cursor: pointer;
  
  .add-image-placeholder {
    width: 100%;
    aspect-ratio: 4 / 3;
    border: rem(2) dashed #bdbdbd;
    border-radius: rem(8);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafafa;
    transition: all 0.2s;
    
    &:hover {
      border-color: #1976d2;
      background-color: #e3f2fd;
      
      .v-icon {
        color: #1976d2 !important;
      }
    }
  }
}

// 이미지 미리보기 다이얼로그
.image-preview-card {
  .dialog-title {
    font-size: rem(16);
    font-weight: 600;
    color: #002C5B;
  }
}

.preview-image-container {
  width: 100%;
  max-height: 70vh;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
}

.image-preview-small {
  width: 100%;
  max-height: rem(200);
  border-radius: rem(8);
  overflow: hidden;
  
  img {
    width: 100%;
    height: auto;
    object-fit: contain;
  }
}

// 칸 그리드
.location-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: rem(12);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.location-item {
  background-color: #f5f5f5;
  border-radius: rem(8);
  padding: rem(12);
}

// 보기 모드
.location-view {
  display: flex;
  align-items: center;
  gap: rem(8);
  height: 100%;
}

.location-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: rem(4);
  min-width: 0;
}

.location-name {
  font-weight: 600;
  font-size: rem(14);
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-name-row {
  display: flex;
  align-items: center;
  gap: rem(6);
  flex-wrap: wrap;
}

.default-badge {
  font-size: rem(10);
  height: rem(18);
}

.set-default-btn {
  font-size: rem(10);
  height: rem(18);
  padding: 0 rem(4);
  min-width: auto;
  text-transform: none;
}

.location-image-name {
  font-size: rem(12);
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-edit-btn {
  flex-shrink: 0;
}

// 수정 모드
.location-edit-form {
  width: 100%;
}

.location-edit-input {
  :deep(.v-field__input) {
    font-size: rem(13);
    padding: rem(4) rem(8);
    min-height: rem(32);
  }
}

.location-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: rem(8);
}

.location-add-item {
  cursor: pointer;
  border: rem(2) dashed #bdbdbd;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: rem(80);
  transition: all 0.2s;
  
  &:hover {
    border-color: #1976d2;
    background-color: #e3f2fd;
  }
}

.location-add-label {
  font-size: rem(14);
  color: #1976d2;
  font-weight: 500;
  margin-top: rem(4);
}

// 다이얼로그
.dialog-title {
  font-size: rem(18);
  font-weight: 600;
  color: #002C5B;
  padding: rem(20) rem(24) rem(12);
}

// 빈 상태
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  p {
    margin: 0;
  }
}

// 사이드 네비게이션
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
