export default defineNuxtRouteMiddleware(async (to, from) => {
  // 클라이언트 사이드에서만 실행
  if (process.server) return

  // 혹시 다른 경로에서 재사용할 수도 있어, request 하위까지 막습니다.
  if (!to.path.startsWith('/books/request')) return

  // 드로어가 열려있으면 닫기
  const drawer = useState('navigationDrawer', () => false)
  drawer.value = false

  const { alert } = useDialog()

  await alert('당분간 도서 신청 기능이 중단됩니다.\n다음에 다시 만나요.', {
    title: '도서 신청 중단 안내',
    type: 'warning',
    confirmText: '돌아가기'
  })

  // 이전 화면이 있으면 그곳으로, 없으면 홈으로
  const fallback = '/'
  const backTo =
    from?.fullPath && from.fullPath !== to.fullPath ? from.fullPath : fallback

  return navigateTo(backTo)
})

