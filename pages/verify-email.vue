<template>
  <v-container
    fluid
    class="fill-height"
  >
    <v-row
      align="center"
      justify="center"
      class="fill-height"
    >
      <v-col
        cols="12"
        sm="8"
        lg="4"
      >
        <v-card class="verify-card">
          <div class="text-center mb-8">
            <h1 class="verify-title mb-2">
              CNX Library
            </h1>
            <p class="verify-subtitle">
              이메일 인증
            </p>
          </div>

          <div
            v-if="verifying"
            class="text-center"
          >
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
              class="mb-4"
            />
            <p class="verifying-text">
              이메일 인증을 처리하는 중입니다...
            </p>
          </div>

          <div
            v-else-if="success"
            class="text-center"
          >
            <v-icon
              color="success"
              size="64"
              class="mb-4"
            >
              mdi-check-circle
            </v-icon>
            <h2 class="success-title mb-4">
              이메일 인증이 완료되었습니다!
            </h2>
            <p class="success-text mb-6">
              이제 로그인하여 CNX Library를 이용하실 수 있습니다.
            </p>
            <v-btn
              color="primary"
              size="large"
              block
              class="login-btn"
              elevation="2"
              @click="goToLogin"
            >
              로그인하기
            </v-btn>
          </div>

          <div
            v-else-if="error"
            class="text-center"
          >
            <v-icon
              color="error"
              size="64"
              class="mb-4"
            >
              mdi-alert-circle
            </v-icon>
            <h2 class="error-title mb-4">
              인증에 실패했습니다
            </h2>
            <p class="error-text mb-6">
              {{ errorMessage }}
            </p>
            <v-btn
              color="primary"
              size="large"
              block
              class="login-btn"
              elevation="2"
              @click="goToLogin"
            >
              로그인 페이지로 이동
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: []
})

const { $firebaseAuth, $firebaseFirestore, $firebaseApp } = useNuxtApp()
const router = useRouter()
const route = useRoute()

const verifying = ref(true)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

// URL 파라미터에서 mode와 oobCode 추출
const mode = route.query.mode
const oobCode = route.query.oobCode

