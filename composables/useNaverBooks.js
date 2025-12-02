import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore'

export const useNaverBooks = () => {
  const { $firebaseFirestore, $firebaseApp } = useNuxtApp()
  const firestore = $firebaseFirestore

  const loading = ref(false)
  const error = ref(null)

  /**
   * 네이버 도서 검색
   * @param {string} query - 검색어
   * @param {number} start - 시작 위치 (기본값: 1)
   * @param {number} display - 표시 개수 (기본값: 20, 최대: 100)
   * @returns {Promise<Object>} 검색 결과
   */
  const searchBooks = async (query, start = 1, display = 20) => {
    if (!firestore || !$firebaseApp) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const functions = getFunctions($firebaseApp)
      const searchNaverBooks = httpsCallable(functions, 'searchNaverBooks')

      const result = await searchNaverBooks({
        query,
        start,
        display
      })

      if (result.data.success) {
        return result.data.data
      } else {
        throw new Error(result.data.error || '도서 검색에 실패했습니다.')
      }
    } catch (err) {
      console.error('도서 검색 오류:', err)
      error.value = err.message || '도서 검색에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Firestore에 도서 등록
   * @param {Object} bookData - 도서 정보 (네이버 API 응답의 item)
   * @param {string} center - 센터명
   * @param {string} userId - 등록한 사용자 UID
   * @returns {Promise<Object>} 등록 결과
   */
  const registerBook = async (bookData, center, userId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      // ISBN 추출 (네이버 API는 isbn과 isbn13을 제공)
      const isbn = bookData.isbn13 || bookData.isbn || ''
      
      if (!isbn) {
        throw new Error('ISBN 정보가 없습니다.')
      }

      // ISBN을 문서 ID로 사용 (중복 방지)
      const bookRef = doc(firestore, 'books', isbn)
      const bookDoc = await getDoc(bookRef)

      // 이미 등록된 도서인지 확인
      if (bookDoc.exists()) {
        const existingBook = bookDoc.data()
        // 같은 센터에 이미 등록되어 있는지 확인
        if (existingBook.center === center) {
          throw new Error('이미 해당 센터에 등록된 도서입니다.')
        }
        // 다른 센터에 등록되어 있으면 새로 등록 가능 (센터별로 관리)
      }

      // 도서 정보 정리
      const bookInfo = {
        isbn: isbn,
        isbn13: bookData.isbn13 || '',
        isbn10: bookData.isbn || '',
        title: bookData.title || '',
        author: bookData.author || '',
        publisher: bookData.publisher || '',
        pubdate: bookData.pubdate || '',
        description: bookData.description || '',
        image: bookData.image || '',
        link: bookData.link || '',
        center: center,
        status: 'available', // 기본값: 대여 가능
        registeredBy: userId,
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Firestore에 저장
      await setDoc(bookRef, bookInfo, { merge: true })

      return {
        success: true,
        book: bookInfo
      }
    } catch (err) {
      console.error('도서 등록 오류:', err)
      error.value = err.message || '도서 등록에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 센터별 도서 목록 조회
   * @param {string} center - 센터명 (선택사항, 없으면 전체)
   * @returns {Promise<Array>} 도서 목록
   */
  const getBooksByCenter = async (center = null) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const booksRef = collection(firestore, 'books')
      let q

      if (center) {
        q = query(booksRef, where('center', '==', center))
      } else {
        q = booksRef
      }

      const querySnapshot = await getDocs(q)
      const books = []

      querySnapshot.forEach((doc) => {
        books.push({
          id: doc.id,
          ...doc.data()
        })
      })

      // 등록일 기준 내림차순 정렬
      books.sort((a, b) => {
        const dateA = a.registeredAt?.toDate?.() || new Date(0)
        const dateB = b.registeredAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })

      return books
    } catch (err) {
      console.error('도서 목록 조회 오류:', err)
      error.value = err.message || '도서 목록 조회에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 상태 업데이트
   * @param {string} isbn - ISBN
   * @param {string} status - 상태 ('available', 'rented', 'reserved')
   * @returns {Promise<Object>} 업데이트 결과
   */
  const updateBookStatus = async (isbn, status) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const validStatuses = ['available', 'rented', 'reserved']
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태입니다.')
      }

      const bookRef = doc(firestore, 'books', isbn)
      await setDoc(bookRef, {
        status: status,
        updatedAt: serverTimestamp()
      }, { merge: true })

      return {
        success: true
      }
    } catch (err) {
      console.error('도서 상태 업데이트 오류:', err)
      error.value = err.message || '도서 상태 업데이트에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    searchBooks,
    registerBook,
    getBooksByCenter,
    updateBookStatus
  }
}

