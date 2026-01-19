<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- 전역 다이얼로그 -->
  <GlobalDialog />
</template>

<script setup>
// Nuxt 3 앱 진입점
// 인증 상태 초기화는 useAuth composable에서 처리됩니다

const { user, logout } = useAuth()

// 10분 비활성 자동 로그아웃 (공공PC 환경)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10분
const THROTTLE_DELAY = 1000 // 스로틀링 1초
let inactivityTimer = null
let lastActivityTime = 0

const resetInactivityTimer = () => {
  // 스로틀링: 1초 내 중복 호출 무시
  const now = Date.now()
  if (now - lastActivityTime < THROTTLE_DELAY) {
    return
  }
  lastActivityTime = now
  
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
  }
  
  // 로그인 상태일 때만 타이머 설정
  if (user.value) {
    inactivityTimer = setTimeout(async () => {
      // 자동 로그아웃 처리
      await logout()
    }, INACTIVITY_TIMEOUT)
  }
}

const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

onMounted(() => {
  if (process.client) {
    // 초기 타이머 설정
    resetInactivityTimer()
    
    // 사용자 활동 이벤트 리스너 등록
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    })
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    // 타이머 정리
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
    }
    
    // 이벤트 리스너 제거
    activityEvents.forEach(event => {
      window.removeEventListener(event, resetInactivityTimer)
    })
  }
})

// user 상태 변경 감지
watch(user, (newUser) => {
  if (newUser) {
    // 로그인 시 타이머 시작
    resetInactivityTimer()
  } else {
    // 로그아웃 시 타이머 정리
    if (inactivityTimer) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
  }
})
</script>

