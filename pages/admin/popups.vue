<template>
  <v-app>
    <PageLayout
      header-type="back-home"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div class="popups-admin-page">
        <div class="page-header mb-6">
          <h1 class="page-title mb-0">
            팝업 관리
          </h1>
        </div>

        <!-- 상단: 신규 / 재등록 -->
        <div
          ref="registerSectionRef"
          class="section register-section mb-10"
        >
          <h2 class="section-title mb-4">
            팝업 등록
          </h2>

          <v-alert
            v-if="reRegisterPopupId"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4 re-register-alert"
          >
            <div class="d-flex align-center flex-wrap justify-space-between gap-2">
              <span class="text-body-2">선택한 팝업의 일정·링크를 수정 중입니다.</span>
              <v-btn
                variant="text"
                size="small"
                @click="cancelReRegister"
              >
                신규 등록으로 전환
              </v-btn>
            </div>
          </v-alert>

          <div class="file-upload-row mb-4">
            <v-text-field
              :model-value="registerFileHint"
              readonly
              label="이미지 파일"
              placeholder="파일을 선택해 주세요"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              class="file-upload-input flex-grow-1"
            />
            <v-btn
              color="primary"
              variant="flat"
              class="file-upload-btn"
              height="48"
              @click="triggerRegisterFile"
            >
              이미지 업로드
            </v-btn>
            <input
              ref="registerFileRef"
              type="file"
              accept="image/*"
              class="d-none"
              @change="onRegisterFile"
            >
          </div>
          <p class="text-caption text-medium-emphasis upload-hint mb-4">
            이미지 파일은 <strong>{{ popupMaxMb }}MB</strong> 이하, 가로·세로 각 <strong>{{ POPUP_MAX_IMAGE_DIMENSION }}px</strong> 이하여야 업로드됩니다.
            사용자 화면에는 가로 최대 약 <strong>600px</strong>(또는 화면의 90%) 너비로 비율을 유지해 표시됩니다.
          </p>

          <!-- 노출 일시: 50% + 50%, 각 열에 인풋 + 해당 체크박스 -->
          <div class="schedule-datetime-block mb-2">
            <div class="schedule-two-col">
              <div class="schedule-col">
                <v-text-field
                  :model-value="registerForm.startLocal"
                  label="노출 시작"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="datetime-field"
                  :disabled="registerImmediate"
                  @click="openDatetimePicker"
                  @update:model-value="(v) => { registerForm.startLocal = sanitizePopupAdminString(v) }"
                />
                <v-checkbox
                  v-model="registerImmediate"
                  label="즉시등록"
                  color="primary"
                  hide-details
                  density="compact"
                  class="schedule-mini-checkbox"
                />
              </div>
              <div class="schedule-col">
                <v-text-field
                  :model-value="registerForm.endLocal"
                  label="노출 종료"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="datetime-field"
                  :disabled="registerNoEndDate"
                  @click="openDatetimePicker"
                  @update:model-value="(v) => { registerForm.endLocal = sanitizePopupAdminString(v) }"
                />
                <v-checkbox
                  v-model="registerNoEndDate"
                  label="종료일 미정"
                  color="primary"
                  hide-details
                  density="compact"
                  class="schedule-mini-checkbox"
                />
              </div>
            </div>
          </div>
          <v-row class="schedule-link-row">
            <v-col cols="12">
              <div class="link-url-field-row mb-4">
                <v-text-field
                  :model-value="registerForm.linkUrl"
                  label="링크 URL (선택)"
                  placeholder="https://"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  @update:model-value="(v) => { registerForm.linkUrl = sanitizePopupAdminString(v) }"
                />
              </div>
              <p class="text-caption text-medium-emphasis upload-hint mb-4">
                링크를 넣은 경우, 사용자 화면에서는 <strong>새 창(새 탭)</strong>으로만 이동합니다. 주소는 <strong>http://</strong> 또는 <strong>https://</strong>로 시작해야 합니다.
              </p>
            </v-col>
          </v-row>

          <div class="register-preview-block mb-4">
            <div class="text-body-2 text-medium-emphasis mb-2">
              팝업 미리보기
            </div>
            <div
              v-if="registerPreviewUrl"
              class="preview-box"
            >
              <img
                :src="registerPreviewUrl"
                alt="미리보기"
              >
            </div>
            <div
              v-else
              class="preview-placeholder text-medium-emphasis"
            >
              이미지를 선택하면 미리보기가 표시됩니다.
            </div>
          </div>

          <v-btn
            color="primary"
            variant="flat"
            block
            size="large"
            class="register-submit-btn"
            :loading="registerLoading"
            :disabled="registerSubmitDisabled"
            @click="submitRegister"
          >
            {{ registerButtonLabel }}
          </v-btn>
        </div>

        <!-- 하단: 목록 -->
        <div class="section list-section">
          <h2 class="section-title mb-4">
            등록된 팝업
          </h2>

          <div
            v-if="listLoading"
            class="text-center py-10"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </div>

          <div
            v-else-if="popups.length === 0"
            class="text-medium-emphasis py-8"
          >
            등록된 팝업이 없습니다.
          </div>

          <div
            v-else
            class="popup-list"
          >
            <div
              v-for="item in popups"
              :key="item.id"
              class="popup-list-row"
            >
              <div
                class="popup-list-row-main"
                role="button"
                tabindex="0"
                @click="openPreview(item)"
                @keydown.enter="openPreview(item)"
              >
                <v-chip
                  size="small"
                  :color="scheduleChipColor(item)"
                  variant="flat"
                  class="mr-2"
                >
                  {{ scheduleLabel(item) }}
                </v-chip>
                <span class="popup-list-range">{{ formatRange(item) }}</span>
              </div>
              <div
                class="popup-list-row-actions"
                @click.stop
              >
                <v-btn
                  v-if="canEndPopupNow(item)"
                  variant="outlined"
                  size="small"
                  color="warning"
                  class="action-end"
                  :loading="endNowLoadingId === item.id"
                  @click="onPopupEndNow(item)"
                >
                  팝업 종료
                </v-btn>
                <v-btn
                  variant="outlined"
                  size="small"
                  color="primary"
                  class="action-repost"
                  @click="onReRegister(item)"
                >
                  팝업 재등록
                </v-btn>
                <v-btn
                  variant="outlined"
                  size="small"
                  color="error"
                  @click="onDelete(item)"
                >
                  삭제
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>

    <v-dialog
      v-model="previewDialog"
      max-width="640"
    >
      <v-card v-if="previewItem">
        <v-card-title class="d-flex align-center justify-space-between">
          미리보기
          <v-btn
            icon
            variant="text"
            @click="previewDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <img
            :src="previewItem.imageUrl"
            alt=""
            class="w-100"
            style="max-height: 70vh; object-fit: contain;"
          >
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
import {
  POPUP_MAX_FILE_BYTES,
  POPUP_MAX_IMAGE_DIMENSION,
  sanitizePopupAdminString,
  sanitizePopupLinkUrl
} from '~/composables/usePopups.js'

