/**
 * 센터별 서가 이미지 칸 좌표 매핑
 * 좌표는 이미지 대비 퍼센트(%) 단위
 * { x, y, width, height } - 좌상단 기준
 */

// 용산센터 서가 이미지 1 (1~9번 칸 + 구매칸/기부칸)
// 이미지: yongsan-shelf-1.jpg
export const YONGSAN_SHELF_1_AREAS = {
  '1': { x: 1.5, y: 1, width: 14, height: 13 },
  '2': { x: 16, y: 1, width: 14, height: 13 },
  '3': { x: 51, y: 1, width: 18, height: 13 },
  '4': { x: 69, y: 1, width: 15, height: 27 },
  '5': { x: 1.5, y: 77, width: 13, height: 12 },
  '6': { x: 15, y: 77, width: 14, height: 12 },
  '7': { x: 29, y: 77, width: 12, height: 12 },
  '8': { x: 41, y: 77, width: 14, height: 12 },
  '9': { x: 69, y: 77, width: 15, height: 12 },
  '구매칸': { x: 1.5, y: 28, width: 13, height: 24 },
  '기부칸': { x: 69, y: 54, width: 15, height: 10 }
}

// 용산센터 서가 이미지 2 (10~16번 칸)
// 이미지: yongsan-shelf-2.jpg
export const YONGSAN_SHELF_2_AREAS = {
  '10': { x: 1, y: 1, width: 18, height: 12 },
  '11': { x: 19, y: 1, width: 18, height: 12 },
  '12': { x: 37, y: 1, width: 18, height: 12 },
  '13': { x: 55, y: 1, width: 18, height: 12 },
  '14': { x: 7, y: 17, width: 14, height: 18 },
  '15': { x: 7, y: 38, width: 14, height: 16 },
  '16': { x: 7, y: 57, width: 14, height: 16 }
}

// 강남센터 서가 이미지 (추후 추가)
export const GANGNAM_SHELF_1_AREAS = {}
export const GANGNAM_SHELF_2_AREAS = {}

/**
 * 센터와 위치에 해당하는 이미지 정보 반환
 * @param {string} center - 센터명
 * @param {string} location - 위치값
 * @returns {Object|null} { imagePath, area } 또는 null
 */
export const getLocationImageInfo = (center, location) => {
  if (!center || !location) {
    return null
  }
  
  if (center === '용산센터') {
    // 1~9번 칸, 구매칸, 기부칸은 첫 번째 이미지
    if (YONGSAN_SHELF_1_AREAS[location]) {
      return {
        imagePath: '/images/shelves/yongsan-shelf-1.png',
        area: YONGSAN_SHELF_1_AREAS[location]
      }
    }
    
    // 10~16번 칸은 두 번째 이미지
    if (YONGSAN_SHELF_2_AREAS[location]) {
      return {
        imagePath: '/images/shelves/yongsan-shelf-2.png',
        area: YONGSAN_SHELF_2_AREAS[location]
      }
    }
  }
  
  if (center === '강남센터') {
    // 강남센터 이미지가 추가되면 여기에 로직 추가
    if (GANGNAM_SHELF_1_AREAS[location]) {
      return {
        imagePath: '/images/shelves/gangnam-shelf-1.png',
        area: GANGNAM_SHELF_1_AREAS[location]
      }
    }
    
    if (GANGNAM_SHELF_2_AREAS[location]) {
      return {
        imagePath: '/images/shelves/gangnam-shelf-2.png',
        area: GANGNAM_SHELF_2_AREAS[location]
      }
    }
  }
  
  return null
}

/**
 * 특정 센터에 위치 안내 이미지가 있는지 확인
 * @param {string} center - 센터명
 * @returns {boolean}
 */
export const hasLocationImage = (center) => {
  if (center === '용산센터') {
    return true
  }
  
  if (center === '강남센터') {
    // 강남센터 이미지가 추가되면 true로 변경
    return Object.keys(GANGNAM_SHELF_1_AREAS).length > 0 || 
           Object.keys(GANGNAM_SHELF_2_AREAS).length > 0
  }
  
  return false
}

/**
 * 센터의 모든 위치 좌표 정보 반환
 * @param {string} center - 센터명
 * @returns {Object} { shelf1: {...}, shelf2: {...} }
 */
export const getAllLocationAreas = (center) => {
  if (center === '용산센터') {
    return {
      shelf1: YONGSAN_SHELF_1_AREAS,
      shelf2: YONGSAN_SHELF_2_AREAS
    }
  }
  
  if (center === '강남센터') {
    return {
      shelf1: GANGNAM_SHELF_1_AREAS,
      shelf2: GANGNAM_SHELF_2_AREAS
    }
  }
  
  return { shelf1: {}, shelf2: {} }
}

