/**
 * 사이트 공지 팝업 (Firestore `popups` + Storage `popups/`)
 */

export const POPUP_MAX_FILE_BYTES = 2 * 1024 * 1024
export const POPUP_MAX_IMAGE_DIMENSION = 1920

/**
 * 팝업 이미지 URL 선택 (모바일/데스크탑 분리 지원 + 레거시 호환)
 * @param {any} popup
 * @param {boolean} isMobile
 * @returns {string}
 */
export const pickPopupImageUrl = (popup, isMobile) => {
  if (!popup) {
    return ''
  }
  const desktop = popup.imageUrlDesktop || popup.desktopImageUrl || ''
  const mobile = popup.imageUrlMobile || popup.mobileImageUrl || ''
  const legacy = popup.imageUrl || ''
  if (isMobile) {
    return mobile || desktop || legacy
  }
  return desktop || mobile || legacy
}

/**
 * 관리 화면 텍스트 인풋용: HTML/스크립트 삽입에 쓰이는 문자 제거
 * @param {unknown} raw
 * @returns {string}
 */
export const sanitizePopupAdminString = (raw) => {
  if (raw == null || typeof raw !== 'string') {
    return ''
  }
  return raw.replace(/[<>]/g, '').replace(/\0/g, '')
}

/**
 * 저장·표시용 링크: http(s)만 허용, 위험 스킴·꺾쇠 제거
 * @param {unknown} raw
 * @returns {string} 빈 문자열이면 링크 없음
 */
export const sanitizePopupLinkUrl = (raw) => {
  const t = sanitizePopupAdminString(typeof raw === 'string' ? raw.trim() : '')
  if (!t) {
    return ''
  }
  const lower = t.toLowerCase()
  if (
    lower.startsWith('javascript:')
    || lower.startsWith('data:')
    || lower.startsWith('vbscript:')
  ) {
    return ''
  }
  if (!/^https?:\/\//i.test(t)) {
    return ''
  }
  try {
    const u = new URL(t)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return ''
    }
    return u.href
  } catch {
    return ''
  }
}

