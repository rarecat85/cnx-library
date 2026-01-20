/**
 * 설정 관리 컴포저블
 * - 카테고리 설정 (센터별 독립 관리)
 * - 서가 이미지 관리
 * - 칸-이미지 매핑 관리
 */

import { ref } from 'vue'
import { CENTERS } from '@/utils/centerMapping'

export const useSettings = () => {
  const { $firebaseFirestore: firestore, $firebaseStorage: storage } = useNuxtApp()
  
  const loading = ref(false)
  const error = ref(null)

  // ==================== 카테고리 설정 (센터별 독립 관리) ====================

  /**
   * 카테고리 설정 로드 (전체)
   * @returns {Promise<Object>} { "강남센터": ["카테고리1", ...], "용산센터": ["카테고리1", ...] }
   */
  const loadCategorySettings = async () => {
    if (!firestore) {
      console.warn('Firebase가 초기화되지 않았습니다.')
      return {}
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'categories')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        // updatedAt 필드 제외
        const { updatedAt, ...categories } = data
        return categories
      }

      return {}
    } catch (err) {
      console.error('카테고리 설정 로드 오류:', err)
      throw err
    }
  }

  /**
   * 카테고리 설정 저장 (전체)
   * @param {Object} settings - { "강남센터": ["카테고리1", ...], ... }
   */
  const saveCategorySettings = async (settings) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'categories')
      
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('카테고리 설정 저장 오류:', err)
      throw err
    }
  }

  /**
   * 특정 센터의 카테고리 목록 로드
   * @param {string} center - 센터명
   * @returns {Promise<Array>} 카테고리 목록 ["카테고리1", "카테고리2", ...]
   */
  const loadCategoriesByCenter = async (center) => {
    if (!firestore) {
      return []
    }

    try {
      const settings = await loadCategorySettings()
      const categories = settings[center] || []
      
      // 가나다순 정렬
      return [...categories].sort((a, b) => a.localeCompare(b, 'ko'))
    } catch (err) {
      console.error('카테고리 로드 오류:', err)
      return []
    }
  }

  /**
   * 카테고리 추가 (특정 센터)
   * @param {string} center - 센터명
   * @param {string} categoryName - 카테고리명
   */
  const addCategory = async (center, categoryName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    const trimmedName = categoryName.trim()
    if (!trimmedName) {
      throw new Error('카테고리명을 입력해주세요.')
    }

    try {
      const settings = await loadCategorySettings()
      settings[center] = settings[center] || []
      
      // 이미 존재하는 카테고리인지 확인
      if (settings[center].includes(trimmedName)) {
        throw new Error('이미 존재하는 카테고리입니다.')
      }

      // 카테고리 추가
      settings[center].push(trimmedName)
      await saveCategorySettings(settings)

      return { success: true }
    } catch (err) {
      console.error('카테고리 추가 오류:', err)
      throw err
    }
  }

  /**
   * 카테고리명 수정 (도서 라벨번호 일괄 수정 포함)
   * @param {string} center - 센터명
   * @param {string} oldName - 기존 카테고리명
   * @param {string} newName - 새 카테고리명
   */
  const updateCategoryName = async (center, oldName, newName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    const trimmedNewName = newName.trim()
    if (!trimmedNewName) {
      throw new Error('새 카테고리명을 입력해주세요.')
    }

    if (trimmedNewName === oldName) {
      return { success: true, updatedCount: 0 }
    }

    try {
      const { collection, getDocs, doc, writeBatch } = await import('firebase/firestore')

      // 1. 해당 센터의 해당 카테고리로 등록된 도서 조회
      const booksRef = collection(firestore, 'books')
      const snapshot = await getDocs(booksRef)

      const booksToUpdate = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.center === center && data.labelNumber && data.labelNumber.startsWith(`${oldName}_`)) {
          booksToUpdate.push({
            id: docSnap.id,
            oldLabelNumber: data.labelNumber,
            newLabelNumber: data.labelNumber.replace(`${oldName}_`, `${trimmedNewName}_`)
          })
        }
      })

      // 2. 도서 라벨번호 일괄 수정
      const batch = writeBatch(firestore)
      for (const book of booksToUpdate) {
        const bookRef = doc(firestore, 'books', book.id)
        batch.update(bookRef, {
          labelNumber: book.newLabelNumber,
          category: trimmedNewName
        })
      }
      await batch.commit()

      // 3. settings/categories 업데이트
      const settings = await loadCategorySettings()
      if (settings[center]) {
        const index = settings[center].indexOf(oldName)
        if (index !== -1) {
          settings[center][index] = trimmedNewName
          await saveCategorySettings(settings)
        }
      }

      return { success: true, updatedCount: booksToUpdate.length }
    } catch (err) {
      console.error('카테고리명 수정 오류:', err)
      throw err
    }
  }

  /**
   * 카테고리 삭제 (특정 센터)
   * @param {string} center - 센터명
   * @param {string} categoryName - 카테고리명
   */
  const deleteCategory = async (center, categoryName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { collection, getDocs } = await import('firebase/firestore')

      // 해당 센터의 해당 카테고리에 등록된 도서가 있는지 확인
      const booksRef = collection(firestore, 'books')
      const snapshot = await getDocs(booksRef)

      let hasBooks = false
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.center === center && data.labelNumber && data.labelNumber.startsWith(`${categoryName}_`)) {
          hasBooks = true
        }
      })

      if (hasBooks) {
        throw new Error('해당 카테고리에 등록된 도서가 있어 삭제할 수 없습니다.')
      }

      // settings/categories에서 삭제
      const settings = await loadCategorySettings()
      if (settings[center]) {
        const index = settings[center].indexOf(categoryName)
        if (index !== -1) {
          settings[center].splice(index, 1)
          await saveCategorySettings(settings)
        }
      }

      return { success: true }
    } catch (err) {
      console.error('카테고리 삭제 오류:', err)
      throw err
    }
  }

  /**
   * 다중 카테고리 삭제 (특정 센터)
   * @param {string} center - 센터명
   * @param {Array<string>} categoryNames - 삭제할 카테고리명 배열
   * @returns {Promise<Object>} { deleted: [], failed: [{ name, reason }] }
   */
  const deleteCategories = async (center, categoryNames) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    const deleted = []
    const failed = []

    try {
      const { collection, getDocs } = await import('firebase/firestore')

      // 모든 도서 조회 (한 번만)
      const booksRef = collection(firestore, 'books')
      const snapshot = await getDocs(booksRef)

      // 카테고리별 도서 존재 여부 확인
      const categoryHasBooks = {}
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.center === center && data.labelNumber) {
          for (const catName of categoryNames) {
            if (data.labelNumber.startsWith(`${catName}_`)) {
              categoryHasBooks[catName] = true
            }
          }
        }
      })

      // 삭제 가능 / 불가 분류
      for (const catName of categoryNames) {
        if (categoryHasBooks[catName]) {
          failed.push({ name: catName, reason: '도서가 등록되어 있습니다.' })
        } else {
          deleted.push(catName)
        }
      }

      // 삭제 가능한 카테고리만 settings에서 제거
      if (deleted.length > 0) {
        const settings = await loadCategorySettings()
        if (settings[center]) {
          settings[center] = settings[center].filter(cat => !deleted.includes(cat))
          await saveCategorySettings(settings)
        }
      }

      return { deleted, failed }
    } catch (err) {
      console.error('다중 카테고리 삭제 오류:', err)
      throw err
    }
  }

  /**
   * 특정 센터의 특정 카테고리에 등록된 도서 수 조회
   * @param {string} center - 센터명
   * @param {string} categoryName - 카테고리명
   * @returns {Promise<number>} 도서 수
   */
  const getBookCountByCategory = async (center, categoryName) => {
    if (!firestore) {
      return 0
    }

    try {
      const { collection, getDocs } = await import('firebase/firestore')
      const booksRef = collection(firestore, 'books')
      const snapshot = await getDocs(booksRef)

      let count = 0
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.center === center && data.labelNumber && data.labelNumber.startsWith(`${categoryName}_`)) {
          count++
        }
      })

      return count
    } catch (err) {
      console.error('카테고리별 도서 수 조회 오류:', err)
      return 0
    }
  }

  // ==================== 서가 이미지 관리 ====================

  /**
   * 서가 이미지 목록 로드
   * @returns {Promise<Array>} 이미지 목록
   */
  const loadShelfImages = async () => {
    if (!firestore) {
      return []
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'shelfImages')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        return settingsDoc.data().images || []
      }

      return []
    } catch (err) {
      console.error('서가 이미지 로드 오류:', err)
      return []
    }
  }

  /**
   * 서가 이미지 업로드
   * @param {File} file - 이미지 파일
   * @param {string} name - 이미지 이름
   * @param {string} center - 센터명
   * @returns {Promise<Object>} 업로드 결과 { id, name, url, center }
   */
  const uploadShelfImage = async (file, name, center) => {
    if (!storage || !firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

      // 이미지 ID 생성
      const imageId = `img_${Date.now()}`
      const fileName = `${imageId}_${file.name}`
      
      // Storage에 업로드
      const storageRef = ref(storage, `shelves/${fileName}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      // Firestore에 이미지 정보 저장
      const images = await loadShelfImages()
      images.push({
        id: imageId,
        name: name.trim(),
        url,
        fileName,
        center: center || '',
        createdAt: new Date().toISOString()
      })

      const settingsRef = doc(firestore, 'settings', 'shelfImages')
      await setDoc(settingsRef, {
        images,
        updatedAt: serverTimestamp()
      })

      return { id: imageId, name: name.trim(), url, center }
    } catch (err) {
      console.error('서가 이미지 업로드 오류:', err)
      throw err
    }
  }

  /**
   * 서가 이미지 삭제
   * @param {string} imageId - 이미지 ID
   */
  const deleteShelfImage = async (imageId) => {
    if (!storage || !firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { ref, deleteObject } = await import('firebase/storage')
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

      // 해당 이미지가 매핑에 사용중인지 확인
      const mapping = await loadLocationMapping()
      for (const center in mapping) {
        for (const location in mapping[center]) {
          if (mapping[center][location] === imageId) {
            throw new Error('해당 이미지가 칸 매핑에 사용 중이어서 삭제할 수 없습니다.')
          }
        }
      }

      // 이미지 목록에서 찾기
      const images = await loadShelfImages()
      const imageIndex = images.findIndex(img => img.id === imageId)
      
      if (imageIndex === -1) {
        throw new Error('이미지를 찾을 수 없습니다.')
      }

      const imageToDelete = images[imageIndex]

      // Storage에서 삭제
      if (imageToDelete.fileName) {
        try {
          const storageRef = ref(storage, `shelves/${imageToDelete.fileName}`)
          await deleteObject(storageRef)
        } catch (storageErr) {
          console.warn('Storage 이미지 삭제 실패 (이미 삭제되었거나 존재하지 않음):', storageErr)
        }
      }

      // Firestore에서 이미지 정보 삭제
      images.splice(imageIndex, 1)
      const settingsRef = doc(firestore, 'settings', 'shelfImages')
      await setDoc(settingsRef, {
        images,
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (err) {
      console.error('서가 이미지 삭제 오류:', err)
      throw err
    }
  }

  /**
   * 서가 이미지 이름 수정
   * @param {string} imageId - 이미지 ID
   * @param {string} newName - 새 이름
   */
  const updateShelfImageName = async (imageId, newName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

      const images = await loadShelfImages()
      const imageIndex = images.findIndex(img => img.id === imageId)
      
      if (imageIndex === -1) {
        throw new Error('이미지를 찾을 수 없습니다.')
      }

      images[imageIndex].name = newName.trim()

      const settingsRef = doc(firestore, 'settings', 'shelfImages')
      await setDoc(settingsRef, {
        images,
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (err) {
      console.error('서가 이미지 이름 수정 오류:', err)
      throw err
    }
  }

  /**
   * 서가 이미지 교체 (기존 이미지 ID 유지, Storage 파일만 교체)
   * 기존 이미지와 매핑된 모든 칸은 자동으로 새 이미지로 연결됨
   * @param {string} imageId - 교체할 이미지 ID
   * @param {File} newFile - 새 이미지 파일
   * @returns {Promise<Object>} 교체 결과 { id, name, url, center }
   */
  const replaceShelfImage = async (imageId, newFile) => {
    if (!storage || !firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage')
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

      // 기존 이미지 정보 찾기
      const images = await loadShelfImages()
      const imageIndex = images.findIndex(img => img.id === imageId)
      
      if (imageIndex === -1) {
        throw new Error('이미지를 찾을 수 없습니다.')
      }

      const existingImage = images[imageIndex]

      // 기존 Storage 파일 삭제
      if (existingImage.fileName) {
        try {
          const oldStorageRef = ref(storage, `shelves/${existingImage.fileName}`)
          await deleteObject(oldStorageRef)
        } catch (storageErr) {
          console.warn('기존 Storage 이미지 삭제 실패 (이미 삭제되었거나 존재하지 않음):', storageErr)
        }
      }

      // 새 파일 업로드 (기존 ID 유지)
      const newFileName = `${imageId}_${newFile.name}`
      const newStorageRef = ref(storage, `shelves/${newFileName}`)
      await uploadBytes(newStorageRef, newFile)
      const newUrl = await getDownloadURL(newStorageRef)

      // Firestore에 이미지 정보 업데이트 (ID, name, center 유지, url과 fileName만 변경)
      images[imageIndex] = {
        ...existingImage,
        url: newUrl,
        fileName: newFileName,
        updatedAt: new Date().toISOString()
      }

      const settingsRef = doc(firestore, 'settings', 'shelfImages')
      await setDoc(settingsRef, {
        images,
        updatedAt: serverTimestamp()
      })

      return { 
        id: existingImage.id, 
        name: existingImage.name, 
        url: newUrl, 
        center: existingImage.center 
      }
    } catch (err) {
      console.error('서가 이미지 교체 오류:', err)
      throw err
    }
  }

  // ==================== 칸-이미지 매핑 관리 ====================

  /**
   * 칸-이미지 매핑 로드
   * @returns {Promise<Object>} { 센터명: { 칸: 이미지ID } }
   */
  const loadLocationMapping = async () => {
    if (!firestore) {
      return {}
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'locationMapping')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        // updatedAt 필드 제외하고 센터 매핑만 반환
        const { updatedAt, ...mapping } = data
        return mapping
      }

      return {}
    } catch (err) {
      console.error('칸-이미지 매핑 로드 오류:', err)
      return {}
    }
  }

  /**
   * 칸-이미지 매핑 저장
   * @param {string} center - 센터명
   * @param {Object} mapping - { 칸: 이미지ID }
   */
  const saveLocationMapping = async (center, mapping) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')

      const allMapping = await loadLocationMapping()
      allMapping[center] = mapping

      const settingsRef = doc(firestore, 'settings', 'locationMapping')
      await setDoc(settingsRef, {
        ...allMapping,
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (err) {
      console.error('칸-이미지 매핑 저장 오류:', err)
      throw err
    }
  }

  /**
   * 특정 센터/칸의 이미지 URL 가져오기
   * @param {string} center - 센터명
   * @param {string} location - 칸
   * @returns {Promise<string|null>} 이미지 URL 또는 null
   */
  const getLocationImageUrl = async (center, location) => {
    try {
      const mapping = await loadLocationMapping()
      const imageId = mapping[center]?.[location]

      if (!imageId) {
        return null
      }

      const images = await loadShelfImages()
      const image = images.find(img => img.id === imageId)

      return image?.url || null
    } catch (err) {
      console.error('칸 이미지 URL 조회 오류:', err)
      return null
    }
  }

  /**
   * 특정 센터에 위치 이미지 매핑이 있는지 확인
   * @param {string} center - 센터명
   * @returns {Promise<boolean>} 매핑 존재 여부
   */
  const hasLocationMappingForCenter = async (center) => {
    if (!center) return false
    
    try {
      const mapping = await loadLocationMapping()
      const centerMapping = mapping[center]
      
      // 센터에 매핑된 칸이 하나라도 있으면 true
      return centerMapping && Object.keys(centerMapping).length > 0
    } catch (err) {
      console.error('센터 매핑 확인 오류:', err)
      return false
    }
  }

  /**
   * 특정 센터/칸에 이미지 매핑이 있는지 확인
   * @param {string} center - 센터명
   * @param {string} location - 칸
   * @returns {Promise<boolean>} 매핑 존재 여부
   */
  const hasLocationMappingForLocation = async (center, location) => {
    if (!center || !location) return false
    
    try {
      const mapping = await loadLocationMapping()
      const imageId = mapping[center]?.[location]
      return !!imageId
    } catch (err) {
      console.error('칸 매핑 확인 오류:', err)
      return false
    }
  }

  // ==================== 센터별 칸 관리 ====================

  /**
   * 센터별 칸 목록 로드
   * @param {string} center - 센터명
   * @returns {Promise<Array>} 칸 목록
   */
  const loadCenterLocations = async (center) => {
    if (!firestore) {
      return []
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'locations')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        return settingsDoc.data()[center] || []
      }

      return []
    } catch (err) {
      console.error('칸 목록 로드 오류:', err)
      return []
    }
  }

  /**
   * 센터별 칸 목록 저장
   * @param {string} center - 센터명
   * @param {Array} locations - 칸 목록
   */
  const saveCenterLocations = async (center, locations) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'locations')
      const settingsDoc = await getDoc(settingsRef)
      
      const existingData = settingsDoc.exists() ? settingsDoc.data() : {}
      
      await setDoc(settingsRef, {
        ...existingData,
        [center]: locations,
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (err) {
      console.error('칸 목록 저장 오류:', err)
      throw err
    }
  }

  /**
   * 칸 추가
   * @param {string} center - 센터명
   * @param {string} locationName - 칸 이름
   */
  const addCenterLocation = async (center, locationName) => {
    const trimmedName = locationName.trim()
    if (!trimmedName) {
      throw new Error('칸 이름을 입력해주세요.')
    }

    const locations = await loadCenterLocations(center)
    
    if (locations.find(loc => loc.name === trimmedName)) {
      throw new Error('이미 존재하는 칸 이름입니다.')
    }

    locations.push({
      id: `loc_${Date.now()}`,
      name: trimmedName,
      createdAt: new Date().toISOString()
    })

    await saveCenterLocations(center, locations)
    return { success: true }
  }

  /**
   * 칸 이름 변경 (도서 데이터도 함께 수정)
   * @param {string} center - 센터명
   * @param {string} oldName - 기존 칸 이름
   * @param {string} newName - 새 칸 이름
   */
  const updateLocationName = async (center, oldName, newName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    const trimmedNewName = newName.trim()
    if (!trimmedNewName) {
      throw new Error('새 칸 이름을 입력해주세요.')
    }

    if (oldName === trimmedNewName) {
      return { success: true, updatedCount: 0 }
    }

    try {
      const { collection, getDocs, doc, writeBatch } = await import('firebase/firestore')

      // 1. 해당 센터의 해당 칸에 있는 도서들 조회
      const booksRef = collection(firestore, 'books')
      const snapshot = await getDocs(booksRef)

      const booksToUpdate = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        // 센터가 일치하고, location이 oldName인 도서
        if (data.center === center && data.location === oldName) {
          booksToUpdate.push({
            id: docSnap.id
          })
        }
      })

      // 2. 도서 데이터 일괄 수정 (location 필드만 변경, 라벨번호는 유지)
      if (booksToUpdate.length > 0) {
        const batch = writeBatch(firestore)
        for (const book of booksToUpdate) {
          const bookRef = doc(firestore, 'books', book.id)
          batch.update(bookRef, {
            location: trimmedNewName
          })
        }
        await batch.commit()
      }

      // 3. 칸 목록 업데이트 (커스텀 칸인 경우)
      const locations = await loadCenterLocations(center)
      const locationIndex = locations.findIndex(loc => loc.name === oldName)
      if (locationIndex !== -1) {
        locations[locationIndex].name = trimmedNewName
        await saveCenterLocations(center, locations)
      }

      // 4. 칸-이미지 매핑 업데이트
      const mapping = await loadLocationMapping()
      if (mapping[center] && mapping[center][oldName]) {
        mapping[center][trimmedNewName] = mapping[center][oldName]
        delete mapping[center][oldName]
        await saveLocationMapping(center, mapping[center])
      }

      return { success: true, updatedCount: booksToUpdate.length }
    } catch (err) {
      console.error('칸 이름 변경 오류:', err)
      throw err
    }
  }

  /**
   * 칸 삭제
   * @param {string} center - 센터명
   * @param {string} locationName - 칸 이름
   */
  const deleteCenterLocation = async (center, locationName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { collection, getDocs } = await import('firebase/firestore')

      // 해당 칸에 도서가 있는지 확인
      const booksRef = collection(firestore, 'books')
      const snapshot = await getDocs(booksRef)

      let hasBooks = false
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.center === center && data.location === locationName) {
          hasBooks = true
        }
      })

      if (hasBooks) {
        throw new Error('해당 칸에 등록된 도서가 있어 삭제할 수 없습니다.')
      }

      // 칸 목록에서 삭제
      const locations = await loadCenterLocations(center)
      const filteredLocations = locations.filter(loc => loc.name !== locationName)
      await saveCenterLocations(center, filteredLocations)

      // 칸-이미지 매핑에서도 삭제
      const mapping = await loadLocationMapping()
      if (mapping[center] && mapping[center][locationName]) {
        delete mapping[center][locationName]
        await saveLocationMapping(center, mapping[center])
      }

      return { success: true }
    } catch (err) {
      console.error('칸 삭제 오류:', err)
      throw err
    }
  }

  // ==================== 칸 선택 옵션 ====================

  /**
   * 센터별 칸 목록을 선택 옵션 형태로 반환
   * @param {string} center - 센터명
   * @returns {Promise<Array>} [{ title: '칸 이름', value: '칸 이름' }, ...]
   */
  const getLocationSelectOptions = async (center) => {
    const locations = await loadCenterLocations(center)
    return locations.map(loc => ({
      title: loc.name,
      value: loc.name
    }))
  }

  // ==================== 기본 칸 관리 ====================

  /**
   * 센터별 기본 칸 로드
   * @param {string} center - 센터명
   * @returns {Promise<string|null>} 기본 칸 이름 또는 null
   */
  const getDefaultLocation = async (center) => {
    if (!firestore) {
      return null
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'defaultLocations')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        return settingsDoc.data()[center] || null
      }

      return null
    } catch (err) {
      console.error('기본 칸 로드 오류:', err)
      return null
    }
  }

  /**
   * 센터별 기본 칸 설정
   * @param {string} center - 센터명
   * @param {string} locationName - 칸 이름
   */
  const setDefaultLocation = async (center, locationName) => {
    if (!firestore) {
      throw new Error('Firebase가 초기화되지 않았습니다.')
    }

    try {
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const settingsRef = doc(firestore, 'settings', 'defaultLocations')
      const settingsDoc = await getDoc(settingsRef)

      const existingData = settingsDoc.exists() ? settingsDoc.data() : {}

      await setDoc(settingsRef, {
        ...existingData,
        [center]: locationName,
        updatedAt: serverTimestamp()
      })

      return { success: true }
    } catch (err) {
      console.error('기본 칸 설정 오류:', err)
      throw err
    }
  }

  return {
    loading,
    error,
    // 카테고리 (센터별 독립 관리)
    loadCategorySettings,
    saveCategorySettings,
    loadCategoriesByCenter,
    addCategory,
    updateCategoryName,
    deleteCategory,
    deleteCategories,
    getBookCountByCategory,
    // 서가 이미지
    loadShelfImages,
    uploadShelfImage,
    deleteShelfImage,
    updateShelfImageName,
    replaceShelfImage,
    // 칸-이미지 매핑
    loadLocationMapping,
    saveLocationMapping,
    getLocationImageUrl,
    hasLocationMappingForCenter,
    hasLocationMappingForLocation,
    // 센터별 칸 관리
    loadCenterLocations,
    saveCenterLocations,
    addCenterLocation,
    updateLocationName,
    deleteCenterLocation,
    // 칸 선택 옵션
    getLocationSelectOptions,
    // 기본 칸 관리
    getDefaultLocation,
    setDefaultLocation
  }
}
