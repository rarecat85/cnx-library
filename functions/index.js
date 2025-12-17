const { onCall } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { defineString } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const functions = require('firebase-functions')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

// 환경 변수
const aladinTtbKey = defineString('ALADIN_TTB_KEY', { default: '' })
const gmailUser = defineString('GMAIL_USER', { default: '' })
const gmailAppPassword = defineString('GMAIL_APP_PASSWORD', { default: '' })

// Firebase Admin 초기화
initializeApp()

const auth = getAuth()
const firestore = getFirestore()

// 알라딘 API 인증 정보는 aladinTtbKey를 직접 사용

// ==================== 알라딘 API 공통 헬퍼 함수 ====================

/**
 * 알라딘 API JSONP 응답 파싱
 * @param {string} responseText - API 응답 텍스트
 * @returns {Object} 파싱된 JSON 데이터
 */
const parseAladinResponse = (responseText) => {
  let cleanedText = responseText.trim()
  
  // callback 함수 호출 제거 (예: "callback({...})" -> "{...}")
  if (cleanedText.includes('(') && cleanedText.includes(')')) {
    // 함수명과 괄호 제거
    const match = cleanedText.match(/^\w+\((.+)\);?\s*$/)
    if (match) {
      cleanedText = match[1]
    } else {
      // 다른 형식 시도
      const jsonMatch = cleanedText.match(/\(({.*})\)/)
      if (jsonMatch) {
        cleanedText = jsonMatch[1]
      }
    }
  }
  
  return JSON.parse(cleanedText)
}

/**
 * 세트 상품 여부 확인
 * @param {Object} item - 도서 아이템
 * @returns {boolean} 세트 상품 여부
 */
const isSetProduct = (item) => {
  if (!item || !item.title) {
    return false
  }
  
  const title = item.title.toLowerCase()
  const setKeywords = [
    '세트',
    '전집',
    'box',
    '박스',
    '시리즈',
    '전권',
    '완전판',
    '합본',
    '모음',
    '선집',
    '문고판 세트',
    '문고세트'
  ]
  
  // 제목에 세트 관련 키워드가 포함되어 있는지 확인
  for (const keyword of setKeywords) {
    if (title.includes(keyword)) {
      return true
    }
  }
  
  // 괄호 안에 "전N권", "N권 세트" 등의 패턴 확인
  const bracketPattern = /\([^)]*(전\s*\d+권|\d+권\s*세트|전\s*\d+권\s*세트)[^)]*\)/i
  if (bracketPattern.test(item.title)) {
    return true
  }
  
  return false
}

// ==================== 인증 관련 함수 ====================

/**
 * 이메일 인증 완료 후 Firestore 업데이트
 * 
 * 이 함수는 이메일 인증이 완료된 후 Firestore의 emailVerified 상태를 업데이트합니다.
 */
exports.updateEmailVerificationStatus = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001'
  ]
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

// ==================== 자체 이메일 인증 시스템 ====================

// 인증 토큰 유효 시간 (24시간)
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24

// 재전송 제한 시간 (1분)
const RESEND_LIMIT_SECONDS = 60

// 앱 URL (환경에 따라 다름)
const APP_URL = 'https://rarecat85.github.io/cnx-library'

/**
 * 회원가입 시 인증 메일 발송
 * 
 * 새로운 토큰을 생성하고 인증 메일을 발송합니다.
 */
exports.sendSignupVerificationEmail = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001',
    'http://localhost:3000'
  ]
}, async (request) => {
  try {
    const { uid, email, name } = request.data

    if (!uid || !email) {
      return {
        success: false,
        error: 'uid와 email이 필요합니다.'
      }
    }

    // 새 토큰 생성
    const token = generateVerificationToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Firestore에 토큰 저장
    const userRef = firestore.collection('users').doc(uid)
    await userRef.set({
      verificationToken: token,
      verificationTokenCreatedAt: FieldValue.serverTimestamp(),
      verificationTokenExpiresAt: expiresAt,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    // 인증 URL 생성
    const verificationUrl = `${APP_URL}/verify-email?token=${token}&uid=${uid}`

    // 인증 메일 발송
    const sent = await sendVerificationEmail(email, 'signup', verificationUrl, name, VERIFICATION_TOKEN_EXPIRY_HOURS)

    if (!sent) {
      return {
        success: false,
        error: '인증 이메일 발송에 실패했습니다.'
      }
    }

    return {
      success: true,
      message: '인증 이메일이 발송되었습니다.'
    }
  } catch (error) {
    console.error('회원가입 인증 메일 발송 오류:', error)
    return {
      success: false,
      error: error.message || '인증 이메일 발송에 실패했습니다.'
    }
  }
})

/**
 * 인증 메일 재발송 (로그인하지 않은 사용자용)
 * 
 * 이메일과 비밀번호를 확인한 후 새로운 토큰으로 인증 메일을 재발송합니다.
 * 이전 토큰은 자동으로 무효화됩니다.
 */
exports.resendVerificationEmail = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001',
    'http://localhost:3000'
  ]
}, async (request) => {
  try {
    const { email, password, isReauth } = request.data

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

    // Firestore에서 사용자 정보 확인
    const userRef = firestore.collection('users').doc(userRecord.uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return {
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      }
    }

    const userData = userDoc.data()

    // 재전송 제한 확인 (1분 이내 재요청 방지)
    if (userData.verificationTokenCreatedAt) {
      const lastSent = userData.verificationTokenCreatedAt.toDate()
      const now = new Date()
      const diffSeconds = Math.floor((now - lastSent) / 1000)
      
      if (diffSeconds < RESEND_LIMIT_SECONDS) {
        const remainingSeconds = RESEND_LIMIT_SECONDS - diffSeconds
        return {
          success: false,
          error: `잠시 후 다시 시도해주세요. (${remainingSeconds}초 후)`
        }
      }
    }

    // 새 토큰 생성 (이전 토큰 자동 무효화)
    const token = generateVerificationToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // 재인증인 경우 emailVerified를 false로 초기화
    const updateData = {
      verificationToken: token,
      verificationTokenCreatedAt: FieldValue.serverTimestamp(),
      verificationTokenExpiresAt: expiresAt,
      updatedAt: FieldValue.serverTimestamp()
    }

    if (isReauth) {
      updateData.emailVerified = false
      updateData.emailVerifiedAt = null
      
      // Firebase Auth의 emailVerified도 false로 초기화
      await auth.updateUser(userRecord.uid, {
        emailVerified: false
      })
    }

    await userRef.set(updateData, { merge: true })

    // 인증 URL 생성
    const verificationUrl = `${APP_URL}/verify-email?token=${token}&uid=${userRecord.uid}`

    // 인증 메일 발송
    const mailType = isReauth ? 'reauth' : 'signup'
    const sent = await sendVerificationEmail(email, mailType, verificationUrl, userData.name, VERIFICATION_TOKEN_EXPIRY_HOURS)

    if (!sent) {
      return {
        success: false,
        error: '인증 이메일 발송에 실패했습니다.'
      }
    }

    return {
      success: true,
      message: '인증 이메일이 재발송되었습니다.'
    }
  } catch (error) {
    console.error('인증 메일 재발송 오류:', error)
    return {
      success: false,
      error: error.message || '인증 이메일 발송에 실패했습니다.'
    }
  }
})

