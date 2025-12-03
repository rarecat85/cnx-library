const { onCall } = require('firebase-functions/v2/https')
const { defineString } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const functions = require('firebase-functions')

// 알라딘 API 키 (환경 변수)
const aladinTtbKey = defineString('ALADIN_TTB_KEY', { default: '' })

// Firebase Admin 초기화
initializeApp()

const auth = getAuth()
const firestore = getFirestore()

// 알라딘 API 인증 정보는 aladinTtbKey를 직접 사용

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

/**
 * 알라딘 도서 검색 API 호출
 * 
 * 이 함수는 알라딘 Open API를 사용하여 도서를 검색합니다.
 */
exports.searchAladinBooks = onCall({
  cors: true
}, async (request) => {
  try {
    const { query, start = 1, display = 20 } = request.data

    if (!query || query.trim() === '') {
      return {
        success: false,
        error: '검색어를 입력해주세요.'
      }
    }

    // display 최대값 제한 (알라딘 API 최대 200)
    const displayLimit = Math.min(display, 200)
    const startValue = Math.max(1, start)

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
      MaxResults: displayLimit.toString(),
      start: startValue.toString(),
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
    
    // JSONP 응답 처리 (callback 함수 제거)
    let data
    try {
      // 알라딘 API는 JSONP 형식으로 응답 (예: callback({...}))
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
      
      data = JSON.parse(cleanedText)
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

    // 세트 상품 필터링 함수
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

    // 세트 상품 제외
    const filteredItems = (data.item || []).filter(item => !isSetProduct(item))

    return {
      success: true,
      data: {
        total: filteredItems.length,
        start: startValue,
        display: filteredItems.length,
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
  cors: true
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
    
    // JSONP 응답 처리 (callback 함수 제거)
    let data
    try {
      // 알라딘 API는 JSONP 형식으로 응답 (예: callback({...}))
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
      
      data = JSON.parse(cleanedText)
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

    // 세트 상품 필터링 함수
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

