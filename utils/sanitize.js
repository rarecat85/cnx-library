/**
 * XSS 방지를 위한 입력값 sanitize 유틸리티
 */

/**
 * HTML 특수문자를 이스케이프하여 XSS 공격 방지
 * @param {string} str - 원본 문자열
 * @returns {string} - 이스케이프된 문자열
 */
export const escapeHtml = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  
  return str.replace(/[&<>"'`=/]/g, char => htmlEntities[char])
}

/**
 * 스크립트 태그 및 이벤트 핸들러 제거
 * @param {string} str - 원본 문자열
 * @returns {string} - 정제된 문자열
 */
export const removeScripts = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  // script 태그 제거
  let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // 이벤트 핸들러 속성 제거 (on으로 시작하는 속성)
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // javascript: 프로토콜 제거
  cleaned = cleaned.replace(/javascript\s*:/gi, '')
  
  // data: 프로토콜 제거 (이미지 외)
  cleaned = cleaned.replace(/data\s*:\s*(?!image\/)/gi, '')
  
  // expression() 제거 (CSS XSS)
  cleaned = cleaned.replace(/expression\s*\(/gi, '')
  
  // vbscript: 프로토콜 제거
  cleaned = cleaned.replace(/vbscript\s*:/gi, '')
  
  return cleaned
}

/**
 * 사용자 입력값 sanitize (DB 저장용)
 * HTML 태그는 유지하되 스크립트만 제거
 * @param {string} str - 원본 문자열
 * @returns {string} - 정제된 문자열
 */
export const sanitizeInput = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  return removeScripts(str.trim())
}

/**
 * 사용자 입력값을 완전히 이스케이프 (출력용)
 * 모든 HTML 태그를 이스케이프
 * @param {string} str - 원본 문자열
 * @returns {string} - 이스케이프된 문자열
 */
export const sanitizeOutput = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  return escapeHtml(str.trim())
}

/**
 * 검색어 sanitize
 * @param {string} str - 검색어
 * @returns {string} - 정제된 검색어
 */
export const sanitizeSearchQuery = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  // 기본 정제
  let cleaned = removeScripts(str.trim())
  
  // 검색에 불필요한 특수문자 제거 (기본 문자, 숫자, 한글, 공백, 하이픈만 허용)
  cleaned = cleaned.replace(/[<>'"`;(){}[\]\\]/g, '')
  
  return cleaned
}

/**
 * 이름 sanitize (한글, 영문, 공백만 허용)
 * @param {string} str - 이름
 * @returns {string} - 정제된 이름
 */
export const sanitizeName = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  // 한글, 영문, 공백만 허용
  return str.trim().replace(/[^가-힣a-zA-Z\s]/g, '')
}

/**
 * 이메일 sanitize
 * @param {string} str - 이메일
 * @returns {string} - 정제된 이메일
 */
export const sanitizeEmail = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  // 이메일에 허용되는 문자만
  return str.trim().replace(/[^a-zA-Z0-9@._+-]/g, '')
}

/**
 * 숫자만 허용
 * @param {string} str - 입력값
 * @returns {string} - 숫자만 남은 문자열
 */
export const sanitizeNumber = (str) => {
  if (str === null || str === undefined) return ''
  if (typeof str !== 'string') return String(str)
  
  return str.replace(/[^0-9]/g, '')
}

/**
 * 객체의 모든 문자열 속성을 sanitize
 * @param {Object} obj - 원본 객체
 * @returns {Object} - sanitize된 객체
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}


