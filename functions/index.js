const { onCall } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { defineString } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const functions = require('firebase-functions')
const nodemailer = require('nodemailer')

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

/**
 * 재인증 이메일 발송 (인증 상태 초기화 후)
 * 
 * 이 함수는 재인증 이메일을 발송하기 전에 사용자의 emailVerified 상태를
 * false로 초기화하여 새로운 액션 코드를 생성할 수 있도록 합니다.
 */
exports.resendVerificationEmailWithReset = onCall({
  cors: [
    'https://rarecat85.github.io',
    'http://localhost:5001'
  ]
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
    schedule: '0 0 * * *', // 매일 UTC 00:00 (KST 09:00)
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

