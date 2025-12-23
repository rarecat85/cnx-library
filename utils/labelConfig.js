/**
 * 도서 라벨번호 및 위치 관련 설정
 */

// 기본 카테고리 목록 (14개)
export const DEFAULT_CATEGORIES = [
  '경제경영',
  '교양사상',
  '국내소설',
  '국내수필',
  '마케팅',
  '심리학',
  '외국도서',
  '외국소설',
  '외국수필',
  '외국어',
  '인문학',
  '자기계발',
  '전공서적',
  '회계학'
]

// 센터별 라벨번호 코드 (5자리 숫자의 첫 번째 자리)
export const CENTER_CODE_MAP = {
  '강남센터': '1',
  '용산센터': '2'
}

// 센터 코드로 센터명 찾기
export const getCenterByCode = (code) => {
  const entry = Object.entries(CENTER_CODE_MAP).find(([, value]) => value === code)
  return entry ? entry[0] : null
}

// 위치(칸) 목록
export const LOCATION_OPTIONS = [
  { value: '구매칸', text: '구매칸', type: 'special' },
  { value: '기부칸', text: '기부칸', type: 'special' },
  ...Array.from({ length: 16 }, (_, i) => ({
    value: String(i + 1),
    text: `${i + 1}번 칸`,
    type: 'number'
  }))
]

// 위치 목록에서 선택 옵션 형태로 변환
export const getLocationSelectOptions = () => {
  return LOCATION_OPTIONS.map(opt => ({
    title: opt.text,
    value: opt.value
  }))
}

/**
 * 라벨번호 생성
 * @param {string} category - 카테고리명
 * @param {string} center - 센터명
 * @param {string} fourDigits - 4자리 숫자 (문자열)
 * @returns {string} 라벨번호 (예: "경제경영_10001")
 */
export const createLabelNumber = (category, center, fourDigits) => {
  const centerCode = CENTER_CODE_MAP[center] || '1'
  const paddedDigits = String(fourDigits).padStart(4, '0')
  return `${category}_${centerCode}${paddedDigits}`
}

/**
 * 라벨번호 파싱
 * @param {string} labelNumber - 라벨번호 (예: "경제경영_10001")
 * @returns {Object} { category, centerCode, fourDigits }
 */
export const parseLabelNumber = (labelNumber) => {
  if (!labelNumber || !labelNumber.includes('_')) {
    return null
  }
  
  const [category, numberPart] = labelNumber.split('_')
  if (!numberPart || numberPart.length !== 5) {
    return null
  }
  
  return {
    category,
    centerCode: numberPart.charAt(0),
    fourDigits: numberPart.substring(1)
  }
}

/**
 * 위치 표시 포맷
 * @param {string} location - 위치값 ("1", "2", "구매칸", "기부칸" 등)
 * @returns {string} 포맷된 위치 문자열
 */
export const formatLocation = (location) => {
  if (!location) return ''
  
  // 특수 위치 (구매칸, 기부칸)
  if (location === '구매칸' || location === '기부칸') {
    return location
  }
  
  // 숫자 위치
  return `${location}번 칸`
}

/**
 * 여러 위치를 표시 형식으로 변환
 * @param {Array<string>} locations - 위치 배열
 * @returns {string} 표시 문자열 (예: "3번 칸, 5번 칸" 또는 "3번 칸 외 1곳")
 */
export const formatMultipleLocations = (locations) => {
  if (!locations || locations.length === 0) {
    return '없음'
  }
  
  const uniqueLocations = [...new Set(locations)]
  
  if (uniqueLocations.length === 1) {
    return formatLocation(uniqueLocations[0])
  }
  
  if (uniqueLocations.length === 2) {
    return uniqueLocations.map(formatLocation).join(', ')
  }
  
  // 3개 이상이면 "첫번째 외 N곳" 형태
  return `${formatLocation(uniqueLocations[0])} 외 ${uniqueLocations.length - 1}곳`
}

/**
 * 라벨번호 유효성 검사
 * @param {string} labelNumber - 라벨번호
 * @returns {boolean} 유효 여부
 */
export const isValidLabelNumber = (labelNumber) => {
  if (!labelNumber || typeof labelNumber !== 'string') {
    return false
  }
  
  const parsed = parseLabelNumber(labelNumber)
  if (!parsed) {
    return false
  }
  
  // 카테고리가 있고, 센터코드가 1 또는 2이고, 4자리 숫자인지 확인
  const { category, centerCode, fourDigits } = parsed
  
  if (!category || category.trim() === '') {
    return false
  }
  
  if (centerCode !== '1' && centerCode !== '2') {
    return false
  }
  
  if (!/^\d{4}$/.test(fourDigits)) {
    return false
  }
  
  return true
}

/**
 * 4자리 숫자 유효성 검사
 * @param {string} fourDigits - 4자리 숫자
 * @returns {boolean} 유효 여부
 */
export const isValidFourDigits = (fourDigits) => {
  if (!fourDigits || typeof fourDigits !== 'string') {
    return false
  }
  
  return /^\d{1,4}$/.test(fourDigits)
}

