<template>
  <v-dialog
    v-if="popup"
    v-model="visible"
    attach="body"
    location="center"
    location-strategy="static"
    :scrim="true"
    class="site-popup-overlay"
    content-class="site-popup-overlay-content"
  >
    <v-card
      class="site-popup-card"
      rounded="lg"
    >
      <div class="site-popup-card-inner">
        <a
          v-if="safeLinkUrl"
          :href="safeLinkUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="site-popup-image-link"
        >
          <img
            :src="popupImageUrl"
            alt="공지"
            class="site-popup-image"
          >
        </a>
        <img
          v-else
          :src="popupImageUrl"
          alt="공지"
          class="site-popup-image"
        >

        <div class="site-popup-footer">
          <div class="site-popup-footer-row">
            <v-checkbox
              v-model="dontShowToday"
              hide-details
              density="compact"
              color="primary"
              label="오늘 하루 보지 않기"
              class="site-popup-checkbox"
            />
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              class="site-popup-dismiss-btn"
              @click="handleClose(dontShowToday)"
            >
              닫기
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { pickPopupImageUrl, sanitizePopupLinkUrl } from '~/composables/usePopups.js'

const LS_DISMISS = 'cnx_library_site_popup_dismiss'

const route = useRoute()
const { user } = useAuth()
const { getActivePopupForNow } = usePopups()

const visible = ref(false)
const popup = ref(null)
const dontShowToday = ref(false)
const isMobile = ref(false)

const safeLinkUrl = computed(() => {
  const u = popup.value?.linkUrl
  return u ? sanitizePopupLinkUrl(u) : ''
})

const popupImageUrl = computed(() => pickPopupImageUrl(popup.value, isMobile.value))

/** 관리자 페이지에서는 공지 레이어를 띄우지 않음(다이얼로그가 화면을 가리는 문제 방지) */
const isAdminRoute = () => {
  const n = route.name
  if (typeof n === 'string' && n.startsWith('admin-')) {
    return true
  }
  return /\/admin(\/|$)/.test(route.path || '')
}

const localDateKey = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const popupVersion = (p) => {
  const ts = p.updatedAt || p.createdAt
  return ts?.toMillis?.() ?? 0
}

const shouldShowPopup = (p) => {
  if (!process.client || !p) {
    return false
  }
  const sessKey = `cnx_library_site_popup_sess_${p.id}`
  if (sessionStorage.getItem(sessKey)) {
    return false
  }
  const version = popupVersion(p)
  try {
    const raw = localStorage.getItem(LS_DISMISS)
    if (!raw) {
      return true
    }
    const o = JSON.parse(raw)
    if (o.popupId !== p.id || o.version !== version) {
      return true
    }
    if (o.day !== localDateKey()) {
      return true
    }
    return false
  } catch {
    return true
  }
}

const syncVisibility = async () => {
  if (!process.client || !user.value) {
    visible.value = false
    popup.value = null
    return
  }
  if (isAdminRoute()) {
    visible.value = false
    popup.value = null
    return
  }
  try {
    const p = await getActivePopupForNow()
    popup.value = p
    dontShowToday.value = false
    if (p && shouldShowPopup(p)) {
      visible.value = true
    } else {
      visible.value = false
    }
  } catch (e) {
    console.error('팝업 로드 오류:', e)
    visible.value = false
    popup.value = null
  }
}

watch([user, () => route.fullPath], () => {
  syncVisibility()
}, { immediate: true })

onMounted(() => {
  if (!process.client) {
    return
  }
  const mq = window.matchMedia('(max-width: 600px)')
  const apply = () => { isMobile.value = !!mq.matches }
  apply()
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', apply)
    onBeforeUnmount(() => mq.removeEventListener('change', apply))
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(apply)
    onBeforeUnmount(() => mq.removeListener(apply))
  }
})

const handleClose = (forToday) => {
  if (!popup.value || !process.client) {
    visible.value = false
    return
  }
  const p = popup.value
  if (forToday) {
    localStorage.setItem(LS_DISMISS, JSON.stringify({
      popupId: p.id,
      day: localDateKey(),
      version: popupVersion(p)
    }))
  } else {
    sessionStorage.setItem(`cnx_library_site_popup_sess_${p.id}`, '1')
  }
  visible.value = false
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.site-popup-card {
  width: min(90vw, 600px);
  max-width: 100%;
  overflow: hidden;
}

.site-popup-card-inner {
  position: relative;
  padding: rem(8) rem(8) rem(16);
}

.site-popup-image-link {
  display: block;
  text-decoration: none;
}

.site-popup-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 85vh;
  object-fit: contain;
  border-radius: rem(8);
}

.site-popup-footer {
  padding: rem(12) rem(8) 0;
}

.site-popup-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: rem(10);
  flex-wrap: nowrap;
}

.site-popup-checkbox {
  flex: 0 1 auto;
  min-width: 0;
}

.site-popup-checkbox :deep(.v-selection-control) {
  min-height: rem(36);
}

.site-popup-checkbox :deep(.v-label) {
  font-size: rem(14);
}

/* 오른쪽 끝, 텍스트 너비만큼만 (늘리지 않음) */
.site-popup-dismiss-btn {
  flex: 0 0 auto;
  min-width: unset;
  font-weight: 600;
  font-size: rem(13);
}

.site-popup-dismiss-btn :deep(.v-btn__content) {
  padding-inline: rem(14);
}

@media (max-width: 380px) {
  .site-popup-footer-row {
    flex-wrap: wrap;
  }

  .site-popup-dismiss-btn {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>

<style lang="scss">
/* 뷰포트 기준 가로·세로 정중앙 (Vuetify가 넣는 inset/offset 무력화) */
.site-popup-overlay.v-dialog {
  align-items: center;
  justify-content: center;
}

.site-popup-overlay.v-dialog > .v-overlay__content.site-popup-overlay-content {
  position: fixed !important;
  inset: auto !important;
  top: 50% !important;
  left: 50% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  width: min(90vw, 600px) !important;
  max-width: calc(100vw - 32px) !important;
  margin: 0 !important;
}
</style>
