/**
 * 테스트 시나리오 세션 관리 Composable
 */
import { TEST_SCENARIOS as TEST_SCENARIOS_V1, getTotalTestCount as getTotalTestCountV1, getAllTestIds as getAllTestIdsV1 } from '@/utils/testScenarioData.js'
import { TEST_SCENARIOS_V2, getTotalTestCountV2, getAllTestIdsV2 } from '@/utils/testScenarioDataV2.js'

// V2 시나리오에 [V2] 접두사를 붙여서 구분
const TEST_SCENARIOS_V2_PREFIXED = TEST_SCENARIOS_V2.map(section => ({
  ...section,
  section: `[V2] ${section.section}`
}))

// V1 + V2 통합 시나리오
const TEST_SCENARIOS = [...TEST_SCENARIOS_V1, ...TEST_SCENARIOS_V2_PREFIXED]

// 통합 테스트 항목 수
const getTotalTestCount = () => getTotalTestCountV1() + getTotalTestCountV2()

// 통합 테스트 ID 목록
const getAllTestIds = () => [...getAllTestIdsV1(), ...getAllTestIdsV2()]

export const useTestScenario = () => {
  const { $firebaseFirestore } = useNuxtApp()
  const firestore = $firebaseFirestore
  const { user } = useAuth()

  const loading = ref(false)
  const error = ref(null)

  /**
   * 새 테스트 세션 생성
   * @param {Object} sessionData - 세션 정보
   * @param {Date} sessionData.testDate - 테스트 일자
   * @param {Array} sessionData.testers - 테스트 담당자 배열
   */
  const createSession = async (sessionData) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

      const totalCount = getTotalTestCount()

      const newSession = {
        testDate: sessionData.testDate,
        testers: sessionData.testers || [],
        status: 'in_progress',
        progress: {
          total: totalCount,
          pass: 0,
          fail: 0,
          partial: 0,
          skip: 0,
          completed: 0
        },
        createdBy: user.value?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const sessionsRef = collection(firestore, 'testSessions')
      const docRef = await addDoc(sessionsRef, newSession)

      return {
        id: docRef.id,
        ...newSession
      }
    } catch (err) {
      console.error('테스트 세션 생성 오류:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 테스트 세션 목록 조회
   */
  const getSessions = async () => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const { collection, query, orderBy, getDocs } = await import('firebase/firestore')

      const sessionsRef = collection(firestore, 'testSessions')
      const q = query(sessionsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      const sessions = []
      snapshot.forEach(doc => {
        sessions.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return sessions
    } catch (err) {
      console.error('테스트 세션 목록 조회 오류:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 테스트 세션 상세 조회
   * @param {string} sessionId - 세션 ID
   */
  const getSession = async (sessionId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const { doc, getDoc, collection, getDocs } = await import('firebase/firestore')

      // 세션 정보 조회
      const sessionRef = doc(firestore, 'testSessions', sessionId)
      const sessionDoc = await getDoc(sessionRef)

      if (!sessionDoc.exists()) {
        throw new Error('테스트 세션을 찾을 수 없습니다.')
      }

      const sessionData = {
        id: sessionDoc.id,
        ...sessionDoc.data()
      }

      // 테스트 결과 조회
      const resultsRef = collection(firestore, 'testSessions', sessionId, 'results')
      const resultsSnapshot = await getDocs(resultsRef)

      const results = {}
      resultsSnapshot.forEach(doc => {
        results[doc.id] = doc.data()
      })

      return {
        session: sessionData,
        results
      }
    } catch (err) {
      console.error('테스트 세션 상세 조회 오류:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 테스트 결과 저장
   * @param {string} sessionId - 세션 ID
   * @param {string} testId - 테스트 ID (예: "1.1.1")
   * @param {Object} resultData - 결과 데이터
   * @param {string} resultData.result - 결과 ('pass' | 'fail' | 'partial' | 'skip' | '')
   * @param {string} resultData.note - 비고
   * @param {string} resultData.tester - 담당자
   */
  const saveTestResult = async (sessionId, testId, resultData) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

      const resultRef = doc(firestore, 'testSessions', sessionId, 'results', testId)
      await setDoc(resultRef, {
        result: resultData.result || '',
        note: resultData.note || '',
        tester: resultData.tester || '',
        updatedAt: serverTimestamp()
      })

      // 세션 진행률 업데이트
      await updateSessionProgress(sessionId)

      return true
    } catch (err) {
      console.error('테스트 결과 저장 오류:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * 세션 진행률 업데이트
   * @param {string} sessionId - 세션 ID
   */
  const updateSessionProgress = async (sessionId) => {
    if (!firestore) return

    try {
      const { doc, updateDoc, collection, getDocs, serverTimestamp } = await import('firebase/firestore')

      // 모든 결과 조회
      const resultsRef = collection(firestore, 'testSessions', sessionId, 'results')
      const resultsSnapshot = await getDocs(resultsRef)

      let pass = 0
      let fail = 0
      let partial = 0
      let skip = 0
      let completed = 0

      resultsSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.result) {
          completed++
          switch (data.result) {
            case 'pass':
              pass++
              break
            case 'fail':
              fail++
              break
            case 'partial':
              partial++
              break
            case 'skip':
              skip++
              break
          }
        }
      })

      const totalCount = getTotalTestCount()
      const status = completed === totalCount ? 'completed' : 'in_progress'

      // 세션 업데이트
      const sessionRef = doc(firestore, 'testSessions', sessionId)
      await updateDoc(sessionRef, {
        status,
        progress: {
          total: totalCount,
          pass,
          fail,
          partial,
          skip,
          completed
        },
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('세션 진행률 업데이트 오류:', err)
    }
  }

  /**
   * 테스트 세션 삭제
   * @param {string} sessionId - 세션 ID
   */
  const deleteSession = async (sessionId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore')

      // 결과 서브컬렉션 삭제
      const resultsRef = collection(firestore, 'testSessions', sessionId, 'results')
      const resultsSnapshot = await getDocs(resultsRef)
      
      const deletePromises = []
      resultsSnapshot.forEach(resultDoc => {
        deletePromises.push(deleteDoc(doc(firestore, 'testSessions', sessionId, 'results', resultDoc.id)))
      })
      await Promise.all(deletePromises)

      // 세션 문서 삭제
      const sessionRef = doc(firestore, 'testSessions', sessionId)
      await deleteDoc(sessionRef)

      return true
    } catch (err) {
      console.error('테스트 세션 삭제 오류:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 세션 실시간 구독 (여러 사용자 동시 테스트 지원)
   * @param {string} sessionId - 세션 ID
   * @param {Function} onSessionUpdate - 세션 데이터 업데이트 콜백
   * @param {Function} onResultsUpdate - 결과 데이터 업데이트 콜백
   * @returns {Function} unsubscribe 함수
   */
  const subscribeToSession = async (sessionId, onSessionUpdate, onResultsUpdate) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    const { doc, collection, onSnapshot } = await import('firebase/firestore')
    const unsubscribers = []

    // 세션 문서 실시간 구독
    const sessionRef = doc(firestore, 'testSessions', sessionId)
    const unsubSession = onSnapshot(sessionRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        onSessionUpdate({
          id: docSnapshot.id,
          ...docSnapshot.data()
        })
      }
    }, (err) => {
      console.error('세션 구독 오류:', err)
    })
    unsubscribers.push(unsubSession)

    // 결과 서브컬렉션 실시간 구독
    const resultsRef = collection(firestore, 'testSessions', sessionId, 'results')
    const unsubResults = onSnapshot(resultsRef, (snapshot) => {
      const results = {}
      snapshot.forEach(doc => {
        results[doc.id] = doc.data()
      })
      onResultsUpdate(results)
    }, (err) => {
      console.error('결과 구독 오류:', err)
    })
    unsubscribers.push(unsubResults)

    // 구독 해제 함수 반환
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  /**
   * 세션 상태 업데이트 (완료 처리)
   * @param {string} sessionId - 세션 ID
   * @param {string} status - 상태 ('in_progress' | 'completed')
   */
  const updateSessionStatus = async (sessionId, status) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')

      const sessionRef = doc(firestore, 'testSessions', sessionId)
      await updateDoc(sessionRef, {
        status,
        updatedAt: serverTimestamp()
      })

      return true
    } catch (err) {
      console.error('세션 상태 업데이트 오류:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * 세션 정보 업데이트 (담당자, 일자, 브라우저 등)
   * @param {string} sessionId - 세션 ID
   * @param {Object} info - 업데이트할 정보
   */
  const updateSessionInfo = async (sessionId, info) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')

      const sessionRef = doc(firestore, 'testSessions', sessionId)
      await updateDoc(sessionRef, {
        ...info,
        updatedAt: serverTimestamp()
      })

      return true
    } catch (err) {
      console.error('세션 정보 업데이트 오류:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    // 데이터
    TEST_SCENARIOS,
    getTotalTestCount,
    getAllTestIds,
    
    // 상태
    loading,
    error,
    
    // 메서드
    createSession,
    getSessions,
    getSession,
    subscribeToSession,
    saveTestResult,
    deleteSession,
    updateSessionStatus,
    updateSessionInfo
  }
}

