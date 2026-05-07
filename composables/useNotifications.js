/**
 * 알림 관련 Composable
 * - 실시간 알림 구독
 * - 읽지 않은 알림 개수
 * - 알림 읽음 처리
 * - 알림 목록 조회
 */

// 함수 참조는 직렬화 불가하므로 모듈 레벨에 유지
let globalUnsubscribe = null

export const useNotifications = () => {
  const { $firebaseFirestore } = useNuxtApp()
  const { user } = useAuth()
  const firestore = $firebaseFirestore

  // useState로 전역 상태 관리 (Nuxt 권장 방식)
  const notifications = useState('notifications', () => [])
  const unreadCount = useState('unreadCount', () => 0)
  const loading = useState('notificationsLoading', () => false)
  const error = useState('notificationsError', () => null)
  const isSubscribed = useState('notificationsSubscribed', () => false)

  /**
   * 실시간 알림 구독 시작
   */
  const subscribeToNotifications = async () => {
    if (!user.value || !firestore) {
      notifications.value = []
      unreadCount.value = 0
      return
    }

    // 이미 구독 중이면 스킵
    if (isSubscribed.value) return

    try {
      const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore')
      
      const notificationsRef = collection(firestore, 'notifications')
      const q = query(
        notificationsRef,
        where('userId', '==', user.value.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

      globalUnsubscribe = onSnapshot(q, (snapshot) => {
        const items = []
        snapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data()
          })
        })
        notifications.value = items
        unreadCount.value = items.filter(n => !n.isRead).length
      }, (err) => {
        console.error('알림 구독 오류:', err)
        error.value = err.message
      })
      
      isSubscribed.value = true
    } catch (err) {
      console.error('알림 구독 시작 오류:', err)
      error.value = err.message
    }
  }

  /**
   * 실시간 구독 해제
   */
  const unsubscribeFromNotifications = () => {
    if (globalUnsubscribe) {
      globalUnsubscribe()
      globalUnsubscribe = null
      isSubscribed.value = false
    }
  }

  /**
   * 알림 읽음 처리
   */
  const markAsRead = async (notificationId) => {
    if (!firestore) return

    try {
      const { doc, updateDoc } = await import('firebase/firestore')
      const notificationRef = doc(firestore, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        isRead: true
      })
    } catch (err) {
      console.error('알림 읽음 처리 오류:', err)
      error.value = err.message
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  const markAllAsRead = async () => {
    if (!firestore || !user.value) return

    try {
      const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore')
      
      const notificationsRef = collection(firestore, 'notifications')
      // NOTE:
      // 기존 데이터 중에는 isRead 필드가 없는 문서가 있어도 "미읽음"으로 표시됩니다.
      // Firestore where('isRead','==',false)는 isRead가 '없는' 문서를 매칭하지 못하므로
      // 사용자 알림을 전부 가져온 뒤 isRead !== true 인 것들을 배치 업데이트합니다.
      const q = query(notificationsRef, where('userId', '==', user.value.uid))
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        unreadCount.value = 0
        return
      }
      
      const batch = writeBatch(firestore)
      let updatedCount = 0
      const unreadIds = new Set()

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        // isRead가 명시적으로 true가 아닌 경우는 모두 미읽음 취급
        if (data?.isRead !== true) {
          batch.update(docSnapshot.ref, { isRead: true })
          updatedCount += 1
          unreadIds.add(docSnapshot.id)
        }
      })

      if (updatedCount === 0) {
        unreadCount.value = 0
        return
      }
      
      // UI 즉시 반영 (스냅샷 업데이트를 기다리지 않도록)
      if (notifications.value?.length) {
        notifications.value = notifications.value.map((n) => (
          unreadIds.has(n.id) ? { ...n, isRead: true } : n
        ))
      }
      unreadCount.value = 0
      
      await batch.commit()
    } catch (err) {
      console.error('모든 알림 읽음 처리 오류:', err)
      error.value = err.message
    }
  }

  /**
   * 알림 삭제
   */
  const deleteNotification = async (notificationId) => {
    if (!firestore) return

    try {
      const { doc, deleteDoc } = await import('firebase/firestore')
      const notificationRef = doc(firestore, 'notifications', notificationId)
      await deleteDoc(notificationRef)
    } catch (err) {
      console.error('알림 삭제 오류:', err)
      error.value = err.message
    }
  }

  /**
   * 알림 목록 조회 (페이지네이션)
   */
  const getNotifications = async (limitCount = 20, startAfterDoc = null) => {
    if (!firestore || !user.value) {
      return { items: [], lastDoc: null }
    }

    try {
      loading.value = true
      const { collection, query, where, orderBy, limit, getDocs, startAfter } = await import('firebase/firestore')
      
      const notificationsRef = collection(firestore, 'notifications')
      let q = query(
        notificationsRef,
        where('userId', '==', user.value.uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      if (startAfterDoc) {
        q = query(
          notificationsRef,
          where('userId', '==', user.value.uid),
          orderBy('createdAt', 'desc'),
          startAfter(startAfterDoc),
          limit(limitCount)
        )
      }
      
      const snapshot = await getDocs(q)
      const items = []
      let lastDoc = null
      
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        })
        lastDoc = doc
      })
      
      return { items, lastDoc }
    } catch (err) {
      console.error('알림 목록 조회 오류:', err)
      error.value = err.message
      return { items: [], lastDoc: null }
    } finally {
      loading.value = false
    }
  }

  /**
   * 알림 타입별 아이콘 반환
   */
  const getNotificationIcon = (type) => {
    const iconMap = {
      return_reminder: 'mdi-calendar-clock',
      overdue: 'mdi-alert-circle',
      overdue_admin: 'mdi-alert-circle',
      book_registered: 'mdi-book-check',
      book_request: 'mdi-book-plus',
      rent_request: 'mdi-book-arrow-right',
      book_available: 'mdi-book-check'
    }
    return iconMap[type] || 'mdi-bell'
  }

  /**
   * 알림 타입별 색상 반환
   */
  const getNotificationColor = (type) => {
    const colorMap = {
      return_reminder: 'warning',
      overdue: 'error',
      overdue_admin: 'error',
      book_registered: 'success',
      book_request: 'info',
      rent_request: 'info',
      book_available: 'success'
    }
    return colorMap[type] || 'primary'
  }

  /**
   * 알림 시간 포맷
   */
  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return ''
    
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    })
  }

  // 컴포넌트 마운트 시 구독 시작
  onMounted(() => {
    if (user.value) {
      subscribeToNotifications()
    }
  })

  // 사용자 변경 시 구독 재시작
  watch(user, (newUser) => {
    unsubscribeFromNotifications()
    if (newUser) {
      subscribeToNotifications()
    } else {
      notifications.value = []
      unreadCount.value = 0
    }
  })

  // 컴포넌트 언마운트 시 구독 해제
  onUnmounted(() => {
    unsubscribeFromNotifications()
  })

  return {
    notifications,
    unreadCount,
    loading,
    error,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotifications,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime
  }
}
