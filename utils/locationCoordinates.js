/**
 * 센터별 서가 이미지 위치 좌표 관련 유틸리티
 * 
 * [참고] 이 파일의 하드코딩된 데이터는 더 이상 사용되지 않습니다.
 * 모든 서가 이미지 및 칸-이미지 매핑은 Firestore 설정 관리에서 관리됩니다.
 * - 설정 관리 경로: /admin/settings
 * - Firestore 컬렉션: settings/shelfImages, settings/locationMapping
 * - 관련 함수: useSettings().loadLocationMapping(), useSettings().loadShelfImages()
 */

/**
 * @deprecated Firestore 설정 관리 사용 권장 (useSettings)
 * 하위 호환성을 위해 유지되지만, 실제 이미지는 Firestore에서 로드됩니다.
 */
export const getLocationImageInfo = (center, location) => {
  // Firestore 설정 관리 사용으로 더 이상 하드코딩 데이터 사용하지 않음
  return null
}

/**
 * @deprecated Firestore 설정 관리 사용 권장 (useSettings().hasLocationMappingForCenter)
 * 하위 호환성을 위해 유지되지만, 실제 체크는 Firestore에서 수행됩니다.
 */
export const hasLocationImage = (center) => {
  // Firestore 설정 관리 사용으로 더 이상 하드코딩 데이터 사용하지 않음
  // useSettings().hasLocationMappingForCenter(center)를 사용하세요
  return false
}

/**
 * @deprecated Firestore 설정 관리 사용 권장
 */
export const getAllLocationAreas = (center) => {
  return { shelf1: {}, shelf2: {} }
}

