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

export const useBooks = () => {
  const { $firebaseFirestore, $firebaseApp } = useNuxtApp()
  const firestore = $firebaseFirestore

  const loading = ref(false)
  const error = ref(null)

  /**
   * 도서 문서 ID 생성 (ISBN_센터 형식)
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @returns {string} 문서 ID
   */
  const createBookId = (isbn, center) => {
    return `${isbn}_${center}`
  }

  /**
   * 알라딘 도서 검색
   * @param {string} query - 검색어
   * @param {number} start - 시작 위치 (기본값: 1)
   * @param {number} display - 표시 개수 (기본값: 20, 최대: 200)
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
      const searchAladinBooks = httpsCallable(functions, 'searchAladinBooks')

      const result = await searchAladinBooks({
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
   * @param {Object} bookData - 도서 정보 (알라딘 API 응답의 item)
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

      // ISBN 추출 (알라딘 API는 isbn과 isbn13을 제공)
      const isbn = bookData.isbn13 || bookData.isbn || ''
      
      if (!isbn) {
        throw new Error('ISBN 정보가 없습니다.')
      }

      // ISBN_센터를 문서 ID로 사용 (센터별로 별도 관리)
      const bookId = createBookId(isbn, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      // 이미 등록된 도서인지 확인
      if (bookDoc.exists()) {
        throw new Error('이미 해당 센터에 등록된 도서입니다.')
      }

      // 도서 정보 정리 (알라딘 API 형식)
      const bookInfo = {
        isbn: isbn,
        isbn13: bookData.isbn13 || '',
        isbn10: bookData.isbn || '',
        title: bookData.title || '',
        author: bookData.author || '',
        publisher: bookData.publisher || '',
        pubdate: bookData.pubDate || bookData.pubdate || '',
        description: bookData.description || '',
        image: bookData.cover || bookData.image || '',
        link: bookData.link || '',
        center: center,
        status: 'available', // 기본값: 대여 가능
        registeredBy: userId,
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Firestore에 저장
      await setDoc(bookRef, bookInfo)

      return {
        success: true,
        book: bookInfo,
        bookId: bookId
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
   * 알라딘 도서 베스트셀러 조회
   * @param {number} display - 표시 개수 (기본값: 10, 최대: 200)
   * @returns {Promise<Object>} 베스트셀러 목록
   */
  const getBestsellers = async (display = 10) => {
    if (!firestore || !$firebaseApp) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const functions = getFunctions($firebaseApp)
      const getAladinBestsellers = httpsCallable(functions, 'getAladinBestsellers')

      const result = await getAladinBestsellers({
        display
      })

      if (result.data.success) {
        return result.data.data
      } else {
        throw new Error(result.data.error || '베스트셀러 조회에 실패했습니다.')
      }
    } catch (err) {
      console.error('베스트셀러 조회 오류:', err)
      error.value = err.message || '베스트셀러 조회에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 대여 처리
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @param {string} userId - 대여한 사용자 UID
   * @returns {Promise<Object>} 대여 결과
   */
  const rentBook = async (isbn, center, userId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(isbn, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      // 실제로 대여중인지 확인 (status와 rentedBy 모두 확인)
      if (bookData.status === 'rented' && bookData.rentedBy) {
        throw new Error('이미 대여 중인 도서입니다.')
      }

      // 대여일로부터 일주일 후 반납 예정일 계산
      const rentedAt = new Date()
      const expectedReturnDate = new Date(rentedAt)
      expectedReturnDate.setDate(expectedReturnDate.getDate() + 7)

      await setDoc(bookRef, {
        status: 'rented',
        rentedBy: userId,
        rentedAt: serverTimestamp(),
        expectedReturnDate: expectedReturnDate,
        updatedAt: serverTimestamp()
      }, { merge: true })

      return {
        success: true
      }
    } catch (err) {
      console.error('도서 대여 오류:', err)
      error.value = err.message || '도서 대여에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 반납 처리
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @returns {Promise<Object>} 반납 결과
   */
  const returnBook = async (isbn, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(isbn, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      if (bookData.status !== 'rented') {
        throw new Error('대여 중이 아닌 도서입니다.')
      }

      await setDoc(bookRef, {
        status: 'available',
        rentedBy: null,
        rentedAt: null,
        expectedReturnDate: null,
        returnedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

      return {
        success: true
      }
    } catch (err) {
      console.error('도서 반납 오류:', err)
      error.value = err.message || '도서 반납에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 삭제 처리
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @returns {Promise<Object>} 삭제 결과
   */
  const deleteBook = async (isbn, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const { deleteDoc } = await import('firebase/firestore')
      const bookId = createBookId(isbn, center)
      const bookRef = doc(firestore, 'books', bookId)
      await deleteDoc(bookRef)

      return {
        success: true
      }
    } catch (err) {
      console.error('도서 삭제 오류:', err)
      error.value = err.message || '도서 삭제에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 대여 신청 (다른 센터 도서 대여 시)
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @param {string} userId - 신청한 사용자 UID
   * @returns {Promise<Object>} 신청 결과
   */
  const requestRent = async (isbn, center, userId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(isbn, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      // 이미 대여중이거나 신청중인지 확인
      if (bookData.status === 'rented' && bookData.rentedBy) {
        throw new Error('이미 대여 중인 도서입니다.')
      }
      if (bookData.status === 'requested' && bookData.requestedBy) {
        throw new Error('이미 대여 신청된 도서입니다.')
      }

      await setDoc(bookRef, {
        status: 'requested',
        requestedBy: userId,
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

      return {
        success: true
      }
    } catch (err) {
      console.error('도서 대여 신청 오류:', err)
      error.value = err.message || '도서 대여 신청에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 상태 계산 (대여일 기준 일주일 지나면 연체)
   * @param {Object} book - 도서 데이터
   * @returns {string|null} 상태 ('rented', 'overdue', 'requested', null)
   */
  const calculateBookStatus = (book) => {
    if (!book) return null

    // 삭제된 도서는 null 반환
    if (book.status === 'deleted') {
      return null
    }

    // 대여 신청 중인 경우
    if (book.status === 'requested' && book.requestedBy) {
      return 'requested'
    }

    // 대여 중인 경우
    if (book.status === 'rented' && book.rentedAt) {
      const rentedDate = book.rentedAt?.toDate?.() || new Date(book.rentedAt)
      const oneWeekLater = new Date(rentedDate)
      oneWeekLater.setDate(oneWeekLater.getDate() + 7)
      const now = new Date()

      // 일주일이 지났으면 연체
      if (now > oneWeekLater) {
        return 'overdue'
      }
      return 'rented'
    }

    return null
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    createBookId,
    searchBooks,
    registerBook,
    getBooksByCenter,
    getBestsellers,
    rentBook,
    requestRent,
    returnBook,
    deleteBook,
    calculateBookStatus
  }
}