/**
 * 인증 토큰 검증 및 이메일 인증 완료
 * 
 * 토큰의 유효성을 확인하고 인증을 완료 처리합니다.
 */
exports.verifyEmailToken = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001',
    'http://localhost:3000'
  ]
}, async (request) => {
  try {
    const { token, uid } = request.data

    if (!token || !uid) {
      return {
        success: false,
        error: '토큰과 uid가 필요합니다.'
      }
    }

    // Firestore에서 사용자 정보 확인
    const userRef = firestore.collection('users').doc(uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return {
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      }
    }

    const userData = userDoc.data()

    // 이미 인증된 사용자인 경우
    if (userData.emailVerified === true) {
      return {
        success: true,
        message: '이미 이메일 인증이 완료된 계정입니다.',
        email: userData.email,
        alreadyVerified: true
      }
    }

    // 토큰이 없는 경우 (회원가입 시 토큰 저장 실패 등)
    if (!userData.verificationToken) {
      return {
        success: false,
        error: '인증 토큰이 없습니다. 로그인 페이지에서 인증 이메일 재전송을 요청해주세요.',
        errorType: 'no_token'
      }
    }

    // 토큰 일치 확인
    if (userData.verificationToken !== token) {
      // 이전 토큰인 경우 (새 토큰이 발급됨)
      return {
        success: false,
        error: '이미 만료된 인증 링크입니다. 새로 발송된 링크를 통해 인증을 진행해주세요.',
        errorType: 'invalid_token'
      }
    }

    // 만료 시간 확인
    if (userData.verificationTokenExpiresAt) {
      const expiresAt = userData.verificationTokenExpiresAt.toDate()
      const now = new Date()
      
      if (now > expiresAt) {
        return {
          success: false,
          error: '이미 만료된 인증 링크입니다. 새로 발송된 링크를 통해 인증을 진행해주세요.',
          errorType: 'expired_token'
        }
      }
    }

    // 인증 완료 처리
    await userRef.set({
      emailVerified: true,
      emailVerifiedAt: FieldValue.serverTimestamp(),
      verificationToken: null, // 토큰 삭제
      verificationTokenCreatedAt: null,
      verificationTokenExpiresAt: null,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    // Firebase Auth의 emailVerified도 업데이트 시도 (실패해도 무시)
    try {
      await auth.updateUser(uid, { emailVerified: true })
    } catch (authError) {
      console.log('Firebase Auth emailVerified 업데이트 실패 (무시됨):', authError.message)
      // Firestore 업데이트가 성공했으므로 계속 진행
    }

    return {
      success: true,
      message: '이메일 인증이 완료되었습니다.',
      email: userData.email
    }
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return {
      success: false,
      error: error.message || '인증 처리에 실패했습니다.'
    }
  }
})

// ==================== 비밀번호 재설정 시스템 ====================

// 비밀번호 재설정 토큰 유효 시간 (1시간)
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1

/**
 * 비밀번호 재설정 메일 템플릿 생성
 * @param {string} resetUrl - 비밀번호 재설정 링크 URL
 * @param {string} userName - 사용자 이름
 * @param {number} expiresInHours - 만료 시간 (시간)
 * @returns {string} HTML 이메일 템플릿
 */
const createPasswordResetEmailTemplate = (resetUrl, userName, expiresInHours = 1) => {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F2F2F2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F2F2F2;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- 헤더 -->
          <tr>
            <td style="background-color: #002C5B; padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                      CNX Library
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- 본문 -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 40px;">
              <!-- 배지 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #dc262615; border-radius: 8px; padding: 8px 16px;">
                    <span style="font-size: 14px; font-weight: 600; color: #dc2626;">
                      🔐 비밀번호 재설정
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- 인사말 -->
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #002C5B; line-height: 1.4;">
                ${userName ? `${userName}님, ` : ''}비밀번호 재설정 안내
              </h2>
              
              <!-- 설명 -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
                비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
              </p>
              
              <!-- 재설정 버튼 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius: 8px; background-color: #002C5B;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                            비밀번호 재설정하기
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- 안내 메시지 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #fef2f2; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #dc2626; font-weight: 500;">⏱️ 링크 유효 시간</p>
                    <p style="margin: 0; font-size: 14px; color: #002C5B; font-weight: 600;">${expiresInHours}시간</p>
                  </td>
                </tr>
              </table>
              
              <!-- 경고 메시지 -->
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #dc2626; line-height: 1.6;">
                ⚠️ 본인이 요청하지 않은 경우, 이 메일을 무시하시고 계정 보안을 확인해주세요.
              </p>
              
              <!-- 버튼이 작동하지 않는 경우 -->
              <p style="margin: 32px 0 8px 0; font-size: 13px; color: #9ca3af;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          
          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af; text-align: center;">
                이 메일은 CNX Library에서 자동 발송되었습니다.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                © CNX Library
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * 비밀번호 재설정 이메일 발송
 * @param {string} to - 수신자 이메일
 * @param {string} resetUrl - 비밀번호 재설정 링크 URL
 * @param {string} userName - 사용자 이름
 * @param {number} expiresInHours - 만료 시간 (시간)
 * @returns {boolean} 발송 성공 여부
 */
const sendPasswordResetEmailToUser = async (to, resetUrl, userName, expiresInHours = 1) => {
  const transporter = createMailTransporter()
  
  if (!transporter) {
    console.log('이메일 발송 스킵: 트랜스포터 없음')
    return false
  }
  
  try {
    const html = createPasswordResetEmailTemplate(resetUrl, userName, expiresInHours)
    
    await transporter.sendMail({
      from: `"CNX Library" <${gmailUser.value()}>`,
      to,
      subject: '[CNX Library] 비밀번호 재설정 안내',
      html
    })
    
    console.log(`비밀번호 재설정 이메일 발송 완료: ${to}`)
    return true
  } catch (error) {
    console.error('비밀번호 재설정 이메일 발송 오류:', error)
    return false
  }
}

/**
 * 비밀번호 재설정 메일 발송 (자체 시스템)
 * 
 * 새로운 토큰을 생성하고 비밀번호 재설정 메일을 발송합니다.
 */
exports.sendPasswordResetEmail = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001',
    'http://localhost:3000'
  ]
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
        // 보안을 위해 등록되지 않은 이메일도 성공으로 응답
        return {
          success: true,
          message: '비밀번호 재설정 이메일이 발송되었습니다.'
        }
      }
      throw error
    }

    // Firestore에서 사용자 정보 확인
    const userRef = firestore.collection('users').doc(userRecord.uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      // Firestore에 사용자 정보가 없어도 발송 시도
      console.warn('Firestore에 사용자 정보 없음:', email)
    }

    const userData = userDoc.exists ? userDoc.data() : {}

    // 재전송 제한 확인 (1분 이내 재요청 방지)
    if (userData.passwordResetTokenCreatedAt) {
      const lastSent = userData.passwordResetTokenCreatedAt.toDate()
      const now = new Date()
      const diffSeconds = Math.floor((now - lastSent) / 1000)
      
      if (diffSeconds < RESEND_LIMIT_SECONDS) {
        const remainingSeconds = RESEND_LIMIT_SECONDS - diffSeconds
        return {
          success: false,
          error: `잠시 후 다시 시도해주세요. (${remainingSeconds}초 후)`
        }
      }
    }

    // 새 토큰 생성
    const token = generateVerificationToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Firestore에 토큰 저장
    await userRef.set({
      passwordResetToken: token,
      passwordResetTokenCreatedAt: FieldValue.serverTimestamp(),
      passwordResetTokenExpiresAt: expiresAt,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    // 비밀번호 재설정 URL 생성
    const resetUrl = `${APP_URL}/reset-password?token=${token}&uid=${userRecord.uid}`

    // 비밀번호 재설정 메일 발송
    const sent = await sendPasswordResetEmailToUser(email, resetUrl, userData.name, PASSWORD_RESET_TOKEN_EXPIRY_HOURS)

    if (!sent) {
      return {
        success: false,
        error: '비밀번호 재설정 이메일 발송에 실패했습니다.'
      }
    }

    return {
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다.'
    }
  } catch (error) {
    console.error('비밀번호 재설정 메일 발송 오류:', error)
    return {
      success: false,
      error: error.message || '비밀번호 재설정 이메일 발송에 실패했습니다.'
    }
  }
})