definePageMeta({
  layout: false,
  middleware: 'admin'
})

useHead({
  title: '팝업 관리 - CNX Library'
})

const popupMaxMb = POPUP_MAX_FILE_BYTES / (1024 * 1024)

const { confirm, alert } = useDialog()
const {
  validatePopupImageFile,
  uploadPopupImage,
  listPopups,
  createPopup,
  updatePopup,
  deletePopup
} = usePopups()

const { drawer, drawerWidth } = useDrawer()

const registerSectionRef = ref(null)
const registerFileRef = ref(null)
const registerFile = ref(null)
const registerPreviewUrl = ref('')
const registerLoading = ref(false)
const reRegisterPopupId = ref(null)
const reRegisterOldStoragePath = ref(null)
/** 재등록 모드에서 파일 선택 실패 시 복원할 기존 이미지 URL */
const reRegisterFallbackImageUrl = ref('')

const registerForm = ref({
  linkUrl: '',
  startLocal: '',
  endLocal: ''
})

/** true면 노출 시작은 등록 시점(현재 시각)으로 저장, 시작 인풋 비활성 */
const registerImmediate = ref(false)
/** true면 endAt 저장 안 함(null), 종료 인풋 비활성 */
const registerNoEndDate = ref(false)

const listLoading = ref(false)
const endNowLoadingId = ref(null)
const popups = ref([])