export const usePopups = () => {
  const { $firebaseFirestore: firestore, $firebaseStorage: storage } = useNuxtApp()

  /**
   * @param {File} file
   * @returns {Promise<{ width: number, height: number }>}
   */
  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('이미지를 읽을 수 없습니다.'))
      }
      img.src = url
    })
  }

  /**
   * @param {File} file
   */
  const validatePopupImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드할 수 있습니다.')
    }
    if (file.size > POPUP_MAX_FILE_BYTES) {
      throw new Error(`파일 크기는 ${POPUP_MAX_FILE_BYTES / (1024 * 1024)}MB 이하여야 합니다.`)
    }
    const { width, height } = await getImageDimensions(file)
    if (width > POPUP_MAX_IMAGE_DIMENSION || height > POPUP_MAX_IMAGE_DIMENSION) {
      throw new Error(`이미지 가로·세로는 각각 ${POPUP_MAX_IMAGE_DIMENSION}px 이하여야 합니다.`)
    }
  }

  /**
   * @param {File} file
   * @returns {Promise<{ imageUrl: string, storagePath: string }>}
   */
  const uploadPopupImage = async (file) => {
    if (!storage) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }
    await validatePopupImageFile(file)

    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
    const safeName = file.name.replace(/[^\w.-]+/g, '_')
    const fileName = `${Date.now()}_${safeName}`
    const storagePath = `popups/${fileName}`
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, file)
    const imageUrl = await getDownloadURL(storageRef)
    return { imageUrl, storagePath }
  }

  /**
   * @returns {Promise<Array>}
   */
  const listPopups = async () => {
    if (!firestore) {
      return []
    }
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore')
    const q = query(
      collection(firestore, 'popups'),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  /**
   * 현재 시각 기준 노출 가능한 팝업 1건 (enabled, 기간 내, startAt 최신 우선)
   * @returns {Promise<Object|null>}
   */
  const getActivePopupForNow = async () => {
    if (!firestore) {
      return null
    }
    const list = await listPopups()
    const now = Date.now()
    const inWindow = list.filter((p) => {
      if (!p.enabled) {
        return false
      }
      const start = p.startAt?.toMillis?.() ?? 0
      if (start > now) {
        return false
      }
      // endAt 없음 = 종료일 미정 → 시작 후 계속 노출 후보
      const endMs = p.endAt?.toMillis?.()
      if (endMs == null) {
        return true
      }
      return endMs >= now
    })
    inWindow.sort((a, b) => (b.startAt?.toMillis?.() ?? 0) - (a.startAt?.toMillis?.() ?? 0))
    return inWindow[0] || null
  }

  /**
   * @param {Object} payload
   * @param {string} [payload.imageUrl] 레거시 호환(미사용 권장)
   * @param {string} [payload.storagePath] 레거시 호환(미사용 권장)
   * @param {string} [payload.imageUrlDesktop]
   * @param {string} [payload.storagePathDesktop]
   * @param {string} [payload.imageUrlMobile]
   * @param {string} [payload.storagePathMobile]
   * @param {import('firebase/firestore').Timestamp} payload.startAt
   * @param {import('firebase/firestore').Timestamp | null} [payload.endAt] null이면 종료일 미정
   * @param {boolean} [payload.enabled]
   * @param {string} [payload.linkUrl]
   */
  const createPopup = async (payload) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    const imageUrlDesktop = payload.imageUrlDesktop || null
    const storagePathDesktop = payload.storagePathDesktop || null
    const imageUrlMobile = payload.imageUrlMobile || null
    const storagePathMobile = payload.storagePathMobile || null
    const legacyImageUrl = payload.imageUrl || imageUrlDesktop || imageUrlMobile || null
    const legacyStoragePath = payload.storagePath || storagePathDesktop || storagePathMobile || null
    const docRef = await addDoc(collection(firestore, 'popups'), {
      imageUrl: legacyImageUrl,
      storagePath: legacyStoragePath,
      imageUrlDesktop,
      storagePathDesktop,
      imageUrlMobile,
      storagePathMobile,
      startAt: payload.startAt,
      endAt: payload.endAt ?? null,
      enabled: payload.enabled !== false,
      linkUrl: sanitizePopupLinkUrl(payload.linkUrl) || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  }

  /**
   * @param {string} id
   * @param {Object} patch
   */
  const updatePopup = async (id, patch) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    const ref = doc(firestore, 'popups', id)
    const data = { updatedAt: serverTimestamp() }
    if ('enabled' in patch) {
      data.enabled = patch.enabled
    }
    if ('startAt' in patch) {
      data.startAt = patch.startAt
    }
    if ('endAt' in patch) {
      data.endAt = patch.endAt
    }
    if ('linkUrl' in patch) {
      data.linkUrl = sanitizePopupLinkUrl(patch.linkUrl) || null
    }
    if ('imageUrl' in patch) {
      data.imageUrl = patch.imageUrl
    }
    if ('storagePath' in patch) {
      data.storagePath = patch.storagePath
    }
    if ('imageUrlDesktop' in patch) {
      data.imageUrlDesktop = patch.imageUrlDesktop
    }
    if ('storagePathDesktop' in patch) {
      data.storagePathDesktop = patch.storagePathDesktop
    }
    if ('imageUrlMobile' in patch) {
      data.imageUrlMobile = patch.imageUrlMobile
    }
    if ('storagePathMobile' in patch) {
      data.storagePathMobile = patch.storagePathMobile
    }
    await updateDoc(ref, data)
  }

  /**
   * @param {string} id
   * @param {string | Array<string> | { desktop?: string, mobile?: string, legacy?: string }} storagePath
   */
  const deletePopup = async (id, storagePath) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(firestore, 'popups', id))
    if (storage && storagePath) {
      const paths = Array.isArray(storagePath)
        ? storagePath
        : (typeof storagePath === 'string'
            ? [storagePath]
            : [storagePath.desktop, storagePath.mobile, storagePath.legacy].filter(Boolean)
          )
      if (paths.length) {
        try {
          const { ref, deleteObject } = await import('firebase/storage')
          await Promise.all(paths.map((p) => deleteObject(ref(storage, p)).catch((e) => {
            console.warn('팝업 Storage 삭제 실패:', p, e)
          })))
        } catch (e) {
          console.warn('팝업 Storage 삭제 실패:', e)
        }
      }
    }
  }

  return {
    pickPopupImageUrl,
    validatePopupImageFile,
    uploadPopupImage,
    listPopups,
    getActivePopupForNow,
    createPopup,
    updatePopup,
    deletePopup
  }
}