/**
 * 비밀번호 재설정 토큰 검증 및 비밀번호 변경
 * 
 * 토큰의 유효성을 확인하고 비밀번호를 변경합니다.
 */
exports.verifyPasswordResetToken = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001',
    'http://localhost:3000'
  ]
}, async (request) => {
  try {
    const { token, uid, newPassword } = request.data

    if (!token || !uid) {
      return {
        success: false,
        error: '토큰과 uid가 필요합니다.'
      }
    }

    // Firestore에서 사용자 정보 확인
    const userRef = firestore.collection('users').doc(uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return {
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      }
    }

    const userData = userDoc.data()

    // 토큰 일치 확인
    if (userData.passwordResetToken !== token) {
      return {
        success: false,
        error: '유효하지 않은 재설정 링크입니다. 새로운 비밀번호 재설정을 요청해주세요.',
        errorType: 'invalid_token'
      }
    }

    // 만료 시간 확인
    if (userData.passwordResetTokenExpiresAt) {
      const expiresAt = userData.passwordResetTokenExpiresAt.toDate()
      const now = new Date()
      
      if (now > expiresAt) {
        return {
          success: false,
          error: '재설정 링크가 만료되었습니다. 새로운 비밀번호 재설정을 요청해주세요.',
          errorType: 'expired_token'
        }
      }
    }

    // 토큰 검증만 하는 경우 (newPassword가 없는 경우)
    if (!newPassword) {
      return {
        success: true,
        message: '유효한 토큰입니다.',
        email: userData.email
      }
    }

    // 비밀번호 변경
    await auth.updateUser(uid, {
      password: newPassword
    })

    // 토큰 삭제
    await userRef.set({
      passwordResetToken: null,
      passwordResetTokenCreatedAt: null,
      passwordResetTokenExpiresAt: null,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
      email: userData.email
    }
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error)
    return {
      success: false,
      error: error.message || '비밀번호 재설정에 실패했습니다.'
    }
  }
})

