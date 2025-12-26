/**
 * useDrawer Composable
 * Navigation Drawer 상태 및 반응형 너비 관리
 * 
 * 사용 예시:
 * const { drawer, drawerWidth } = useDrawer()
 */

export const useDrawer = () => {
  // Drawer 열림/닫힘 상태 (전역 상태)
  const drawer = useState('navigationDrawer', () => false)
  
  // Drawer 너비 (반응형)
  const drawerWidth = ref(280)

  // 반응형 너비 계산 함수
  const updateWidth = () => {
    if (process.client) {
      drawerWidth.value = window.innerWidth >= 769 ? 360 : 280
    }
  }

  // 클라이언트에서만 실행
  if (process.client) {
    // 컴포넌트 마운트 시 초기화 및 이벤트 리스너 등록
    onMounted(() => {
      updateWidth()
      window.addEventListener('resize', updateWidth)
    })

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateWidth)
    })
  }

  return {
    drawer,
    drawerWidth
  }
}

