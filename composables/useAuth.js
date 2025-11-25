import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth'

export const useAuth = () => {
  const { $firebaseAuth } = useNuxtApp()
  const router = useRouter()
  const auth = $firebaseAuth

  const user = useState('firebase_user', () => null)
  const loading = useState('auth_loading', () => true)

  // 클라이언트 사이드에서만 Firebase Auth 초기화
  if (process.client && auth) {
    // 인증 상태 감지
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
    })
  } else {
    // 서버 사이드이거나 auth가 없으면 로딩 완료
    if (process.server || !auth) {
      loading.value = false
    }
  }

  // 로그인
  const login = async (email, password) => {
    if (!auth) {
      console.error('Firebase Auth가 초기화되지 않았습니다.')
      return { success: false, error: 'Firebase Auth가 초기화되지 않았습니다.' }
    }

    try {
      loading.value = true
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return { success: true, user: userCredential.user }
    } catch (error) {
      loading.value = false
      let errorMessage = '로그인에 실패했습니다.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '이메일 형식이 올바르지 않습니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // 로그아웃
  const logout = async () => {
    if (!auth) {
      console.error('Firebase Auth가 초기화되지 않았습니다.')
      return { success: false, error: 'Firebase Auth가 초기화되지 않았습니다.' }
    }

    try {
      await signOut(auth)
      user.value = null
      await router.push('/login')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 로그인 여부 확인
  const isAuthenticated = computed(() => !!user.value)

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    login,
    logout
  }
}