const previewDialog = ref(false)
const previewItem = ref(null)

const isBlobPreviewUrl = (u) => typeof u === 'string' && u.startsWith('blob:')

const revokePreviewIfBlob = () => {
  if (isBlobPreviewUrl(registerPreviewUrl.value)) {
    URL.revokeObjectURL(registerPreviewUrl.value)
  }
}

const registerFileHint = computed(() => {
  if (registerFile.value) {
    return sanitizePopupAdminString(registerFile.value.name)
  }
  if (reRegisterPopupId.value && registerPreviewUrl.value && !isBlobPreviewUrl(registerPreviewUrl.value)) {
    return '기존 이미지 (일정·링크 변경 또는 새 파일로 이미지 교체)'
  }
  return ''
})

const registerSubmitDisabled = computed(() => {
  if (reRegisterPopupId.value) {
    return !registerPreviewUrl.value
  }
  return !registerFile.value
})

const registerButtonLabel = computed(() =>
  reRegisterPopupId.value ? '변경 저장' : '등록하기'
)

const toDatetimeLocalValue = (d) => {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const defaultRegisterDates = () => {
  const start = new Date()
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  registerForm.value.startLocal = toDatetimeLocalValue(start)
  registerForm.value.endLocal = toDatetimeLocalValue(end)
}

defaultRegisterDates()

watch(registerImmediate, (v) => {
  if (v) {
    registerForm.value.startLocal = toDatetimeLocalValue(new Date())
  }
})

watch(registerNoEndDate, (v) => {
  if (v) {
    return
  }
  const start = registerImmediate.value
    ? new Date()
    : new Date(registerForm.value.startLocal)
  if (!registerForm.value.endLocal || Number.isNaN(new Date(registerForm.value.endLocal).getTime())) {
    const end = new Date((Number.isNaN(start.getTime()) ? Date.now() : start.getTime()) + 7 * 24 * 60 * 60 * 1000)
    registerForm.value.endLocal = toDatetimeLocalValue(end)
  }
})

const triggerRegisterFile = () => registerFileRef.value?.click()

/** 필드 아무 곳이나 눌러도 datetime-local 피커 열기 (크롬 등 showPicker 지원) */
const openDatetimePicker = (event) => {
  const root = event?.currentTarget
  if (!root || typeof root.querySelector !== 'function') {
    return
  }
  const input = root.querySelector('input[type="datetime-local"]')
  if (!input || input.disabled) {
    return
  }
  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }
  } catch {
    // 일부 환경에서는 보안상 showPicker 거부될 수 있음
  }
  input.focus()
  input.click()
}

const onRegisterFile = async (e) => {
  const input = e.target
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  try {
    await validatePopupImageFile(file)
    revokePreviewIfBlob()
    registerFile.value = file
    registerPreviewUrl.value = URL.createObjectURL(file)
  } catch (err) {
    registerFile.value = null
    revokePreviewIfBlob()
    registerPreviewUrl.value = reRegisterPopupId.value ? (reRegisterFallbackImageUrl.value || '') : ''
    await alert(err.message || '이미지 검증에 실패했습니다.', { type: 'error' })
  }
}

