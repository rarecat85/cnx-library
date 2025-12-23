import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  deleteField
} from 'firebase/firestore'
import { DEFAULT_CATEGORIES } from '@/utils/labelConfig.js'

export const useBooks = () => {
  const { $firebaseFirestore, $firebaseApp } = useNuxtApp()
  const firestore = $firebaseFirestore

  const loading = ref(false)
  const error = ref(null)

  // ==================== 문서 ID 생성 ====================

  /**
   * 도서 문서 ID 생성 (라벨번호_센터 형식)
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @returns {string} 문서 ID
   */
  const createBookId = (labelNumber, center) => {
    return `${labelNumber}_${center}`
  }

  /**
   * 기존 호환용: ISBN_센터 형식 문서 ID 생성
   * @deprecated 라벨번호 시스템으로 전환 후 삭제 예정
   */
  const createBookIdByIsbn = (isbn, center) => {
    return `${isbn}_${center}`
  }

  // ==================== 라벨번호 관련 ====================

  /**
   * 라벨번호 중복 체크
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @returns {Promise<boolean>} 존재 여부
   */
  const checkLabelNumberExists = async (labelNumber, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const bookId = createBookId(labelNumber, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)
      return bookDoc.exists()
    } catch (err) {
      console.error('라벨번호 중복 체크 오류:', err)
      throw err
    }
  }

  /**
   * 같은 ISBN을 이미 대여중인지 체크
   * @param {string} userId - 사용자 UID
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @returns {Promise<Object|null>} 대여중인 도서 정보 또는 null
   */
  const checkAlreadyRentedSameIsbn = async (userId, isbn, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const booksRef = collection(firestore, 'books')
      const q = query(
        booksRef,
        where('center', '==', center),
        where('isbn', '==', isbn),
        where('rentedBy', '==', userId)
      )
      
      const snapshot = await getDocs(q)
      
      // 대여중 또는 연체중인 도서 찾기
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data()
        if (data.status === 'rented' || calculateBookStatus(data) === 'overdue') {
          return {
            id: docSnapshot.id,
            ...data
          }
        }
      }
      
      return null
    } catch (err) {
      console.error('ISBN 대여 체크 오류:', err)
      throw err
    }
  }

  // ==================== 카테고리 관련 ====================

  /**
   * 센터별 카테고리 목록 조회
   * @param {string} center - 센터명
   * @returns {Promise<Array>} 카테고리 목록
   */
  const getCategories = async (center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      // 기본 카테고리 + 추가된 카테고리
      const categories = [...DEFAULT_CATEGORIES]
      
      const categoriesRef = collection(firestore, 'categories')
      const q = query(categoriesRef, where('center', '==', center))
      const snapshot = await getDocs(q)
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.name && !categories.includes(data.name)) {
          categories.push(data.name)
        }
      })
      
      // 가나다순 정렬
      categories.sort((a, b) => a.localeCompare(b, 'ko'))
      
      return categories
    } catch (err) {
      console.error('카테고리 목록 조회 오류:', err)
      throw err
    }
  }

  /**
   * 새 카테고리 추가
   * @param {string} center - 센터명
   * @param {string} categoryName - 카테고리명
   * @returns {Promise<Object>} 추가 결과
   */
  const addCategory = async (center, categoryName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const trimmedName = categoryName.trim()
      
      if (!trimmedName) {
        throw new Error('카테고리명을 입력해주세요.')
      }
      
      // 기본 카테고리에 있는지 확인
      if (DEFAULT_CATEGORIES.includes(trimmedName)) {
        return { success: true, message: '기본 카테고리입니다.' }
      }
      
      // 이미 추가된 카테고리인지 확인
      const categoryId = `${center}_${trimmedName}`
      const categoryRef = doc(firestore, 'categories', categoryId)
      const categoryDoc = await getDoc(categoryRef)
      
      if (categoryDoc.exists()) {
        return { success: true, message: '이미 존재하는 카테고리입니다.' }
      }
      
      // 새 카테고리 추가
      await setDoc(categoryRef, {
        center,
        name: trimmedName,
        createdAt: serverTimestamp()
      })
      
      return { success: true }
    } catch (err) {
      console.error('카테고리 추가 오류:', err)
      throw err
    }
  }

  // ==================== 도서 검색 ====================

  /**
   * 알라딘 도서 검색
   * @param {string} searchQuery - 검색어
   * @param {number} start - 시작 위치 (기본값: 1)
   * @param {number} display - 표시 개수 (기본값: 20, 최대: 200)
   * @returns {Promise<Object>} 검색 결과
   */
  const searchBooks = async (searchQuery, start = 1, display = 20) => {
    if (!firestore || !$firebaseApp) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const functions = getFunctions($firebaseApp)
      const searchAladinBooks = httpsCallable(functions, 'searchAladinBooks')

      const result = await searchAladinBooks({
        query: searchQuery,
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

  // ==================== 도서 등록 ====================

  /**
   * 라벨번호를 포함하여 도서 등록
   * @param {Object} bookData - 도서 정보 (알라딘 API 응답의 item)
   * @param {string} center - 센터명
   * @param {string} userId - 등록한 사용자 UID
   * @param {string} category - 카테고리명
   * @param {string} labelNumber - 라벨번호
   * @param {string} location - 위치 (기본값: '구매칸')
   * @returns {Promise<Object>} 등록 결과
   */
  const registerBookWithLabel = async (bookData, center, userId, category, labelNumber, location = '구매칸') => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      // ISBN 추출
      const isbn = bookData.isbn13 || bookData.isbn || ''
      
      if (!isbn) {
        throw new Error('ISBN 정보가 없습니다.')
      }

      if (!labelNumber) {
        throw new Error('라벨번호를 입력해주세요.')
      }

      if (!category) {
        throw new Error('카테고리를 선택해주세요.')
      }

      // 라벨번호 중복 체크
      const exists = await checkLabelNumberExists(labelNumber, center)
      if (exists) {
        throw new Error('이미 사용중인 라벨번호입니다.')
      }

      // 문서 ID: 라벨번호_센터
      const bookId = createBookId(labelNumber, center)
      const bookRef = doc(firestore, 'books', bookId)

      // 도서 정보 정리
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
        category: category,
        labelNumber: labelNumber,
        location: location,
        status: 'available',
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
   * 기존 호환용: ISBN 기반 도서 등록
   * @deprecated registerBookWithLabel 사용 권장
   */
  const registerBook = async (bookData, center, userId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const isbn = bookData.isbn13 || bookData.isbn || ''
      
      if (!isbn) {
        throw new Error('ISBN 정보가 없습니다.')
      }

      const bookId = createBookIdByIsbn(isbn, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (bookDoc.exists()) {
        throw new Error('이미 해당 센터에 등록된 도서입니다.')
      }

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
        status: 'available',
        registeredBy: userId,
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

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

  // ==================== 도서 조회 ====================

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

      querySnapshot.forEach((docSnapshot) => {
        books.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
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
   * ISBN 기준으로 그룹핑된 도서 목록 조회
   * @param {string} center - 센터명
   * @returns {Promise<Array>} 그룹핑된 도서 목록
   */
  const getGroupedBooks = async (center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const books = await getBooksByCenter(center)
      
      // ISBN 기준 그룹핑
      const groupMap = new Map()
      
      for (const book of books) {
        const isbn = book.isbn13 || book.isbn || book.id
        
        if (!groupMap.has(isbn)) {
          groupMap.set(isbn, {
            isbn,
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            image: book.image,
            copies: [],
            totalCount: 0,
            availableCount: 0,
            locations: []
          })
        }
        
        const group = groupMap.get(isbn)
        group.copies.push(book)
        group.totalCount++
        
        // 대여 가능한 도서 카운트
        const status = calculateBookStatus(book)
        if (!status || status === 'available') {
          group.availableCount++
          if (book.location && !group.locations.includes(book.location)) {
            group.locations.push(book.location)
          }
        }
      }
      
      // Map을 배열로 변환하고 등록일 기준 정렬
      const groupedBooks = Array.from(groupMap.values())
      groupedBooks.sort((a, b) => {
        // 첫 번째 도서의 등록일 기준
        const dateA = a.copies[0]?.registeredAt?.toDate?.() || new Date(0)
        const dateB = b.copies[0]?.registeredAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
      
      return groupedBooks
    } catch (err) {
      console.error('그룹핑된 도서 목록 조회 오류:', err)
      error.value = err.message || '도서 목록 조회에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 같은 ISBN의 도서 목록 조회
   * @param {string} isbn - ISBN
   * @param {string} center - 센터명
   * @returns {Promise<Array>} 도서 목록 (복사본들)
   */
  const getBookCopies = async (isbn, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const booksRef = collection(firestore, 'books')
      const q = query(
        booksRef,
        where('center', '==', center),
        where('isbn', '==', isbn)
      )
      
      const snapshot = await getDocs(q)
      const copies = []
      
      snapshot.forEach((docSnapshot) => {
        copies.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        })
      })
      
      // 라벨번호 기준 정렬
      copies.sort((a, b) => {
        const labelA = a.labelNumber || ''
        const labelB = b.labelNumber || ''
        return labelA.localeCompare(labelB, 'ko')
      })
      
      return copies
    } catch (err) {
      console.error('도서 복사본 조회 오류:', err)
      throw err
    }
  }

  // ==================== 도서 대여/반납 ====================

  /**
   * 도서 대여 처리 (라벨번호 기준)
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @param {string} userId - 대여한 사용자 UID
   * @param {string} isbn - ISBN (ISBN 중복 대여 체크용)
   * @returns {Promise<Object>} 대여 결과
   */
  const rentBook = async (labelNumber, center, userId, isbn = null) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(labelNumber, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      
      // ISBN 중복 대여 체크
      const bookIsbn = isbn || bookData.isbn
      if (bookIsbn) {
        const alreadyRented = await checkAlreadyRentedSameIsbn(userId, bookIsbn, center)
        if (alreadyRented) {
          throw new Error(`이미 같은 도서를 대여중입니다. (라벨번호: ${alreadyRented.labelNumber || alreadyRented.id})`)
        }
      }
      
      // 대여 가능 여부 확인
      if (bookData.status === 'rented' && bookData.rentedBy) {
        throw new Error('이미 대여 중인 도서입니다.')
      }
      if (bookData.status === 'requested' && bookData.requestedBy && bookData.requestedBy !== userId) {
        throw new Error('다른 사용자가 대여 신청한 도서입니다.')
      }

      // 대여일로부터 일주일 후 반납 예정일 계산
      const rentedAt = new Date()
      const expectedReturnDate = new Date(rentedAt)
      expectedReturnDate.setDate(expectedReturnDate.getDate() + 7)

      await updateDoc(bookRef, {
        status: 'rented',
        rentedBy: userId,
        rentedAt: serverTimestamp(),
        expectedReturnDate: expectedReturnDate,
        requestedBy: deleteField(),
        requestedAt: deleteField(),
        updatedAt: serverTimestamp()
      })

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
   * 도서 대여 신청 (라벨번호 기준)
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @param {string} userId - 신청한 사용자 UID
   * @param {string} isbn - ISBN (ISBN 중복 대여 체크용)
   * @returns {Promise<Object>} 신청 결과
   */
  const requestRent = async (labelNumber, center, userId, isbn = null) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(labelNumber, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      
      // ISBN 중복 대여 체크
      const bookIsbn = isbn || bookData.isbn
      if (bookIsbn) {
        const alreadyRented = await checkAlreadyRentedSameIsbn(userId, bookIsbn, center)
        if (alreadyRented) {
          throw new Error(`이미 같은 도서를 대여중입니다. (라벨번호: ${alreadyRented.labelNumber || alreadyRented.id})`)
        }
      }
      
      // 신청 가능 여부 확인
      if (bookData.status === 'rented' && bookData.rentedBy) {
        throw new Error('이미 대여 중인 도서입니다.')
      }
      if (bookData.status === 'requested' && bookData.requestedBy) {
        throw new Error('이미 대여 신청된 도서입니다.')
      }

      await updateDoc(bookRef, {
        status: 'requested',
        requestedBy: userId,
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

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
   * 도서 대여 신청 취소
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @param {string} userId - 취소하는 사용자 UID
   * @returns {Promise<Object>} 취소 결과
   */
  const cancelRentRequest = async (labelNumber, center, userId) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(labelNumber, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      
      // 본인이 신청한 건지 확인
      if (bookData.status !== 'requested' || bookData.requestedBy !== userId) {
        throw new Error('취소할 수 있는 대여 신청이 아닙니다.')
      }

      await updateDoc(bookRef, {
        status: 'available',
        requestedBy: deleteField(),
        requestedAt: deleteField(),
        updatedAt: serverTimestamp()
      })

      return {
        success: true
      }
    } catch (err) {
      console.error('대여 신청 취소 오류:', err)
      error.value = err.message || '대여 신청 취소에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 반납 처리 (라벨번호 기준)
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @returns {Promise<Object>} 반납 결과
   */
  const returnBook = async (labelNumber, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(labelNumber, center)
      const bookRef = doc(firestore, 'books', bookId)
      const bookDoc = await getDoc(bookRef)

      if (!bookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const bookData = bookDoc.data()
      if (bookData.status !== 'rented') {
        throw new Error('대여 중이 아닌 도서입니다.')
      }

      await updateDoc(bookRef, {
        status: 'available',
        rentedBy: deleteField(),
        rentedAt: deleteField(),
        expectedReturnDate: deleteField(),
        returnedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

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

  // ==================== 도서 수정/삭제 ====================

  /**
   * 도서 정보 수정
   * @param {string} oldLabelNumber - 기존 라벨번호
   * @param {string} center - 센터명
   * @param {Object} newData - 수정할 데이터 { category, labelNumber, location }
   * @returns {Promise<Object>} 수정 결과
   */
  const updateBookInfo = async (oldLabelNumber, center, newData) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const oldBookId = createBookId(oldLabelNumber, center)
      const oldBookRef = doc(firestore, 'books', oldBookId)
      const oldBookDoc = await getDoc(oldBookRef)

      if (!oldBookDoc.exists()) {
        throw new Error('도서를 찾을 수 없습니다.')
      }

      const oldBookData = oldBookDoc.data()
      const newLabelNumber = newData.labelNumber || oldLabelNumber

      // 라벨번호가 변경되었는지 확인
      if (newLabelNumber !== oldLabelNumber) {
        // 새 라벨번호 중복 체크
        const exists = await checkLabelNumberExists(newLabelNumber, center)
        if (exists) {
          throw new Error('이미 사용중인 라벨번호입니다.')
        }

        // 새 문서 생성
        const newBookId = createBookId(newLabelNumber, center)
        const newBookRef = doc(firestore, 'books', newBookId)
        
        const updatedBookInfo = {
          ...oldBookData,
          category: newData.category || oldBookData.category,
          labelNumber: newLabelNumber,
          location: newData.location || oldBookData.location,
          updatedAt: serverTimestamp()
        }

        await setDoc(newBookRef, updatedBookInfo)
        
        // 기존 문서 삭제
        await deleteDoc(oldBookRef)

        return {
          success: true,
          newBookId
        }
      } else {
        // 라벨번호 변경 없이 다른 정보만 수정
        const updateData = {
          updatedAt: serverTimestamp()
        }
        
        if (newData.category) updateData.category = newData.category
        if (newData.location) updateData.location = newData.location

        await updateDoc(oldBookRef, updateData)

        return {
          success: true
        }
      }
    } catch (err) {
      console.error('도서 정보 수정 오류:', err)
      error.value = err.message || '도서 정보 수정에 실패했습니다.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 도서 삭제 처리 (라벨번호 기준)
   * @param {string} labelNumber - 라벨번호
   * @param {string} center - 센터명
   * @returns {Promise<Object>} 삭제 결과
   */
  const deleteBook = async (labelNumber, center) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      loading.value = true
      error.value = null

      const bookId = createBookId(labelNumber, center)
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

  // ==================== 상태 계산 ====================

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
    // 문서 ID
    createBookId,
    createBookIdByIsbn,
    // 라벨번호
    checkLabelNumberExists,
    checkAlreadyRentedSameIsbn,
    // 카테고리
    getCategories,
    addCategory,
    // 검색
    searchBooks,
    getBestsellers,
    // 등록
    registerBook,
    registerBookWithLabel,
    // 조회
    getBooksByCenter,
    getGroupedBooks,
    getBookCopies,
    // 대여/반납
    rentBook,
    requestRent,
    cancelRentRequest,
    returnBook,
    // 수정/삭제
    updateBookInfo,
    deleteBook,
    // 상태
    calculateBookStatus
  }
}