/**
 * (구버전 호환용) 재인증 이메일 발송
 * @deprecated resendVerificationEmail 사용 권장
 */
exports.resendVerificationEmailWithReset = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001'
  ]
}, async (request) => {
  // 새로운 resendVerificationEmail로 리다이렉트
  const { email, password } = request.data
  
  try {
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

    // Firestore에서 사용자 정보 확인
    const userRef = firestore.collection('users').doc(userRecord.uid)
    const userDoc = await userRef.get()
    const userData = userDoc.exists ? userDoc.data() : {}

    // 새 토큰 생성
    const token = generateVerificationToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Firebase Auth의 emailVerified를 false로 초기화
    await auth.updateUser(userRecord.uid, {
      emailVerified: false
    })

    // Firestore 업데이트
    await userRef.set({
      emailVerified: false,
      emailVerifiedAt: null,
      verificationToken: token,
      verificationTokenCreatedAt: FieldValue.serverTimestamp(),
      verificationTokenExpiresAt: expiresAt,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    // 인증 URL 생성
    const verificationUrl = `${APP_URL}/verify-email?token=${token}&uid=${userRecord.uid}`

    // 인증 메일 발송
    const sent = await sendVerificationEmail(email, 'reauth', verificationUrl, userData.name, VERIFICATION_TOKEN_EXPIRY_HOURS)

    if (!sent) {
      return {
        success: false,
        error: '인증 이메일 발송에 실패했습니다.'
      }
    }

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

/**
 * 알라딘 도서 검색 API 호출
 * 
 * 이 함수는 알라딘 Open API를 사용하여 도서를 검색합니다.
 */
exports.searchAladinBooks = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001'
  ]
}, async (request) => {
  try {
    const { query, start = 1, display = 20 } = request.data

    if (!query || query.trim() === '') {
      return {
        success: false,
        error: '검색어를 입력해주세요.'
      }
    }

    // 한 번에 충분한 양의 결과를 가져옴 (세트 필터링 후에도 충분하도록)
    // 알라딘 API 최대 50개 제한
    const fetchAmount = 50

    // 알라딘 API 인증 정보 가져오기
    const ttbKey = aladinTtbKey.value()
    
    if (!ttbKey) {
      return {
        success: false,
        error: '알라딘 API 인증 정보가 설정되지 않았습니다.'
      }
    }

    // 알라딘 도서 검색 API 호출
    const apiUrl = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx'
    const params = new URLSearchParams({
      ttbkey: ttbKey,
      Query: query.trim(),
      QueryType: 'Title',
      MaxResults: fetchAmount.toString(),
      start: '1',
      SearchTarget: 'Book',
      output: 'js',
      Version: '20131101'
    })

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('알라딘 API 오류:', response.status, errorText)
      return {
        success: false,
        error: `알라딘 API 호출 실패: ${response.status}`
      }
    }

    const responseText = await response.text()
    
    // JSONP 응답 파싱
    let data
    try {
      data = parseAladinResponse(responseText)
    } catch (parseError) {
      console.error('알라딘 API 응답 파싱 오류:', parseError)
      console.error('응답 텍스트 (처음 500자):', responseText.substring(0, 500))
      return {
        success: false,
        error: `알라딘 API 응답을 파싱할 수 없습니다: ${parseError.message}`
      }
    }

    // 에러 체크
    if (data.errorCode && data.errorCode !== '0') {
      console.error('알라딘 API 오류:', data.errorCode, data.errorMessage)
      return {
        success: false,
        error: data.errorMessage || `알라딘 API 오류가 발생했습니다. (코드: ${data.errorCode})`
      }
    }

    // 세트 상품 제외 (필터링된 전체 결과 반환)
    const filteredItems = (data.item || []).filter(item => !isSetProduct(item))

    return {
      success: true,
      data: {
        total: filteredItems.length,
        items: filteredItems
      }
    }
  } catch (error) {
    console.error('알라딘 도서 검색 오류:', error)
    return {
      success: false,
      error: error.message || '도서 검색에 실패했습니다.'
    }
  }
})