onMounted(async () => {
  if (!mode || !oobCode) {
    error.value = true
    errorMessage.value = '잘못된 인증 링크입니다.'
    verifying.value = false
    return
  }

  // 비밀번호 재설정 모드인 경우 reset-password 페이지로 리다이렉트
  if (mode === 'resetPassword') {
    await router.push({
      path: '/reset-password',
      query: {
        mode: mode,
        oobCode: oobCode
      }
    })
    return
  }

  // 이메일 인증 모드만 처리
  if (mode !== 'verifyEmail') {
    error.value = true
    errorMessage.value = '지원하지 않는 인증 모드입니다.'
    verifying.value = false
    return
  }

  try {
    const { applyActionCode, checkActionCode } = await import('firebase/auth')
    const { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')
    
    const auth = $firebaseAuth
    const firestore = $firebaseFirestore

    if (!auth || !firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    // 인증 코드 유효성 확인
    let email = null
    let actionCodeInfo = null
    try {
      actionCodeInfo = await checkActionCode(auth, oobCode)
      email = actionCodeInfo.data.email
      console.log('actionCodeInfo:', actionCodeInfo)
      console.log('이메일 추출:', email)
      
      // actionCodeInfo에서 이메일을 얻지 못한 경우 다시 시도
      if (!email && actionCodeInfo.data) {
        email = actionCodeInfo.data.email
        console.log('actionCodeInfo.data에서 이메일 재확인:', email)
      }
    } catch (checkError) {
      // checkActionCode가 auth/invalid-action-code로 실패한 경우
      // 이미 사용된 코드이거나 이미 인증된 상태일 수 있음
      if (checkError.code === 'auth/invalid-action-code') {
        console.log('checkActionCode가 invalid-action-code로 실패, applyActionCode 시도')
        // 이메일을 얻을 수 없지만 applyActionCode를 시도해볼 수 있음
        // applyActionCode도 실패하면 이미 인증된 상태로 간주
      } else {
        // 다른 에러는 throw
        throw checkError
      }
    }

    // Firestore에서 이메일로 사용자 문서 찾기 (이메일이 있는 경우에만)
    let userRef = null
    let userData = null
    if (email) {
      try {
        const usersRef = collection(firestore, 'users')
        const q = query(usersRef, where('email', '==', email))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          userRef = doc(firestore, 'users', userDoc.id)
          userData = userDoc.data()
          console.log('Firestore 사용자 데이터:', userData)
          console.log('emailVerified 값:', userData?.emailVerified, '타입:', typeof userData?.emailVerified)
        } else {
          console.warn('Firestore에서 사용자를 찾을 수 없습니다:', email)
        }
      } catch (firestoreQueryError) {
        console.error('Firestore 쿼리 오류:', firestoreQueryError)
      }
    }

    // 인증 코드 적용 (Firebase Auth의 emailVerified 상태 업데이트)
    try {
      await applyActionCode(auth, oobCode)
      
      // applyActionCode 성공 후 Firebase Auth에서 현재 사용자 정보 확인
      // applyActionCode가 성공하면 해당 사용자가 로그인된 상태가 됨
      const { getAuth } = await import('firebase/auth')
      const currentAuth = getAuth()
      const currentUser = currentAuth.currentUser
      
      // userRef가 없으면 여러 방법으로 찾기 시도
      if (!userRef) {
        // 1. 현재 로그인된 사용자의 UID로 찾기
        if (currentUser && currentUser.uid) {
          try {
            userRef = doc(firestore, 'users', currentUser.uid)
            const userDoc = await getDoc(userRef)
            if (userDoc.exists()) {
              userData = userDoc.data()
              email = email || currentUser.email || userData.email
              console.log('현재 사용자 UID로 찾은 사용자:', userData)
            } else {
              userRef = null
            }
          } catch (uidError) {
            console.error('UID로 사용자 찾기 오류:', uidError)
            userRef = null
          }
        }
        
        // 2. 이메일로 찾기
        if (!userRef && email) {
          try {
            const usersRef = collection(firestore, 'users')
            const q = query(usersRef, where('email', '==', email))
            const querySnapshot = await getDocs(q)
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              userRef = doc(firestore, 'users', userDoc.id)
              userData = userDoc.data()
              console.log('이메일로 찾은 사용자:', userData)
            }
          } catch (retryError) {
            console.error('재시도 Firestore 쿼리 오류:', retryError)
          }
        }
        
        // 3. actionCodeInfo에서 이메일 다시 확인
        if (!userRef && !email && actionCodeInfo && actionCodeInfo.data && actionCodeInfo.data.email) {
          email = actionCodeInfo.data.email
          try {
            const usersRef = collection(firestore, 'users')
            const q = query(usersRef, where('email', '==', email))
            const querySnapshot = await getDocs(q)
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              userRef = doc(firestore, 'users', userDoc.id)
              userData = userDoc.data()
              console.log('actionCodeInfo에서 이메일로 찾은 사용자:', userData)
            }
          } catch (retryError) {
            console.error('actionCodeInfo 이메일로 Firestore 쿼리 오류:', retryError)
          }
        }
        
        // 4. 현재 사용자의 이메일로 찾기
        if (!userRef && currentUser && currentUser.email) {
          email = email || currentUser.email
          try {
            const usersRef = collection(firestore, 'users')
            const q = query(usersRef, where('email', '==', email))
            const querySnapshot = await getDocs(q)
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              userRef = doc(firestore, 'users', userDoc.id)
              userData = userDoc.data()
              console.log('현재 사용자 이메일로 찾은 사용자:', userData)
            }
          } catch (retryError) {
            console.error('현재 사용자 이메일로 Firestore 쿼리 오류:', retryError)
          }
        }
      }
      
      // userRef를 찾았으면 Firestore 업데이트
      if (userRef) {
        try {
          await setDoc(userRef, {
            emailVerified: true,
            emailVerifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true })
          console.log('Firestore 업데이트 완료. email:', email, 'uid:', currentUser?.uid)
        } catch (firestoreError) {
          console.error('Firestore 업데이트 오류:', firestoreError)
          // 권한 오류인 경우 Functions를 통해 업데이트 시도
          if (firestoreError.code === 'permission-denied' && email) {
            console.log('권한 오류로 Functions를 통해 업데이트 시도:', email)
            try {
              const { getFunctions, httpsCallable } = await import('firebase/functions')
              const functions = getFunctions($firebaseApp)
              const updateEmailVerificationStatus = httpsCallable(functions, 'updateEmailVerificationStatus')
              const result = await updateEmailVerificationStatus({ email })
              
              if (result.data.success) {
                console.log('Functions를 통해 Firestore 업데이트 완료:', email)
              } else {
                console.error('Functions 업데이트 실패:', result.data.error)
              }
            } catch (functionsError) {
              console.error('Functions 호출 오류:', functionsError)
            }
          }
        }
      } else if (email) {
        // userRef를 찾지 못했지만 이메일은 있는 경우
        // Functions를 통해 업데이트 시도
        console.log('userRef를 찾지 못했지만 이메일이 있으므로 Functions를 통해 업데이트 시도:', email)
        try {
          const { getFunctions, httpsCallable } = await import('firebase/functions')
          const functions = getFunctions($firebaseApp)
          const updateEmailVerificationStatus = httpsCallable(functions, 'updateEmailVerificationStatus')
          const result = await updateEmailVerificationStatus({ email })
          
          if (result.data.success) {
            console.log('Functions를 통해 Firestore 업데이트 완료:', email)
          } else {
            console.error('Functions 업데이트 실패:', result.data.error)
            error.value = true
            errorMessage.value = result.data.error || '이메일 인증 상태 업데이트에 실패했습니다.'
            verifying.value = false
            return
          }
        } catch (functionsError) {
          console.error('Functions 호출 오류:', functionsError)
          error.value = true
          errorMessage.value = '이메일 인증 상태 업데이트에 실패했습니다. 관리자에게 문의해주세요.'
          verifying.value = false
          return
        }
      } else {
        // userRef도 없고 이메일도 없는 경우
        console.error('userRef와 이메일을 모두 찾을 수 없어서 Firestore 업데이트를 할 수 없습니다.')
        console.error('currentUser:', currentUser)
        console.error('actionCodeInfo:', actionCodeInfo)
        
        // 에러 메시지 표시
        error.value = true
        errorMessage.value = '인증은 완료되었지만 사용자 정보를 찾을 수 없어 업데이트에 실패했습니다. 관리자에게 문의해주세요.'
        verifying.value = false
        return
      }
      
      success.value = true
      verifying.value = false
    } catch (applyError) {
      console.log('applyActionCode 에러:', applyError.code, applyError.message)
      console.log('userData.emailVerified:', userData?.emailVerified)
      
      // applyActionCode 실패 처리
      if (applyError.code === 'auth/invalid-action-code') {
        // 이미 사용된 코드이거나 이미 인증된 상태일 수 있음
        
        // 이메일이 없고 userRef도 없으면 현재 로그인된 사용자 확인 시도
        if (!email && !userRef) {
          console.log('이메일과 userRef를 모두 찾을 수 없어서 현재 로그인된 사용자 확인 시도')
          
          // auth.currentUser 확인 시도
          try {
            const currentAuthUser = auth.currentUser
            if (currentAuthUser && currentAuthUser.email) {
              console.log('auth.currentUser 발견:', currentAuthUser.email)
              email = currentAuthUser.email
              
              // 이메일로 Firestore에서 사용자 찾기
              try {
                const usersRef = collection(firestore, 'users')
                const q = query(usersRef, where('email', '==', email))
                const querySnapshot = await getDocs(q)
                
                if (!querySnapshot.empty) {
                  const userDoc = querySnapshot.docs[0]
                  userRef = doc(firestore, 'users', userDoc.id)
                  userData = userDoc.data()
                  console.log('auth.currentUser로 찾은 Firestore 데이터:', userData)
                } else {
                  // Firestore에 사용자 정보가 없으면 UID로 생성
                  userRef = doc(firestore, 'users', currentAuthUser.uid)
                  userData = null
                  console.log('Firestore에 사용자 정보가 없어서 UID로 생성:', currentAuthUser.uid)
                }
              } catch (firestoreError) {
                console.error('Firestore 쿼리 오류:', firestoreError)
              }
            }
          } catch (currentUserError) {
            console.error('현재 사용자 확인 오류:', currentUserError)
          }
        }
        
        // 여전히 이메일이 없고 userRef도 없으면 모든 사용자를 검색할 수 없으므로
        // 이미 인증된 상태로 간주하고 성공 처리
        if (!email && !userRef) {
          console.warn('이메일과 userRef를 모두 찾을 수 없지만, 이미 인증된 상태로 간주')
          success.value = true
          verifying.value = false
          return
        }
        
        // userRef가 없으면 이메일로 다시 찾기 시도
        if (!userRef && email) {
          console.log('userRef가 없어서 다시 찾기 시도:', email)
          try {
            const usersRef = collection(firestore, 'users')
            const q = query(usersRef, where('email', '==', email))
            const querySnapshot = await getDocs(q)
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              userRef = doc(firestore, 'users', userDoc.id)
              userData = userDoc.data()
              console.log('재시도로 찾은 사용자 데이터:', userData)
            }
          } catch (retryError) {
            console.error('재시도 Firestore 쿼리 오류:', retryError)
          }
        }
        
        // Firestore의 emailVerified 상태 확인
        // emailVerified가 명시적으로 true인 경우에만 "이미 인증 완료" 메시지 표시
        const isEmailVerified = userData && userData.emailVerified === true
        console.log('isEmailVerified:', isEmailVerified, 'userData.emailVerified:', userData?.emailVerified)
        
        if (isEmailVerified) {
          // 이미 인증 완료된 상태
          error.value = true
          errorMessage.value = '이미 이메일 인증이 완료된 계정입니다.'
          verifying.value = false
        } else if (userRef) {
          // Firestore는 false이거나 undefined이지만 applyActionCode가 실패
          // 이미 Firebase Auth에서는 인증된 상태일 가능성이 높음
          // Firestore를 업데이트하고 성공 처리
          console.log('Firestore 업데이트 시도 중... userRef:', userRef)
          try {
            await setDoc(userRef, {
              emailVerified: true,
              emailVerifiedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true })
            console.log('Firestore 업데이트 완료 (invalid-action-code):', email)
            
            success.value = true
            verifying.value = false
          } catch (firestoreError) {
            console.error('Firestore 업데이트 오류:', firestoreError)
            throw new Error('Firestore 업데이트에 실패했습니다.')
          }
        } else {
          // userRef를 찾을 수 없는 경우 - 이미 인증된 상태로 간주하고 성공 처리
          console.warn('Firestore에서 사용자를 찾을 수 없지만, 이미 인증된 상태로 간주:', email)
          success.value = true
          verifying.value = false
        }
      } else if (applyError.code === 'auth/expired-action-code') {
        // 만료된 코드
        throw applyError
      } else {
        // 다른 에러는 throw
        throw applyError
      }
    }
  } catch (err) {
    console.error('이메일 인증 오류:', err)
    error.value = true
    verifying.value = false

    if (err.code === 'auth/expired-action-code') {
      errorMessage.value = '인증 링크가 만료되었습니다. 새로운 인증 링크를 요청해주세요.'
    } else if (err.code === 'auth/invalid-action-code') {
      errorMessage.value = '이미 인증된 이메일이거나 유효하지 않은 인증 링크입니다.'
    } else if (err.code === 'auth/user-disabled') {
      errorMessage.value = '비활성화된 계정입니다.'
    } else if (err.code === 'auth/user-not-found') {
      errorMessage.value = '사용자를 찾을 수 없습니다.'
    } else {
      errorMessage.value = err.message || '이메일 인증에 실패했습니다.'
    }
  }
})

const goToLogin = () => {
  router.push('/login')
}

// 페이지 메타데이터
useHead({
  title: '이메일 인증 - CNX Library'
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #F2F2F2 0%, #E8E8E8 100%);
}

.verify-card {
  padding: 48px 40px;
  max-width: 440px;
  margin: 0 auto;
}

.verify-title {
  font-size: 32px;
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.verify-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

.verifying-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #002C5B;
  margin: 0;
}

.success-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #CC3256;
  margin: 0;
}

.error-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}
</style>

