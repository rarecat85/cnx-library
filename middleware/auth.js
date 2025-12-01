export default defineNuxtRouteMiddleware(async (to, from) => {
  // 클라이언트 사이드에서만 실행
  if (process.server) {
    return
  }

  const { isAuthenticated, loading } = useAuth()
  const authStateReady = useState('auth_state_ready')
  const authInitialized = useState('auth_initialized', () => false)

  // onAuthStateChanged의 첫 번째 콜백이 실행될 때까지 반드시 대기
  if (!authInitialized.value && authStateReady.value) {
    try {
      // Promise.race 대신 직접 await하여 완료까지 기다림
      await Promise.race([
        authStateReady.value,
        new Promise(resolve => setTimeout(resolve, 5000)) // 최대 5초 대기
      ])
    } catch (error) {
      console.error('인증 상태 확인 대기 중 오류:', error)
    }
  }

  // 인증 상태 로딩이 완료될 때까지 추가 대기
  if (loading.value) {
    const maxWait = 5000 // 더 긴 시간으로 증가
    const startTime = Date.now()
    while (loading.value && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50)) // 더 짧은 간격
    }
  }

  // 로그인 페이지는 인증 체크 제외
  if (to.path === '/login') {
    // 이미 로그인된 경우 메인으로 리다이렉트
    if (isAuthenticated.value) {
      return navigateTo('/')
    }
    return
  }

  // 인증이 필요한 페이지에서 로그인하지 않은 경우
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})

