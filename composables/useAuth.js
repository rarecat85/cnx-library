import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  checkActionCode
} from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  collection,
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
          
          // 이메일 인증 완료 시 Firestore 업데이트
          if (currentUser.emailVerified && firestore) {
            try {
              const userRef = doc(firestore, 'users', currentUser.uid)
              const userDoc = await getDoc(userRef)
              
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
        
        // 이메일 인증 완료 시 Firestore 업데이트
        if (firebaseUser.emailVerified && firestore) {
          try {
            const userRef = doc(firestore, 'users', firebaseUser.uid)
            const userDoc = await getDoc(userRef)
            
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

  // 회원가입
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
      
      // 이메일 인증 링크 발송
      await sendEmailVerification(firebaseUser)
      
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
    if (!auth || !firestore) {
      return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
    }

    try {
      // 임시로 로그인하여 사용자 확인
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Firestore에서 사용자 정보 확인
      const userRef = doc(firestore, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userRef)
      
      // 이미 인증된 상태인지 확인 (3개월 재인증이 필요한 경우는 제외)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Firestore의 emailVerified가 true이고 Firebase Auth도 인증된 경우
        // Functions를 통해 재인증 프로세스 시작
        if (userData.emailVerified === true && firebaseUser.emailVerified) {
          // Firebase Functions 호출하여 인증 상태 초기화
          const functions = getFunctions($firebaseApp)
          const resendVerificationEmailWithReset = httpsCallable(functions, 'resendVerificationEmailWithReset')
          
          try {
            const result = await resendVerificationEmailWithReset({ email, password })
            if (result.data.success) {
              // 인증 상태가 초기화되었으므로 다시 로그인하여 최신 상태 가져오기
              await signOut(auth)
              const newUserCredential = await signInWithEmailAndPassword(auth, email, password)
              const newFirebaseUser = newUserCredential.user
              
              // 새로운 인증 이메일 발송
              await sendEmailVerification(newFirebaseUser)
              
              await signOut(auth)
              return { success: true }
            } else {
              await signOut(auth)
              return { success: false, error: result.data.error || '재인증 이메일 발송에 실패했습니다.' }
            }
          } catch (functionsError) {
            await signOut(auth)
            console.error('Functions 호출 오류:', functionsError)
            return { success: false, error: '재인증 이메일 발송에 실패했습니다.' }
          }
        }
      } else {
        // Firestore에 사용자 정보가 없고 Firebase Auth에서 이미 인증된 경우
        if (firebaseUser.emailVerified) {
          // Functions를 통해 재인증 프로세스 시작
          const functions = getFunctions($firebaseApp)
          const resendVerificationEmailWithReset = httpsCallable(functions, 'resendVerificationEmailWithReset')
          
          try {
            const result = await resendVerificationEmailWithReset({ email, password })
            if (result.data.success) {
              await signOut(auth)
              const newUserCredential = await signInWithEmailAndPassword(auth, email, password)
              const newFirebaseUser = newUserCredential.user
              
              await sendEmailVerification(newFirebaseUser)
              
              await signOut(auth)
              return { success: true }
            } else {
              await signOut(auth)
              return { success: false, error: result.data.error || '재인증 이메일 발송에 실패했습니다.' }
            }
          } catch (functionsError) {
            await signOut(auth)
            console.error('Functions 호출 오류:', functionsError)
            return { success: false, error: '재인증 이메일 발송에 실패했습니다.' }
          }
        }
      }
      
      // 아직 인증되지 않은 상태이면 일반적인 인증 이메일 발송
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

  // 로그인
  const login = async (email, password, rememberMe = false) => {
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
      
      // Firebase Auth의 이메일 인증 여부 확인
      if (!firebaseUser.emailVerified) {
        await signOut(auth)
        user.value = null
        loading.value = false
        return { 
          success: false, 
          error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.' 
        }
      }
      
      // Firestore에서 사용자 정보 확인
      const userRef = doc(firestore, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userRef)
      
      // Firestore에 사용자 정보가 없는 경우 (미리 생성된 계정)
      if (!userDoc.exists()) {
        // Firebase Auth에서 이미 인증된 경우, Firestore에 기본 사용자 정보 생성
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: true,
          emailVerifiedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        user.value = firebaseUser
        return { success: true, user: firebaseUser }
      }
      
      const userData = userDoc.data()
      
      // Firestore의 emailVerified 상태 확인 (false이거나 undefined이면 무조건 차단)
      if (userData.emailVerified === false || userData.emailVerified === undefined) {
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
            error: '이메일 재인증이 필요합니다. 마지막 인증으로부터 3개월이 지났습니다. 재인증 이메일을 발송해주세요.',
            requiresReauth: true
          }
        }
      }
      
      // 자동로그인 정보 저장
      saveAutoLoginInfo(email, rememberMe)
      
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
      clearAutoLoginInfo()
      await router.push('/login')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 비밀번호 재설정 이메일 발송
  const sendPasswordResetEmailToUser = async (email) => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth가 초기화되지 않았습니다.' }
    }

    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      let errorMessage = '이메일 발송에 실패했습니다.'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '이메일 형식이 올바르지 않습니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // 비밀번호 재설정 확인 및 적용
  const confirmPasswordReset = async (oobCode, newPassword) => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth가 초기화되지 않았습니다.' }
    }

    try {
      // 재설정 코드 유효성 확인
      await checkActionCode(auth, oobCode)
      
      // 비밀번호 재설정
      await firebaseConfirmPasswordReset(auth, oobCode, newPassword)
      
      return { success: true }
    } catch (error) {
      let errorMessage = '비밀번호 재설정에 실패했습니다.'
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = '비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요.'
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = '유효하지 않은 재설정 링크입니다.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = '비활성화된 계정입니다.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.'
      }
      
      return { success: false, error: errorMessage }
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
    checkEmailVerificationStatus,
    sendPasswordResetEmail: sendPasswordResetEmailToUser,
    confirmPasswordReset,
    getAutoLoginInfo,
    clearAutoLoginInfo
  }
}

