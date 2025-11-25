export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

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