const cancelReRegister = () => {
  revokePreviewIfBlob()
  registerPreviewUrl.value = ''
  registerFile.value = null
  reRegisterPopupId.value = null
  reRegisterOldStoragePath.value = null
  reRegisterFallbackImageUrl.value = ''
  registerImmediate.value = false
  registerNoEndDate.value = false
  defaultRegisterDates()
  registerForm.value.linkUrl = ''
}

const loadList = async () => {
  listLoading.value = true
  try {
    popups.value = await listPopups()
  } catch (err) {
    console.error(err)
    await alert('목록을 불러오지 못했습니다.', { type: 'error' })
  } finally {
    listLoading.value = false
  }
}

onMounted(() => {
  loadList()
})

onBeforeUnmount(() => {
  revokePreviewIfBlob()
})

const parseSchedule = () => {
  const start = registerImmediate.value
    ? new Date()
    : new Date(registerForm.value.startLocal)
  if (!registerImmediate.value && Number.isNaN(start.getTime())) {
    return { error: '노출 시작 일시를 확인해주세요.' }
  }

  if (registerNoEndDate.value) {
    return { start, end: null }
  }

  const end = new Date(registerForm.value.endLocal)
  if (Number.isNaN(end.getTime())) {
    return { error: '노출 종료 일시를 확인해주세요.' }
  }
  if (end <= start) {
    return { error: '종료 시각은 시작 시각보다 이후여야 합니다.' }
  }
  return { start, end }
}

const submitRegister = async () => {
  const parsed = parseSchedule()
  if (parsed.error) {
    await alert(parsed.error, { type: 'warning' })
    return
  }
  const { start, end } = parsed
  const { Timestamp } = await import('firebase/firestore')
  const endAtTs = end ? Timestamp.fromDate(end) : null

  if (!reRegisterPopupId.value && !registerFile.value) {
    await alert('이미지를 선택해주세요.', { type: 'warning' })
    return
  }
  if (reRegisterPopupId.value && !registerPreviewUrl.value) {
    await alert('이미지가 없습니다.', { type: 'warning' })
    return
  }

  const rawLink = sanitizePopupAdminString(registerForm.value.linkUrl).trim()
  const linkUrl = sanitizePopupLinkUrl(rawLink)
  if (rawLink && !linkUrl) {
    await alert('링크 URL은 http:// 또는 https://로 시작하는 주소만 입력할 수 있습니다.', { type: 'warning' })
    return
  }

  registerLoading.value = true
  try {
    if (reRegisterPopupId.value) {
      const id = reRegisterPopupId.value
      const oldPath = reRegisterOldStoragePath.value
      const file = registerFile.value

      if (file) {
        const { imageUrl, storagePath } = await uploadPopupImage(file)
        await updatePopup(id, {
          imageUrl,
          storagePath,
          linkUrl,
          startAt: Timestamp.fromDate(start),
          endAt: endAtTs
        })
        if (oldPath && oldPath !== storagePath) {
          const { $firebaseStorage: st } = useNuxtApp()
          if (st) {
            try {
              const { ref: storageRef, deleteObject } = await import('firebase/storage')
              await deleteObject(storageRef(st, oldPath))
            } catch (e) {
              console.warn(e)
            }
          }
        }
      } else {
        await updatePopup(id, {
          linkUrl,
          startAt: Timestamp.fromDate(start),
          endAt: endAtTs
        })
      }
      await alert('저장되었습니다.', { type: 'success' })
      cancelReRegister()
    } else {
      const { imageUrl, storagePath } = await uploadPopupImage(registerFile.value)
      await createPopup({
        imageUrl,
        storagePath,
        linkUrl,
        startAt: Timestamp.fromDate(start),
        endAt: endAtTs,
        enabled: true
      })
      await alert('등록되었습니다.', { type: 'success' })
      registerFile.value = null
      revokePreviewIfBlob()
      registerPreviewUrl.value = ''
      registerImmediate.value = false
      registerNoEndDate.value = false
      defaultRegisterDates()
      registerForm.value.linkUrl = ''
    }
    await loadList()
  } catch (err) {
    console.error(err)
    await alert(err.message || '처리에 실패했습니다.', { type: 'error' })
  } finally {
    registerLoading.value = false
  }
}

