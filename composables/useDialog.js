/**
 * 전역 다이얼로그 Composable
 * - confirm/alert 대체
 * - Vuetify v-dialog 기반
 */

export const useDialog = () => {
  const isConfirmOpen = useState('dialogConfirmOpen', () => false)
  const isAlertOpen = useState('dialogAlertOpen', () => false)
  const dialogConfig = useState('dialogConfig', () => ({
    message: '',
    title: '',
    confirmText: '확인',
    cancelText: '취소',
    type: 'info',
    resolve: null
  }))

  /**
   * 확인 다이얼로그 표시
   * @param {string} message - 메시지
   * @param {Object} options - 옵션 (title, confirmText, cancelText, type)
   * @returns {Promise<boolean>} - 확인: true, 취소: false
   */
  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      dialogConfig.value = {
        message,
        title: options.title || '확인',
        confirmText: options.confirmText || '확인',
        cancelText: options.cancelText || '취소',
        type: options.type || 'confirm',
        resolve
      }
      isConfirmOpen.value = true
    })
  }

  /**
   * 알림 다이얼로그 표시
   * @param {string} message - 메시지
   * @param {Object} options - 옵션 (title, confirmText, type)
   * @returns {Promise<void>}
   */
  const alert = (message, options = {}) => {
    return new Promise((resolve) => {
      dialogConfig.value = {
        message,
        title: options.title || '알림',
        confirmText: options.confirmText || '확인',
        cancelText: '',
        type: options.type || 'alert',
        resolve
      }
      isAlertOpen.value = true
    })
  }

  /**
   * 확인 다이얼로그 닫기 (확인)
   */
  const handleConfirm = () => {
    if (dialogConfig.value.resolve) {
      dialogConfig.value.resolve(true)
    }
    isConfirmOpen.value = false
    isAlertOpen.value = false
  }

  /**
   * 확인 다이얼로그 닫기 (취소)
   */
  const handleCancel = () => {
    if (dialogConfig.value.resolve) {
      dialogConfig.value.resolve(false)
    }
    isConfirmOpen.value = false
  }

  /**
   * 알림 다이얼로그 닫기
   */
  const handleAlertClose = () => {
    if (dialogConfig.value.resolve) {
      dialogConfig.value.resolve()
    }
    isAlertOpen.value = false
  }

  return {
    isConfirmOpen,
    isAlertOpen,
    dialogConfig,
    confirm,
    alert,
    handleConfirm,
    handleCancel,
    handleAlertClose
  }
}

