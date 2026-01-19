/**
 * 반납 알림 구독 관련 컴포저블
 * - 반납 알림 구독 목록 로드
 * - 반납 알림 구독/취소
 * - 내가 대여중인 ISBN 목록 관리
 */

import { ref } from 'vue'

export const useReturnNotify = () => {
  const { $firebaseFirestore: firestore } = useNuxtApp()
  const { user } = useAuth()
  const { alert } = useDialog()
  
  // 상태
  const returnNotifySubscriptions = ref([]) // 내가 구독중인 ISBN 목록
  const returnNotifyLoadingIsbn = ref(null)
  const myRentedIsbns = ref([]) // 내가 대여중인 ISBN 목록

  /**
   * 반납 알림 구독 목록 로드
   * @param {string} center - 센터명
   */
  const loadReturnNotifySubscriptions = async (center) => {
    if (!user.value || !firestore || !center) {
      returnNotifySubscriptions.value = []
      return
    }

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const subscriptionsRef = collection(firestore, 'returnNotifySubscriptions')
      const q = query(
        subscriptionsRef,
        where('userId', '==', user.value.uid),
        where('center', '==', center),
        where('notified', '==', false)
      )
      
      const snapshot = await getDocs(q)
      const subscriptions = []
      snapshot.forEach(doc => {
        subscriptions.push(doc.data().isbn)
      })
      returnNotifySubscriptions.value = subscriptions
    } catch (error) {
      console.error('반납 알림 구독 목록 로드 오류:', error)
      returnNotifySubscriptions.value = []
    }
  }

  /**
   * 특정 ISBN이 구독중인지 확인
   * @param {string} isbn - ISBN
   * @returns {boolean}
   */
  const isSubscribedToBook = (isbn) => {
    return returnNotifySubscriptions.value.includes(isbn)
  }

  /**
   * 특정 ISBN이 내가 대여중인지 확인
   * @param {string} isbn - ISBN
   * @returns {boolean}
   */
  const isMyRentedIsbn = (isbn) => {
    return myRentedIsbns.value.includes(isbn)
  }

  /**
   * 반납 알림 구독
   * @param {Object} book - 도서 정보 (isbn, isbn13, title 필요)
   * @param {string} center - 센터명
   */
  const subscribeReturnNotify = async (book, center) => {
    if (!user.value || !firestore || !book || !center) return

    try {
      const isbn = book.isbn13 || book.isbn
      returnNotifyLoadingIsbn.value = isbn
      
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const subscriptionsRef = collection(firestore, 'returnNotifySubscriptions')
      
      await addDoc(subscriptionsRef, {
        userId: user.value.uid,
        userEmail: user.value.email,
        isbn: isbn,
        title: book.title,
        center: center,
        notified: false,
        createdAt: serverTimestamp()
      })
      
      // 로컬 상태 업데이트
      returnNotifySubscriptions.value.push(isbn)
      
      await alert('반납 알림이 신청되었습니다.\n도서가 반납되면 알림을 받으실 수 있습니다.', { type: 'success' })
    } catch (error) {
      console.error('반납 알림 구독 오류:', error)
      await alert('반납 알림 신청에 실패했습니다.', { type: 'error' })
    } finally {
      returnNotifyLoadingIsbn.value = null
    }
  }

  /**
   * 내가 대여중인 도서 ISBN 목록 로드
   */
  const loadMyRentedIsbns = async () => {
    if (!user.value || !firestore) {
      myRentedIsbns.value = []
      return
    }

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const booksRef = collection(firestore, 'books')
      const q = query(
        booksRef,
        where('rentedBy', '==', user.value.uid)
      )
      
      const snapshot = await getDocs(q)
      const isbns = []
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.status === 'rented' || data.status === 'overdue') {
          const isbn = data.isbn13 || data.isbn
          if (isbn) {
            isbns.push(isbn)
          }
        }
      })
      myRentedIsbns.value = isbns
    } catch (error) {
      console.error('대여중인 도서 ISBN 로드 오류:', error)
      myRentedIsbns.value = []
    }
  }

  return {
    // 상태
    returnNotifySubscriptions,
    returnNotifyLoadingIsbn,
    myRentedIsbns,
    // 함수
    loadReturnNotifySubscriptions,
    isSubscribedToBook,
    isMyRentedIsbn,
    subscribeReturnNotify,
    loadMyRentedIsbns
  }
}