const formatRange = (item) => {
  const s = item.startAt?.toDate?.()
  if (!s) {
    return '-'
  }
  const startStr = s.toLocaleString('ko-KR')
  if (item.endAt == null) {
    return `${startStr} ~ 종료일 미정`
  }
  const e = item.endAt?.toDate?.()
  if (!e) {
    return '-'
  }
  return `${startStr} ~ ${e.toLocaleString('ko-KR')}`
}

const scheduleLabel = (item) => {
  if (!item.enabled) {
    return '비활성'
  }
  const now = Date.now()
  const start = item.startAt?.toMillis?.() ?? 0
  if (start > now) {
    return '예정'
  }
  if (item.endAt == null) {
    return '노출 중'
  }
  const end = item.endAt.toMillis()
  if (end < now) {
    return '종료'
  }
  return '노출 중'
}

/** 노출 시작 후이고, 아직 종료 시각이 없거나(now 미만) 종료일 미정인 경우 수동 종료 가능 */
const canEndPopupNow = (item) => {
  if (!item.enabled) {
    return false
  }
  const now = Date.now()
  const start = item.startAt?.toMillis?.() ?? 0
  if (start > now) {
    return false
  }
  if (item.endAt == null) {
    return true
  }
  return item.endAt.toMillis() >= now
}

const onPopupEndNow = async (item) => {
  const ok = await confirm('지금 시각을 기준으로 이 팝업 노출을 종료할까요?', {
    title: '팝업 종료',
    confirmText: '종료',
    type: 'warning'
  })
  if (!ok) {
    return
  }
  endNowLoadingId.value = item.id
  try {
    const { Timestamp } = await import('firebase/firestore')
    await updatePopup(item.id, { endAt: Timestamp.fromDate(new Date()) })
    await alert('팝업이 종료 처리되었습니다.', { type: 'success' })
    await loadList()
  } catch (err) {
    console.error(err)
    await alert('종료 처리에 실패했습니다.', { type: 'error' })
  } finally {
    endNowLoadingId.value = null
  }
}

const scheduleChipColor = (item) => {
  const t = scheduleLabel(item)
  if (t === '노출 중') {
    return 'success'
  }
  if (t === '예정') {
    return 'info'
  }
  if (t === '종료') {
    return 'default'
  }
  return 'warning'
}

const openPreview = (item) => {
  previewItem.value = item
  previewDialog.value = true
}

