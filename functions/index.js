const { onCall } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

// Firebase Admin 초기화
initializeApp()

const auth = getAuth()
const firestore = getFirestore()

/**
 * 이메일 인증 완료 후 Firestore 업데이트
 * 
 * 이 함수는 이메일 인증이 완료된 후 Firestore의 emailVerified 상태를 업데이트합니다.
 */
exports.updateEmailVerificationStatus = onCall({
  cors: true
}, async (request) => {
  try {
    const { email } = request.data

    if (!email) {
      return {
        success: false,
        error: '이메일이 필요합니다.'
      }
    }

    // 이메일로 사용자 찾기
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(email)
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return {
          success: false,
          error: '등록되지 않은 이메일입니다.'
        }
      }
      throw error
    }

    // Firestore에서 사용자 정보 확인 및 업데이트
    const userRef = firestore.collection('users').doc(userRecord.uid)
    const userDoc = await userRef.get()

    if (userDoc.exists) {
      // Firestore 업데이트
      await userRef.set({
        emailVerified: true,
        emailVerifiedAt: require('firebase-admin/firestore').FieldValue.serverTimestamp(),
        updatedAt: require('firebase-admin/firestore').FieldValue.serverTimestamp()
      }, { merge: true })

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email
      }
    } else {
      // Firestore에 사용자 정보가 없으면 생성
      await userRef.set({
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: true,
        emailVerifiedAt: require('firebase-admin/firestore').FieldValue.serverTimestamp(),
        createdAt: require('firebase-admin/firestore').FieldValue.serverTimestamp(),
        updatedAt: require('firebase-admin/firestore').FieldValue.serverTimestamp()
      })

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email
      }
    }
  } catch (error) {
    console.error('이메일 인증 상태 업데이트 오류:', error)
    return {
      success: false,
      error: error.message || '이메일 인증 상태 업데이트에 실패했습니다.'
    }
  }
})

/**
 * 재인증 이메일 발송 (인증 상태 초기화 후)
 * 
 * 이 함수는 재인증 이메일을 발송하기 전에 사용자의 emailVerified 상태를
 * false로 초기화하여 새로운 액션 코드를 생성할 수 있도록 합니다.
 */
exports.resendVerificationEmailWithReset = onCall({
  cors: true
}, async (request) => {
  try {
    const { email, password } = request.data

    if (!email || !password) {
      return {
        success: false,
        error: '이메일과 비밀번호가 필요합니다.'
      }
    }

    // 이메일로 사용자 찾기
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(email)
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return {
          success: false,
          error: '등록되지 않은 이메일입니다.'
        }
      }
      throw error
    }

    // 비밀번호 확인은 클라이언트에서 이미 수행되었으므로
    // 여기서는 사용자 존재 여부만 확인합니다.

    // Firestore에서 사용자 정보 확인
    const userRef = firestore.collection('users').doc(userRecord.uid)
    const userDoc = await userRef.get()

    if (userDoc.exists) {
      const userData = userDoc.data()
      // 이미 인증 완료된 상태이고, 재인증이 필요하지 않은 경우
      if (userData.emailVerified === true && userRecord.emailVerified) {
        // 3개월 재인증 체크는 클라이언트에서 처리
        // 여기서는 무조건 재인증을 허용
      }
    }

    // Firebase Auth의 emailVerified를 false로 초기화
    await auth.updateUser(userRecord.uid, {
      emailVerified: false
    })

    // Firestore의 emailVerified도 false로 업데이트
    await userRef.set({
      emailVerified: false,
      emailVerifiedAt: null,
      updatedAt: require('firebase-admin/firestore').FieldValue.serverTimestamp()
    }, { merge: true })

    // 성공 반환 (클라이언트에서 sendEmailVerification 호출 필요)
    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email
    }
  } catch (error) {
    console.error('재인증 이메일 발송 오류:', error)
    return {
      success: false,
      error: error.message || '재인증 이메일 발송에 실패했습니다.'
    }
  }
})

