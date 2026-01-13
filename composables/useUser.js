/**
 * useUser Composable
 * 현재 로그인한 사용자의 Firestore 데이터 관리
 * 
 * 사용 예시:
 * const { userData, workplace, name, role, isAdmin, isSuperAdmin, loadUserData } = useUser()
 */

export const useUser = () => {
  const { user } = useAuth()
  const { $firebaseFirestore } = useNuxtApp()
  const firestore = $firebaseFirestore

  // 사용자 Firestore 데이터 (전역 상태로 캐싱)
  const userData = useState('currentUserData', () => null)
  
  // 로딩 상태
  const userDataLoading = useState('userDataLoading', () => false)

  // 계산된 속성들
  const workplace = computed(() => userData.value?.workplace || '')
  const name = computed(() => userData.value?.name || '')
  const email = computed(() => userData.value?.email || '')
  const role = computed(() => userData.value?.role || 'user')
  const center = computed(() => userData.value?.center || '')
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'manager')
  const isSuperAdmin = computed(() => role.value === 'admin')

  // 사용자 데이터 로드
  const loadUserData = async (forceRefresh = false) => {
    // 이미 데이터가 있고 강제 새로고침이 아니면 스킵
    if (userData.value && !forceRefresh) {
      return userData.value
    }

    if (!process.client || !user.value || !firestore) {
      userData.value = null
      return null
    }

    userDataLoading.value = true

    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const userRef = doc(firestore, 'users', user.value.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        userData.value = userDoc.data()
        return userData.value
      } else {
        userData.value = null
        return null
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error)
      userData.value = null
      return null
    } finally {
      userDataLoading.value = false
    }
  }

  // 사용자 데이터 초기화 (로그아웃 시)
  const clearUserData = () => {
    userData.value = null
  }

  // 사용자 변경 감지
  watch(() => user.value, async (newUser, oldUser) => {
    if (newUser && newUser.uid !== oldUser?.uid) {
      // 새 사용자 로그인 - 데이터 로드
      await loadUserData(true)
    } else if (!newUser) {
      // 로그아웃 - 데이터 초기화
      clearUserData()
    }
  }, { immediate: true })

  return {
    // 상태
    userData,
    userDataLoading,
    
    // 계산된 속성
    workplace,
    name,
    email,
    role,
    center,
    isAdmin,
    isSuperAdmin,
    
    // 메서드
    loadUserData,
    clearUserData
  }
}







