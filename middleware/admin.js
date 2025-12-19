export default defineNuxtRouteMiddleware(async (to, from) => {
  // 클라이언트 사이드에서만 실행
  if (process.server) {
    return
  }

  const { isAuthenticated, loading, user } = useAuth()
  const authStateReady = useState('auth_state_ready')
  const authInitialized = useState('auth_initialized', () => false)

  // 인증 상태 확인 대기
  if (!authInitialized.value && authStateReady.value) {
    try {
      await Promise.race([
        authStateReady.value,
        new Promise(resolve => setTimeout(resolve, 5000))
      ])
    } catch (error) {
      console.error('인증 상태 확인 대기 중 오류:', error)
    }
  }

  // 인증 상태 로딩이 완료될 때까지 대기
  if (loading.value) {
    const maxWait = 5000
    const startTime = Date.now()
    while (loading.value && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }

  // 관리자 권한 확인
  const { $firebaseFirestore } = useNuxtApp()
  const firestore = $firebaseFirestore

  if (!firestore || !user.value) {
    return navigateTo('/')
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const isAdmin = userData.role === 'admin' || userData.role === 'manager'
      const isSuperAdmin = userData.role === 'admin'

      // 최고관리자 전용 경로 체크
      const superAdminOnlyPaths = ['/admin/managers']
      const isSuperAdminOnlyPath = superAdminOnlyPaths.some(path => to.path.startsWith(path))

      if (isSuperAdminOnlyPath && !isSuperAdmin) {
        // 최고관리자 전용 경로에 최고관리자가 아닌 경우 홈으로 리다이렉트
        return navigateTo('/')
      }

      if (!isAdmin) {
        // 관리자 권한이 없으면 홈으로 리다이렉트
        return navigateTo('/')
      }
    } else {
      // 사용자 정보가 없으면 홈으로 리다이렉트
      return navigateTo('/')
    }
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error)
    return navigateTo('/')
  }
})

