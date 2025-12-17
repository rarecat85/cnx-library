import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'

export const useAuth = () => {
  const { $firebaseAuth, $firebaseFirestore, $firebaseApp } = useNuxtApp()
  const router = useRouter()
  const auth = $firebaseAuth
  const firestore = $firebaseFirestore

  const user = useState('firebase_user', () => null)
  const loading = useState('auth_loading', () => true)
  const authInitialized = useState('auth_initialized', () => false)

  // 클라이언트 사이드에서만 Firebase Auth 초기화
  if (process.client && auth) {
    // 즉시 현재 사용자 확인 (persistence가 복원되었을 수 있음)
    const checkInitialUser = async () => {
      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          // 사용자 정보 다시 로드하여 최신 상태 확인
          await currentUser.reload()
          user.value = currentUser
          loading.value = false
        }
      } catch (error) {
        console.error('초기 사용자 확인 실패:', error)
      }
    }
    
    // 초기 사용자 확인 실행
    checkInitialUser()
    
    // onAuthStateChanged의 첫 번째 콜백이 실행될 때까지 기다리는 Promise
    let authStateReadyResolver = null
    const authStateReady = new Promise((resolve) => {
      authStateReadyResolver = resolve
    })
    
    // 인증 상태 변경 감지 (첫 번째 콜백이 실행되면 resolve)
    let firstCallback = true
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 사용자가 로그인된 경우
        user.value = firebaseUser
        loading.value = false
      } else {
        // 사용자가 로그인되지 않은 경우
        user.value = null
        loading.value = false
      }
      
      // 첫 번째 콜백만 resolve
      if (firstCallback && authStateReadyResolver) {
        firstCallback = false
        authInitialized.value = true
        authStateReadyResolver()
        authStateReadyResolver = null
      }
    })
    
    // authStateReady를 전역 상태로 저장하여 다른 곳에서 사용 가능하도록
    useState('auth_state_ready', () => authStateReady)
  } else {
    // 서버 사이드이거나 auth가 없으면 로딩 완료
    if (process.server || !auth) {
      loading.value = false
      authInitialized.value = true
    }
  }

  // 회원가입 (자체 인증 시스템 사용)
  const signup = async (email, password, name, workplace) => {
    if (!auth || !firestore) {
      console.error('Firebase가 초기화되지 않았습니다.')
      return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
    }

    try {
      loading.value = true
      
      // Firebase Auth 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Firestore에 사용자 정보 저장
      const userRef = doc(firestore, 'users', firebaseUser.uid)
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: email,
        name: name,
        workplace: workplace,
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Firebase Functions를 통해 인증 메일 발송
      const functions = getFunctions($firebaseApp)
      const sendSignupVerificationEmail = httpsCallable(functions, 'sendSignupVerificationEmail')
      
      try {
        const result = await sendSignupVerificationEmail({
          uid: firebaseUser.uid,
          email: email,
          name: name
        })
        
        if (!result.data.success) {
          console.error('인증 메일 발송 실패:', result.data.error)
          // 인증 메일 발송 실패해도 회원가입은 성공 처리 (나중에 재발송 가능)
        }
      } catch (emailError) {
        console.error('인증 메일 발송 오류:', emailError)
        // 인증 메일 발송 실패해도 회원가입은 성공 처리
      }
      
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

  // 이메일 인증 링크 재발송 (로그인하지 않은 사용자용 - 자체 인증 시스템)
  const resendVerificationEmailForLogin = async (email, password, isReauth = false) => {
    if (!auth || !firestore) {
      return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
    }

    try {
      // 임시로 로그인하여 사용자 확인 (비밀번호 검증)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // 즉시 로그아웃 (인증되지 않은 상태로 유지)
      await signOut(auth)
      
      // Firebase Functions를 통해 인증 메일 발송
      const functions = getFunctions($firebaseApp)
      const resendVerificationEmail = httpsCallable(functions, 'resendVerificationEmail')
      
      const result = await resendVerificationEmail({
        email: email,
        password: password,
        isReauth: isReauth
      })
      
      if (result.data.success) {
        return { success: true, message: result.data.message }
      } else {
        return { success: false, error: result.data.error || '인증 이메일 발송에 실패했습니다.' }
      }
    } catch (error) {
      let errorMessage = '이메일 발송에 실패했습니다.'
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 있습니다. 잠시 후 다시 시도해주세요.'
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

  // 간단한 Base64 인코딩/디코딩 (보안 강화를 위한 기본 인코딩)
  const encodeEmail = (email) => {
    if (!process.client) return email
    try {
      return btoa(encodeURIComponent(email))
    } catch {
      return email
    }
  }

  const decodeEmail = (encodedEmail) => {
    if (!process.client) return encodedEmail
    try {
      return decodeURIComponent(atob(encodedEmail))
    } catch {
      return encodedEmail
    }
  }

  // 자동로그인 정보 저장 (이메일은 Base64 인코딩하여 저장)
  const saveAutoLoginInfo = (email, rememberMe) => {
    if (!process.client) return
    
    if (rememberMe) {
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 1) // 30일 후
      
      // 이메일을 Base64 인코딩하여 저장 (보안 강화)
      const encodedEmail = encodeEmail(email)
      localStorage.setItem('autoLoginEmail', encodedEmail)
      localStorage.setItem('autoLoginExpiry', expiryDate.toISOString())
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('autoLoginEmail')
      localStorage.removeItem('autoLoginExpiry')
      localStorage.removeItem('rememberMe')
    }
  }

  // 자동로그인 정보 조회 (이메일은 디코딩하여 반환)
  const getAutoLoginInfo = () => {
    if (!process.client) return null
    
    const encodedEmail = localStorage.getItem('autoLoginEmail')
    const expiry = localStorage.getItem('autoLoginExpiry')
    
    if (!encodedEmail || !expiry) return null
    
    const expiryDate = new Date(expiry)
    const now = new Date()
    
    // 만료일이 지났으면 제거
    if (now > expiryDate) {
      localStorage.removeItem('autoLoginEmail')
      localStorage.removeItem('autoLoginExpiry')
      localStorage.removeItem('rememberMe')
      return null
    }
    
    // 이메일 디코딩하여 반환
    const email = decodeEmail(encodedEmail)
    return { email, expiry: expiryDate }
  }

  // 자동로그인 정보 제거
  const clearAutoLoginInfo = () => {
    if (!process.client) return
    
    localStorage.removeItem('autoLoginEmail')
    localStorage.removeItem('autoLoginExpiry')
    localStorage.removeItem('rememberMe')
  }

  // 로그인 (Firestore 기반 인증 상태 확인)
  const login = async (email, password, rememberMe = false) => {
    if (!auth || !firestore) {
      console.error('Firebase가 초기화되지 않았습니다.')
      return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
    }

    try {
      loading.value = true
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Firestore에서 사용자 정보 확인
      const userRef = doc(firestore, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userRef)
      
      // Firestore에 사용자 정보가 없는 경우
      if (!userDoc.exists()) {
        await signOut(auth)
        user.value = null
        loading.value = false
        return { 
          success: false, 
          error: '사용자 정보를 찾을 수 없습니다. 회원가입을 다시 진행해주세요.' 
        }
      }
      
      const userData = userDoc.data()
      
      // Firestore의 emailVerified 상태 확인 (false이거나 undefined이면 무조건 차단)
      if (userData.emailVerified !== true) {
        await signOut(auth)
        user.value = null
        loading.value = false
        return { 
          success: false, 
          error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.' 
        }
      }

      // 3개월 재인증 체크
      if (userData.emailVerified === true && userData.emailVerifiedAt) {
        const emailVerifiedAt = userData.emailVerifiedAt.toDate()
        const now = new Date()
        const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)) // 90일 전
        
        // 3개월이 지났는지 확인
        if (emailVerifiedAt < threeMonthsAgo) {
          // 3개월이 지났으므로 재인증 필요
          // Firestore의 emailVerified를 false로 변경
          await setDoc(userRef, {
            emailVerified: false,
            updatedAt: serverTimestamp()
          }, { merge: true })
          
          await signOut(auth)
          user.value = null
          loading.value = false
          return {
            success: false,
            error: '이메일 재인증이 필요합니다. 마지막 인증으로부터 3개월이 지났습니다.',
            requiresReauth: true
          }
        }
      }
      
      // 자동로그인 정보 저장
      saveAutoLoginInfo(email, rememberMe)
      
      user.value = firebaseUser
      loading.value = false
      return { success: true, user: firebaseUser }
    } catch (error) {
      loading.value = false
      let errorMessage = '로그인에 실패했습니다.'
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/user-not-found') {
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
      clearAutoLoginInfo()
      await router.push('/login')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 비밀번호 재설정 이메일 발송 (자체 시스템)
  const sendPasswordResetEmailToUser = async (email) => {
    try {
      // Firebase Functions를 통해 비밀번호 재설정 메일 발송
      const functions = getFunctions($firebaseApp)
      const sendPasswordResetEmailFn = httpsCallable(functions, 'sendPasswordResetEmail')
      
      const result = await sendPasswordResetEmailFn({ email })
      
      if (result.data.success) {
        return { success: true, message: result.data.message }
      } else {
        return { success: false, error: result.data.error || '이메일 발송에 실패했습니다.' }
      }
    } catch (error) {
      console.error('비밀번호 재설정 이메일 발송 오류:', error)
      return { success: false, error: '이메일 발송에 실패했습니다.' }
    }
  }

  // 비밀번호 재설정 토큰 검증 (자체 시스템)
  const verifyPasswordResetToken = async (token, uid) => {
    try {
      const functions = getFunctions($firebaseApp)
      const verifyPasswordResetTokenFn = httpsCallable(functions, 'verifyPasswordResetToken')
      
      const result = await verifyPasswordResetTokenFn({ token, uid })
      
      if (result.data.success) {
        return { success: true, email: result.data.email }
      } else {
        return { 
          success: false, 
          error: result.data.error || '유효하지 않은 토큰입니다.',
          errorType: result.data.errorType
        }
      }
    } catch (error) {
      console.error('토큰 검증 오류:', error)
      return { success: false, error: '토큰 검증에 실패했습니다.' }
    }
  }

  // 비밀번호 재설정 확인 및 적용 (자체 시스템)
  const confirmPasswordReset = async (token, uid, newPassword) => {
    try {
      const functions = getFunctions($firebaseApp)
      const verifyPasswordResetTokenFn = httpsCallable(functions, 'verifyPasswordResetToken')
      
      const result = await verifyPasswordResetTokenFn({ token, uid, newPassword })
      
      if (result.data.success) {
        return { success: true, message: result.data.message }
      } else {
        return { 
          success: false, 
          error: result.data.error || '비밀번호 재설정에 실패했습니다.',
          errorType: result.data.errorType
        }
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      return { success: false, error: '비밀번호 재설정에 실패했습니다.' }
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
    resendVerificationEmailForLogin,
    checkEmailVerificationStatus,
    sendPasswordResetEmail: sendPasswordResetEmailToUser,
    verifyPasswordResetToken,
    confirmPasswordReset,
    getAutoLoginInfo,
    clearAutoLoginInfo
  }
}