/**
 * 알라딘 베스트셀러 API 호출
 * 
 * 이 함수는 알라딘 Open API를 사용하여 베스트셀러 목록을 조회합니다.
 * 알라딘 API는 QueryType='Bestseller'로 베스트셀러 목록을 제공합니다.
 */
exports.getAladinBestsellers = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001'
  ]
}, async (request) => {
  try {
    const { display = 10 } = request.data

    // display 최대값 제한 (알라딘 API 최대 200)
    const displayLimit = Math.min(display, 200)

    // 알라딘 API 인증 정보 가져오기
    const ttbKey = aladinTtbKey.value()
    
    if (!ttbKey) {
      return {
        success: false,
        error: '알라딘 API 인증 정보가 설정되지 않았습니다.'
      }
    }

    // 알라딘 베스트셀러 API 호출
    const apiUrl = 'https://www.aladin.co.kr/ttb/api/ItemList.aspx'
    const params = new URLSearchParams({
      ttbkey: ttbKey,
      QueryType: 'Bestseller',
      MaxResults: displayLimit.toString(),
      start: '1',
      SearchTarget: 'Book',
      output: 'js',
      Version: '20131101'
    })

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('알라딘 API 오류:', response.status, errorText)
      return {
        success: false,
        error: `알라딘 API 호출 실패: ${response.status}`
      }
    }

    const responseText = await response.text()
    
    // JSONP 응답 파싱
    let data
    try {
      data = parseAladinResponse(responseText)
    } catch (parseError) {
      console.error('알라딘 API 응답 파싱 오류:', parseError)
      console.error('응답 텍스트 (처음 500자):', responseText.substring(0, 500))
      return {
        success: false,
        error: `알라딘 API 응답을 파싱할 수 없습니다: ${parseError.message}`
      }
    }

    // 에러 체크
    if (data.errorCode && data.errorCode !== '0') {
      console.error('알라딘 API 오류:', data.errorCode, data.errorMessage)
      return {
        success: false,
        error: data.errorMessage || `알라딘 API 오류가 발생했습니다. (코드: ${data.errorCode})`
      }
    }

    // 세트 상품 제외
    const filteredItems = (data.item || []).filter(item => !isSetProduct(item))

    // 요청한 개수만큼만 반환
    const result = filteredItems.slice(0, displayLimit)

    return {
      success: true,
      data: {
        total: result.length,
        start: 1,
        display: result.length,
        items: result
      }
    }
  } catch (error) {
    console.error('알라딘 베스트셀러 조회 오류:', error)
    return {
      success: false,
      error: error.message || '베스트셀러 조회에 실패했습니다.'
    }
  }
})

// ==================== 이메일 발송 시스템 ====================

/**
 * Nodemailer 트랜스포터 생성
 */
const createMailTransporter = () => {
  const user = gmailUser.value()
  const pass = gmailAppPassword.value()
  
  if (!user || !pass) {
    console.log('Gmail 인증 정보가 설정되지 않았습니다.')
    return null
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  })
}

/**
 * 인증 토큰 생성
 * @returns {string} 32바이트 랜덤 토큰 (hex)
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 인증 메일 템플릿 생성
 * @param {string} type - 인증 타입 (signup, reauth)
 * @param {string} verificationUrl - 인증 링크 URL
 * @param {string} userName - 사용자 이름
 * @param {number} expiresInHours - 만료 시간 (시간)
 * @returns {string} HTML 이메일 템플릿
 */
