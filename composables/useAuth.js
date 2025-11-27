import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'

export const useAuth = () => {
  const { $firebaseAuth, $firebaseFirestore } = useNuxtApp()
  const router = useRouter()
  const auth = $firebaseAuth
  const firestore = $firebaseFirestore

  const user = useState('firebase_user', () => null)
  const loading = useState('auth_loading', () => true)

  // 클라이언트 사이드에서만 Firebase Auth 초기화
  if (process.client && auth) {
    // 인증 상태 감지
    onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
      
      // 이메일 인증 완료 시 Firestore 업데이트
      if (firebaseUser && firebaseUser.emailVerified && firestore) {
        try {
          const userRef = doc(firestore, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userRef)
          
          // 사용자 문서가 존재하고 아직 인증 시간이 업데이트되지 않은 경우
          if (userDoc.exists()) {
            const userData = userDoc.data()
            if (!userData.emailVerifiedAt) {
              await setDoc(userRef, {
                emailVerified: true,
                emailVerifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              }, { merge: true })
            }
          }
        } catch (error) {
          console.error('이메일 인증 상태 업데이트 실패:', error)
        }
      }
    })
  } else {
    // 서버 사이드이거나 auth가 없으면 로딩 완료
    if (process.server || !auth) {
      loading.value = false
    }
  }

  // 회원가입
  const signup = async (email, password, name, center) => {
    if (!auth || !firestore) {
      console.error('Firebase가 초기화되지 않았습니다.')
      return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
    }

    try {
      loading.value = true
      
      // Firebase Auth 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // 이메일 인증 링크 발송
      await sendEmailVerification(firebaseUser)
      
      // Firestore에 사용자 정보 저장
      const userRef = doc(firestore, 'users', firebaseUser.uid)
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: email,
        name: name,
        center: center,
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // 로그아웃 (이메일 인증 완료 전까지는 로그인 상태 유지하지 않음)
      await signOut(auth)
      
      loading.value = false
      return { success: true, user: firebaseUser }
    } catch (error) {
      loading.value = false
      let errorMessage = '회원가입에 실패했습니다.'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '이메일 형식이 올바르지 않습니다.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '이메일/비밀번호 로그인이 비활성화되어 있습니다.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // 이메일 인증 링크 재발송 (로그인한 사용자용)
  const resendVerificationEmail = async () => {
    if (!auth || !auth.currentUser) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    try {
      await sendEmailVerification(auth.currentUser)
      return { success: true }
    } catch (error) {
      let errorMessage = '이메일 발송에 실패했습니다.'
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // 이메일 인증 링크 재발송 (로그인하지 않은 사용자용 - 이메일과 비밀번호 필요)
  const resendVerificationEmailForLogin = async (email, password) => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth가 초기화되지 않았습니다.' }
    }

    try {
      // 임시로 로그인하여 이메일 인증 링크 발송
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // 이미 인증된 경우
      if (firebaseUser.emailVerified) {
        await signOut(auth)
        return { success: false, error: '이미 이메일 인증이 완료된 계정입니다.' }
      }
      
      // 이메일 인증 링크 발송
      await sendEmailVerification(firebaseUser)
      
      // 로그아웃
      await signOut(auth)
      
      return { success: true }
    } catch (error) {
      let errorMessage = '이메일 발송에 실패했습니다.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // 이메일 인증 상태 확인
  const checkEmailVerificationStatus = async () => {
    if (!auth || !auth.currentUser) {
      return { verified: false }
    }

    await auth.currentUser.reload()
    return { verified: auth.currentUser.emailVerified }
  }

  // 로그인
  const login = async (email, password) => {
    if (!auth || !firestore) {
      console.error('Firebase가 초기화되지 않았습니다.')
      return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
    }

    try {
      loading.value = true
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // 사용자 정보 다시 로드 (이메일 인증 상태 최신화)
      await firebaseUser.reload()
      
      // Firestore에서 사용자 정보 확인
      const userRef = doc(firestore, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userRef)
      
      // 이메일 인증 여부 확인
      if (!firebaseUser.emailVerified) {
        await signOut(auth)
        user.value = null
        loading.value = false
        return { 
          success: false, 
          error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.' 
        }
      }
      
      // Firestore에 사용자 정보가 있는지 확인
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Firestore의 emailVerified 상태도 확인
        if (userData.emailVerified === false) {
          await signOut(auth)
          user.value = null
          loading.value = false
          return { 
            success: false, 
            error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.' 
          }
        }
      }
      
      user.value = firebaseUser
      return { success: true, user: firebaseUser }
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
    signup,
    login,
    logout,
    resendVerificationEmail,
    resendVerificationEmailForLogin,
    checkEmailVerificationStatus
  }
}