const onReRegister = (item) => {
  reRegisterPopupId.value = item.id
  reRegisterOldStoragePath.value = item.storagePath || null
  reRegisterFallbackImageUrl.value = item.imageUrl || ''
  registerImmediate.value = false
  registerNoEndDate.value = item.endAt == null
  revokePreviewIfBlob()
  registerFile.value = null
  registerPreviewUrl.value = item.imageUrl || ''
  const startD = item.startAt?.toDate?.() ?? new Date()
  const endLocal = item.endAt?.toDate
    ? toDatetimeLocalValue(item.endAt.toDate())
    : toDatetimeLocalValue(new Date(startD.getTime() + 7 * 24 * 60 * 60 * 1000))
  registerForm.value = {
    linkUrl: sanitizePopupAdminString(item.linkUrl || ''),
    startLocal: item.startAt?.toDate ? toDatetimeLocalValue(item.startAt.toDate()) : '',
    endLocal
  }
  nextTick(() => {
    registerSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const onDelete = async (item) => {
  const ok = await confirm('이 팝업을 삭제할까요? 저장소 이미지도 함께 삭제됩니다.', {
    title: '삭제 확인',
    confirmText: '삭제',
    type: 'warning'
  })
  if (!ok) {
    return
  }
  try {
    await deletePopup(item.id, item.storagePath)
    await alert('삭제되었습니다.', { type: 'success' })
    if (reRegisterPopupId.value === item.id) {
      cancelReRegister()
    }
    await loadList()
  } catch (err) {
    console.error(err)
    await alert('삭제에 실패했습니다.', { type: 'error' })
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.popups-admin-page {
  width: 100%;
}

.page-header {
  padding-bottom: rem(16);
  border-bottom: rem(1) solid #e0e0e0;
}

.page-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002c5b;
  line-height: 1.2;
  margin: 0;

  @media (max-width: 768px) {
    font-size: rem(24);
  }

  @media (max-width: 480px) {
    font-size: rem(20);
  }
}

.section-title {
  font-size: rem(18);
  font-weight: 600;
  color: #002c5b;
  margin: 0;
}

.file-upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: rem(12);

  @media (min-width: 600px) {
    align-items: center;
  }
}

.file-upload-input {
  min-width: 0;
}

.file-upload-btn {
  flex-shrink: 0;
}

.upload-hint {
  line-height: 1.5;
}

.schedule-datetime-block {
  width: 100%;
}

/* 50% | 50%, 모바일은 세로 스택 */
.schedule-two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: rem(12) rem(16);
  width: 100%;
  align-items: start;

  @media (max-width: 599px) {
    grid-template-columns: 1fr;
  }
}

.schedule-col {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: rem(4);
  min-width: 0;
}

/* 작은 체크박스 + 라벨 (Vuetify --v-selection-control-size) */
.schedule-mini-checkbox {
  align-self: flex-start;
  margin: 0;
  padding-inline-start: rem(2);

  :deep(.v-selection-control) {
    --v-selection-control-size: #{rem(22)};
    min-height: rem(26);
  }

  :deep(.v-label) {
    font-size: rem(11);
    line-height: 1.25;
    white-space: nowrap;
    opacity: 0.9;
    padding-inline-start: rem(4);
  }
}

.preview-box {
  width: 100%;
  box-sizing: border-box;
  border-radius: rem(8);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);

  img {
    display: block;
    width: 100%;
    height: auto;
  }
}

.register-preview-block {
  width: 100%;
}

.preview-placeholder {
  width: 100%;
  min-height: rem(160);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: rem(8);
  padding: rem(16);
  box-sizing: border-box;
}

.datetime-field {
  width: 100%;
  min-width: 0;

  :deep(.v-field),
  :deep(.v-field__field) {
    cursor: pointer;
  }

  :deep(.v-field__input) {
    min-height: rem(52);
    padding-top: rem(10);
    padding-bottom: rem(10);
  }

  :deep(input[type='datetime-local']) {
    min-width: 0;
    width: 100%;
    min-height: rem(44);
    cursor: pointer;
    font-size: rem(15);
    -webkit-appearance: none;
    appearance: none;
  }
}

.register-submit-btn {
  max-width: 100%;
}

.popup-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: rem(8);
  overflow: hidden;
}

.popup-list-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: rem(12);
  padding: rem(14) rem(16);
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.popup-list-row-main {
  flex: 1 1 rem(200);
  min-width: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: rem(8);
}

.popup-list-range {
  font-size: rem(14);
  color: rgba(0, 0, 0, 0.7);
}

.popup-list-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: rem(8);
  flex-shrink: 0;
}

.action-repost {
  min-width: rem(104);
}

/* 도서 관리 등과 동일: 햄버거 메뉴 드로어 위치·z-index (누락 시 메뉴가 안 보이거나 뒤에 가림) */
.side-navigation {
  z-index: 1000;
}

.side-navigation :deep(.v-navigation-drawer__content) {
  background-color: #002c5b;
}

.side-navigation :deep(.v-navigation-drawer) {
  border: none;
}

.side-navigation :deep(.v-navigation-drawer__border) {
  display: none;
}

.drawer-content {
  padding: rem(16);
  color: #fff;
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
