// 근무지 목록
export const WORKPLACES = [
  '강남',
  '잠실',
  '수원',
  '판교',
  '용산',
  '증미',
  '여의도'
]

// 센터 목록
export const CENTERS = [
  '강남센터',
  '용산센터'
]

// 근무지 -> 센터 매핑
export const WORKPLACE_CENTER_MAP = {
  '강남': '강남센터',
  '잠실': '강남센터',
  '수원': '강남센터',
  '판교': '강남센터',
  '용산': '용산센터',
  '증미': '용산센터',
  '여의도': '용산센터'
}

/**
 * 근무지로 센터 가져오기
 */
export function getCenterByWorkplace(workplace) {
  if (workplace in WORKPLACE_CENTER_MAP) {
    return WORKPLACE_CENTER_MAP[workplace]
  }
  // 기본값: 강남센터
  return '강남센터'
}

/**
 * 바로 대여 가능 여부 확인
 * - 강남 근무지 + 강남센터 = true
 * - 용산 근무지 + 용산센터 = true
 * - 그 외 = false (승인 신청 필요)
 */
export function canDirectRent(workplace, center) {
  if (center === '강남센터') {
    return workplace === '강남'
  }
  if (center === '용산센터') {
    return workplace === '용산'
  }
  return false
}