const createVerificationEmailTemplate = (type, verificationUrl, userName, expiresInHours = 24) => {
  const isReauth = type === 'reauth'
  const title = isReauth ? '이메일 재인증 안내' : '이메일 인증 안내'
  const description = isReauth 
    ? '3개월 주기 재인증이 필요합니다. 아래 버튼을 클릭하여 이메일 인증을 완료해주세요.'
    : 'CNX Library 가입을 환영합니다! 아래 버튼을 클릭하여 이메일 인증을 완료해주세요.'
  
  // 재인증 메일인 경우 이전 링크 만료 안내 추가
  const reauthWarning = isReauth ? `
              <!-- 이전 링크 만료 안내 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #fef2f2; border-radius: 12px; padding: 16px 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #dc2626; line-height: 1.6;">
                      ⚠️ <strong>이전에 발송된 인증 메일의 링크는 더 이상 유효하지 않습니다.</strong><br>
                      반드시 이 메일의 링크를 사용하여 인증을 진행해주세요.
                    </p>
                  </td>
                </tr>
              </table>` : ''
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F2F2F2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F2F2F2;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- 헤더 -->
          <tr>
            <td style="background-color: #002C5B; padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                      CNX Library
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- 본문 -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 40px;">
              <!-- 인증 배지 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: ${isReauth ? '#f59e0b15' : '#16a34a15'}; border-radius: 8px; padding: 8px 16px;">
                    <span style="font-size: 14px; font-weight: 600; color: ${isReauth ? '#f59e0b' : '#16a34a'};">
                      ${isReauth ? '🔄 재인증 필요' : '✉️ 이메일 인증'}
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- 인사말 -->
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #002C5B; line-height: 1.4;">
                ${userName ? `${userName}님, ` : ''}${title}
              </h2>
              
              <!-- 설명 -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
                ${description}
              </p>
              
              <!-- 인증 버튼 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-radius: 8px; background-color: #002C5B;">
                          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                            이메일 인증하기
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${reauthWarning}
              <!-- 안내 메시지 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 500;">⏱️ 인증 링크 유효 시간</p>
                    <p style="margin: 0; font-size: 14px; color: #002C5B; font-weight: 600;">${expiresInHours}시간</p>
                  </td>
                </tr>
              </table>
              
              <!-- 버튼이 작동하지 않는 경우 -->
              <p style="margin: 32px 0 8px 0; font-size: 13px; color: #9ca3af;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                ${verificationUrl}
              </p>
            </td>
          </tr>
          
          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af; text-align: center;">
                본인이 요청하지 않은 경우 이 메일을 무시해주세요.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                © CNX Library
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * 인증 이메일 발송
 * @param {string} to - 수신자 이메일
 * @param {string} type - 인증 타입 (signup, reauth)
 * @param {string} verificationUrl - 인증 링크 URL
 * @param {string} userName - 사용자 이름
 * @param {number} expiresInHours - 만료 시간 (시간)
 * @returns {boolean} 발송 성공 여부
 */
const sendVerificationEmail = async (to, type, verificationUrl, userName, expiresInHours = 24) => {
  const transporter = createMailTransporter()
  
  if (!transporter) {
    console.log('이메일 발송 스킵: 트랜스포터 없음')
    return false
  }
  
  try {
    const isReauth = type === 'reauth'
    const subject = isReauth ? '[CNX Library] 이메일 재인증 안내' : '[CNX Library] 이메일 인증 안내'
    const html = createVerificationEmailTemplate(type, verificationUrl, userName, expiresInHours)
    
    await transporter.sendMail({
      from: `"CNX Library" <${gmailUser.value()}>`,
      to,
      subject,
      html
    })
    
    console.log(`인증 이메일 발송 완료: ${to}`)
    return true
  } catch (error) {
    console.error('인증 이메일 발송 오류:', error)
    return false
  }
}

/**
 * 이메일 템플릿 생성
 * @param {string} type - 알림 타입
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @param {Object} extra - 추가 정보
 * @returns {string} HTML 이메일 템플릿
 */
const createEmailTemplate = (type, title, message, extra = {}) => {
  // 알림 타입별 아이콘 및 색상
  const typeConfig = {
    book_request: { icon: '📚', color: '#002C5B', label: '도서 등록 신청' },
    rent_request: { icon: '📖', color: '#0284c7', label: '도서 대여 신청' },
    book_registered: { icon: '✅', color: '#16a34a', label: '도서 등록 완료' },
    return_reminder: { icon: '⏰', color: '#f59e0b', label: '반납 예정 알림' },
    overdue: { icon: '⚠️', color: '#dc2626', label: '연체 알림' },
    overdue_admin: { icon: '🚨', color: '#dc2626', label: '연체 알림 (관리자)' }
  }
  
  const config = typeConfig[type] || { icon: '🔔', color: '#002C5B', label: '알림' }
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F2F2F2;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F2F2F2;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- 헤더 -->
          <tr>
            <td style="background-color: #002C5B; padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                      CNX Library
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- 본문 -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 40px;">
              <!-- 알림 타입 배지 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: ${config.color}15; border-radius: 8px; padding: 8px 16px;">
                    <span style="font-size: 14px; font-weight: 600; color: ${config.color};">
                      ${config.icon} ${config.label}
                    </span>
                  </td>
                </tr>
              </table>
              
              <!-- 제목 -->
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #002C5B; line-height: 1.4;">
                ${title}
              </h2>
              
              <!-- 메시지 -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; line-height: 1.7;">
                ${message}
              </p>
              
              <!-- 도서 정보 (있는 경우) -->
              ${extra.bookTitle ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 500;">도서 정보</p>
                    <p style="margin: 0; font-size: 16px; color: #002C5B; font-weight: 600;">${extra.bookTitle}</p>
                    ${extra.center ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">${extra.center}</p>` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- CTA 버튼 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #002C5B;">
                    <a href="https://rarecat85.github.io/cnx-library" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      CNX Library 바로가기
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- 푸터 -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af; text-align: center;">
                이 메일은 CNX Library 알림 설정에 따라 자동 발송되었습니다.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                알림을 받지 않으려면 <a href="https://rarecat85.github.io/cnx-library/notifications" style="color: #002C5B;">알림 설정</a>에서 변경해주세요.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * 이메일 발송
 * @param {string} to - 수신자 이메일
 * @param {string} type - 알림 타입
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @param {Object} extra - 추가 정보
 */
const sendNotificationEmail = async (to, type, title, message, extra = {}) => {
  const transporter = createMailTransporter()
  
  if (!transporter) {
    console.log('이메일 발송 스킵: 트랜스포터 없음')
    return false
  }
  
  try {
    const html = createEmailTemplate(type, title, message, extra)
    
    await transporter.sendMail({
      from: `"CNX Library" <${gmailUser.value()}>`,
      to,
      subject: `[CNX Library] ${title}`,
      html
    })
    
    console.log(`이메일 발송 성공: ${to}`)
    return true
  } catch (error) {
    console.error('이메일 발송 오류:', error)
    return false
  }
}

/**
 * 사용자가 이메일 알림을 활성화했는지 확인하고 이메일 발송
 * @param {string} userId - 사용자 UID
 * @param {string} type - 알림 타입
 * @param {string} title - 알림 제목
 * @param {string} message - 알림 메시지
 * @param {Object} extra - 추가 정보
 */
const sendEmailIfEnabled = async (userId, type, title, message, extra = {}) => {
  try {
    const userDoc = await firestore.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      console.log(`사용자 문서 없음: ${userId}`)
      return
    }
    
    const userData = userDoc.data()
    
    // 이메일 알림 활성화 확인
    if (userData.emailNotification !== true) {
      console.log(`이메일 알림 비활성화: ${userId}`)
      return
    }
    
    // 이메일 주소 확인
    if (!userData.email) {
      console.log(`이메일 주소 없음: ${userId}`)
      return
    }
    
    await sendNotificationEmail(userData.email, type, title, message, extra)
  } catch (error) {
    console.error('이메일 발송 확인 오류:', error)
  }
}

// ==================== 알림 시스템 ====================

// 센터 -> 근무지 매핑 (역방향)
const CENTER_WORKPLACE_MAP = {
  '강남센터': ['강남', '잠실', '수원', '판교'],
  '용산센터': ['용산', '증미', '여의도']
}

/**
 * 알림 생성 헬퍼 함수 (이메일 발송 포함)
 */
const createNotification = async (userId, type, title, message, extra = {}) => {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후
  
  // Firestore에 알림 저장
  await firestore.collection('notifications').add({
    userId,
    type,
    title,
    message,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: expiresAt,
    ...extra
  })
  
  // 이메일 발송 (비동기, 실패해도 알림 생성에 영향 없음)
  sendEmailIfEnabled(userId, type, title, message, extra).catch(err => {
    console.error('이메일 발송 백그라운드 오류:', err)
  })
}

/**
 * 센터에 속한 관리자 목록 조회
 * 센터에 매핑된 근무지(workplace)를 가진 관리자/매니저를 찾음
 */
const getAdminsByCenter = async (center) => {
  const workplaces = CENTER_WORKPLACE_MAP[center] || []
  
  if (workplaces.length === 0) {
    console.log(`센터 ${center}에 매핑된 근무지가 없습니다.`)
    return []
  }
  
  // workplace가 해당 센터에 속하고, role이 admin 또는 manager인 사용자 조회
  const usersSnapshot = await firestore.collection('users')
    .where('workplace', 'in', workplaces)
    .get()
  
  // role 필터링 (Firestore에서 in과 in을 동시에 사용할 수 없으므로 클라이언트에서 필터링)
  const adminIds = usersSnapshot.docs
    .filter(doc => {
      const data = doc.data()
      return data.role === 'admin' || data.role === 'manager'
    })
    .map(doc => doc.id)
  
  console.log(`센터 ${center}의 관리자: ${adminIds.length}명`)
  return adminIds
}

/**
 * 도서 등록 신청 시 관리자에게 알림
 * Trigger: bookRequests 컬렉션에 문서 생성 시
 */
exports.onBookRequestCreated = onDocumentCreated(
  'bookRequests/{requestId}',
  async (event) => {
    const snapshot = event.data
    if (!snapshot) return
    
    const data = snapshot.data()
    const { center, title, requestedBy } = data
    
    if (!center || !title) return
    
    try {
      // 신청자 정보 조회
      const requesterDoc = await firestore.collection('users').doc(requestedBy).get()
      const requesterName = requesterDoc.exists ? requesterDoc.data().name || '알 수 없음' : '알 수 없음'
      
      // 해당 센터의 관리자들에게 알림
      const adminIds = await getAdminsByCenter(center)
      
      for (const adminId of adminIds) {
        await createNotification(
          adminId,
          'book_request',
          '새로운 도서 등록 신청',
          `${requesterName}님이 "${title}" 도서를 신청했습니다.`,
          { bookTitle: title, requestId: snapshot.id, center }
        )
      }
      
      console.log(`도서 등록 신청 알림 생성 완료: ${title}, 관리자 ${adminIds.length}명`)
    } catch (error) {
      console.error('도서 등록 신청 알림 생성 오류:', error)
    }
  }
)

/**
 * 도서 대여 신청 시 관리자에게 알림
 * Trigger: books 컬렉션에서 status가 'requested'로 변경될 때
 */
exports.onRentRequestCreated = onDocumentUpdated(
  'books/{bookId}',
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()
    
    // status가 'requested'로 변경된 경우만 처리
    if (before.status === 'requested' || after.status !== 'requested') return
    
    const { center, title, requestedBy } = after
    
    if (!center || !title || !requestedBy) return
    
    try {
      // 신청자 정보 조회
      const requesterDoc = await firestore.collection('users').doc(requestedBy).get()
      const requesterName = requesterDoc.exists ? requesterDoc.data().name || '알 수 없음' : '알 수 없음'
      
      // 해당 센터의 관리자들에게 알림
      const adminIds = await getAdminsByCenter(center)
      
      for (const adminId of adminIds) {
        await createNotification(
          adminId,
          'rent_request',
          '새로운 도서 대여 신청',
          `${requesterName}님이 "${title}" 도서 대여를 신청했습니다.`,
          { bookId: event.params.bookId, bookTitle: title, center }
        )
      }
      
      console.log(`도서 대여 신청 알림 생성 완료: ${title}, 관리자 ${adminIds.length}명`)
    } catch (error) {
      console.error('도서 대여 신청 알림 생성 오류:', error)
    }
  }
)

/**
 * 신청한 도서가 등록되면 신청자에게 알림
 * Trigger: bookRequests 컬렉션에서 status가 'approved'로 변경될 때
 */
exports.onBookRequestApproved = onDocumentUpdated(
  'bookRequests/{requestId}',
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()
    
    // status가 'approved'로 변경된 경우만 처리
    if (before.status === 'approved' || after.status !== 'approved') return
    
    const { requestedBy, title, center } = after
    
    if (!requestedBy || !title) return
    
    try {
      await createNotification(
        requestedBy,
        'book_registered',
        '신청한 도서가 등록되었습니다',
        `"${title}" 도서가 ${center}에 등록되었습니다. 지금 대여해보세요!`,
        { bookTitle: title, center }
      )
      
      console.log(`도서 등록 완료 알림 생성: ${title} -> ${requestedBy}`)
    } catch (error) {
      console.error('도서 등록 완료 알림 생성 오류:', error)
    }
  }
)

/**
 * 스케줄된 알림 처리 (매일 오전 9시 KST 실행)
 * - 반납예정일 1일 전 알림
 * - 연체 도서 알림 (사용자 + 관리자)
 * - 30일 지난 알림 자동 삭제
 */
exports.scheduledNotifications = onSchedule(
  {
    schedule: '0 9 * * *', // 매일 KST 09:00 (한국 시간 오전 9시)
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3'
  },
  async (event) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)
    
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    try {
      // 1. 대여중인 도서 조회 (rentedAt이 있는 도서)
      const booksSnapshot = await firestore.collection('books')
        .where('rentedBy', '!=', null)
        .get()
      
      for (const bookDoc of booksSnapshot.docs) {
        const book = bookDoc.data()
        const { rentedBy, rentedAt, title, center } = book
        
        if (!rentedAt || !rentedBy) continue
        
        const rentedDate = rentedAt.toDate()
        const returnDate = new Date(rentedDate)
        returnDate.setDate(returnDate.getDate() + 7) // 대여일 + 7일 = 반납예정일
        
        // 반납예정일까지 남은 일수 계산
        const daysUntilReturn = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24))
        
        // 반납예정일 1일 전 알림 (오늘이 반납예정일 하루 전)
        if (daysUntilReturn === 1) {
          // 오늘 이미 알림을 보냈는지 확인
          const existingNotification = await firestore.collection('notifications')
            .where('userId', '==', rentedBy)
            .where('type', '==', 'return_reminder')
            .where('bookId', '==', bookDoc.id)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get()
          
          let shouldSend = true
          if (!existingNotification.empty) {
            const lastNotification = existingNotification.docs[0].data()
            const lastSentDate = lastNotification.createdAt?.toDate()
            if (lastSentDate && lastSentDate.toDateString() === today.toDateString()) {
              shouldSend = false
            }
          }
          
          if (shouldSend) {
            await createNotification(
              rentedBy,
              'return_reminder',
              '반납예정일 알림',
              `"${title}" 도서의 반납예정일이 내일입니다.`,
              { bookId: bookDoc.id, bookTitle: title, center }
            )
            console.log(`반납예정 알림 생성: ${title} -> ${rentedBy}`)
          }
        }
        
        // 연체 알림 (반납예정일이 지난 경우)
        if (daysUntilReturn < 0) {
          const overdueDays = Math.abs(daysUntilReturn)
          
          // 오늘 이미 연체 알림을 보냈는지 확인
          const existingOverdue = await firestore.collection('notifications')
            .where('userId', '==', rentedBy)
            .where('type', '==', 'overdue')
            .where('bookId', '==', bookDoc.id)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get()
          
          let shouldSendOverdue = true
          if (!existingOverdue.empty) {
            const lastNotification = existingOverdue.docs[0].data()
            const lastSentDate = lastNotification.createdAt?.toDate()
            if (lastSentDate && lastSentDate.toDateString() === today.toDateString()) {
              shouldSendOverdue = false
            }
          }
          
          if (shouldSendOverdue) {
            // 대여자에게 연체 알림
            await createNotification(
              rentedBy,
              'overdue',
              '도서 연체 알림',
              `"${title}" 도서가 ${overdueDays}일 연체되었습니다. 빠른 반납 부탁드립니다.`,
              { bookId: bookDoc.id, bookTitle: title, center, overdueDays }
            )
            console.log(`연체 알림 생성 (사용자): ${title} -> ${rentedBy}`)
            
            // 관리자에게 연체 알림
            const adminIds = await getAdminsByCenter(center)
            
            // 대여자 정보 조회
            const renterDoc = await firestore.collection('users').doc(rentedBy).get()
            const renterName = renterDoc.exists ? renterDoc.data().name || '알 수 없음' : '알 수 없음'
            
            for (const adminId of adminIds) {
              await createNotification(
                adminId,
                'overdue_admin',
                '도서 연체 알림',
                `${renterName}님이 대여한 "${title}" 도서가 ${overdueDays}일 연체되었습니다.`,
                { bookId: bookDoc.id, bookTitle: title, center, overdueDays, rentedBy }
              )
            }
            console.log(`연체 알림 생성 (관리자): ${title}, 관리자 ${adminIds.length}명`)
          }
        }
      }
      
      // 2. 30일 지난 알림 자동 삭제
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const oldNotifications = await firestore.collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .get()
      
      const batch = firestore.batch()
      let deleteCount = 0
      
      oldNotifications.forEach(doc => {
        batch.delete(doc.ref)
        deleteCount++
      })
      
      if (deleteCount > 0) {
        await batch.commit()
        console.log(`${deleteCount}개의 오래된 알림 삭제 완료`)
      }
      
      console.log('스케줄된 알림 처리 완료')
    } catch (error) {
      console.error('스케줄된 알림 처리 오류:', error)
    }
  }
)

