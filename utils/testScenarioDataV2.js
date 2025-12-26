/**
 * 테스트 시나리오 데이터 v2
 * 2024년 12월 23일 이후 변경/추가된 기능에 대한 테스트
 * 기존 테스트(v1)와 중복되지 않는 항목만 포함
 */

export const TEST_SCENARIOS_V2 = [
  {
    section: '1. 도서 검색 API 변경 테스트',
    subsections: [
      {
        title: '1.1 네이버 도서 API 검색',
        items: [
          { id: 'v2-1.1.1', name: '국내 도서 검색', method: '도서 등록/신청 페이지에서 한글 도서명 검색 (예: "해리포터")', expected: '네이버 도서 API 검색 결과 표시' },
          { id: 'v2-1.1.2', name: '외국 도서 검색', method: '도서 등록/신청 페이지에서 영문 도서명 검색 (예: "Clean Code")', expected: '외국 도서 검색 결과 표시' },
          { id: 'v2-1.1.3', name: 'ISBN-13 검색', method: '도서 검색창에 ISBN-13 입력 (예: "9788966262472")', expected: 'ISBN에 해당하는 도서 정확히 검색됨' },
          { id: 'v2-1.1.4', name: '세트/전집 필터링', method: '"해리포터 세트" 검색', expected: '세트/전집 상품 자동 제외, 단권만 표시' },
          { id: 'v2-1.1.5', name: '검색 플레이스홀더 확인', method: '도서 등록/대여/신청 페이지 검색창 확인', expected: '"도서명 또는 ISBN-13으로 검색" 표시' },
          { id: 'v2-1.1.6', name: '베스트셀러 (알라딘)', method: '메인 페이지 또는 도서 등록 페이지 베스트셀러 확인', expected: '알라딘 베스트셀러 정상 표시' }
        ]
      }
    ]
  },
  {
    section: '2. 라벨번호 및 위치 시스템 테스트',
    subsections: [
      {
        title: '2.1 라벨번호 형식',
        items: [
          { id: 'v2-2.1.1', name: '라벨번호 자동 생성', method: '도서 등록 시 라벨번호 필드 확인', expected: '카테고리_센터코드+4자리숫자 형식 (예: 국내소설_20001)' },
          { id: 'v2-2.1.2', name: '센터코드 확인', method: '용산센터/강남센터 각각 도서 등록', expected: '용산센터: 2, 강남센터: 1 코드 부여' },
          { id: 'v2-2.1.3', name: '라벨번호 수정', method: '도서 등록 시 자동 생성된 라벨번호 수정', expected: '수정 가능, 저장 후 반영' },
          { id: 'v2-2.1.4', name: '라벨번호 중복 방지', method: '이미 존재하는 라벨번호로 등록 시도', expected: '중복 라벨번호 등록 불가 오류' }
        ]
      },
      {
        title: '2.2 위치 설정',
        items: [
          { id: 'v2-2.2.1', name: '위치 선택 옵션', method: '도서 등록 시 위치 드롭다운 확인', expected: '구매칸, 기부칸, 1~16번 칸 옵션 표시' },
          { id: 'v2-2.2.2', name: '기본 위치 값', method: '새 도서 등록 시 위치 기본값 확인', expected: '"구매칸"이 기본 선택' },
          { id: 'v2-2.2.3', name: '위치 정보 표시', method: '도서 카드에서 위치 정보 확인', expected: '위치 아이콘 및 텍스트 표시 (예: "1번 칸", "구매칸")' }
        ]
      },
      {
        title: '2.3 위치 안내 팝업',
        items: [
          { id: 'v2-2.3.1', name: '위치 아이콘 클릭', method: '도서 정보의 위치 옆 ⓘ 아이콘 클릭', expected: '위치 안내 팝업 표시' },
          { id: 'v2-2.3.2', name: '서가 이미지 표시', method: '위치 안내 팝업 내용 확인', expected: '해당 센터 서가 이미지와 위치 설명 표시' },
          { id: 'v2-2.3.3', name: '팝업 닫기', method: '팝업 외부 또는 닫기 버튼 클릭', expected: '팝업 정상 닫힘' },
          { id: 'v2-2.3.4', name: '위치 텍스트 클릭 (마이페이지)', method: '마이페이지에서 위치 텍스트 영역 클릭', expected: '팝업 열리지 않음 (아이콘 클릭 시에만 열림)' }
        ]
      }
    ]
  },
  {
    section: '3. NEW 도서 로직 변경 테스트',
    subsections: [
      {
        title: '3.1 NEW 표시 조건',
        items: [
          { id: 'v2-3.1.1', name: '구매칸 도서 NEW 표시', method: '위치가 "구매칸"인 도서 확인', expected: 'NEW 배지 표시' },
          { id: 'v2-3.1.2', name: '다른 위치 도서 NEW 미표시', method: '위치가 "1번 칸" 등인 도서 확인', expected: 'NEW 배지 미표시' },
          { id: 'v2-3.1.3', name: '위치 변경 시 NEW 제거', method: '구매칸 도서를 다른 위치로 변경', expected: 'NEW 배지 사라짐' },
          { id: 'v2-3.1.4', name: '메인 페이지 신규 도서', method: '메인 페이지 "신규 도서" 섹션 확인', expected: '구매칸 도서만 표시' }
        ]
      }
    ]
  },
  {
    section: '4. 다권 등록 기능 테스트',
    subsections: [
      {
        title: '4.1 다권 동시 등록',
        items: [
          { id: 'v2-4.1.1', name: '권수 설정', method: '도서 등록 시 권수를 2 이상으로 설정', expected: '권수만큼 라벨번호/위치 입력 필드 생성' },
          { id: 'v2-4.1.2', name: '개별 라벨번호 설정', method: '각 권의 라벨번호 개별 설정', expected: '각 권마다 다른 라벨번호 지정 가능' },
          { id: 'v2-4.1.3', name: '개별 위치 설정', method: '각 권의 위치 개별 설정', expected: '각 권마다 다른 위치 지정 가능' },
          { id: 'v2-4.1.4', name: '다권 등록 완료', method: '3권 설정 후 등록 완료', expected: '3개의 개별 도서 레코드 생성' }
        ]
      },
      {
        title: '4.2 추가 등록',
        items: [
          { id: 'v2-4.2.1', name: '등록된 도서 추가 등록 버튼', method: '이미 등록된 도서 검색 결과 확인', expected: '"등록된 도서입니다" + "추가 등록" 버튼 표시' },
          { id: 'v2-4.2.2', name: '추가 등록 실행', method: '"추가 등록" 버튼 클릭 후 등록', expected: '새 라벨번호로 추가 등록 가능' }
        ]
      }
    ]
  },
  {
    section: '5. 직접 등록 기능 테스트',
    subsections: [
      {
        title: '5.1 직접 등록 접근',
        items: [
          { id: 'v2-5.1.1', name: '검색 결과 없음 시 버튼 표시', method: '검색 결과 없는 키워드 검색 (예: "zzzxxx123")', expected: '"ISBN 조회하기", "직접 등록하기" 버튼 표시' },
          { id: 'v2-5.1.2', name: 'ISBN 조회 외부 링크', method: '"ISBN 조회하기" 버튼 클릭', expected: 'isbnsearch.org 새 탭에서 열림' },
          { id: 'v2-5.1.3', name: '직접 등록 다이얼로그 열기', method: '"직접 등록하기" 버튼 클릭', expected: '직접 등록 다이얼로그 표시' }
        ]
      },
      {
        title: '5.2 직접 등록 입력',
        items: [
          { id: 'v2-5.2.1', name: '필수 입력 필드', method: '직접 등록 다이얼로그 필드 확인', expected: '도서명*, ISBN* 필수, 저자/출판사 선택' },
          { id: 'v2-5.2.2', name: '이미지 안내 메시지', method: '다이얼로그 내 안내 메시지 확인', expected: '"표지 이미지는 기본 이미지로 대체됩니다" 표시' },
          { id: 'v2-5.2.3', name: 'ISBN 조회 버튼 (다이얼로그 내)', method: 'ISBN 입력 필드 옆 "ISBN 조회" 버튼 클릭', expected: 'isbnsearch.org 새 탭에서 열림' },
          { id: 'v2-5.2.4', name: '직접 등록 완료', method: '모든 정보 입력 후 등록', expected: '도서 등록 완료, 기본 이미지로 저장' }
        ]
      }
    ]
  },
  {
    section: '6. 도서 관리 페이지 개선 테스트',
    subsections: [
      {
        title: '6.1 레이아웃 및 표시',
        items: [
          { id: 'v2-6.1.1', name: '그리드 레이아웃', method: '도서 관리 페이지 레이아웃 확인', expected: '2열 그리드 형태로 도서 카드 표시' },
          { id: 'v2-6.1.2', name: '도서 카드 구성', method: '도서 카드 내용 확인', expected: '표지, 제목, 저자, 출판사, 총 권수 표시' },
          { id: 'v2-6.1.3', name: '라벨별 정보 표시', method: '같은 도서 여러 권인 경우 확인', expected: '각 라벨별 상태, 라벨번호, 위치, 대여자 정보 표시' },
          { id: 'v2-6.1.4', name: 'NO IMAGE 표시', method: '표지 이미지 없는 도서 확인', expected: '회색 배경에 "NO IMAGE" 텍스트 표시' }
        ]
      },
      {
        title: '6.2 정렬 및 필터',
        items: [
          { id: 'v2-6.2.1', name: '기본 정렬', method: '도서 관리 페이지 접근 시 정렬 기본값', expected: '"라벨번호순"이 기본 선택' },
          { id: 'v2-6.2.2', name: '라벨번호순 정렬', method: '"라벨번호순" 선택', expected: '라벨번호 숫자 기준 정렬, 오름차순/내림차순 선택 가능' },
          { id: 'v2-6.2.3', name: '위치별로 보기', method: '"위치별로 보기" 선택', expected: '위치 선택 드롭다운 표시' },
          { id: 'v2-6.2.4', name: '위치 필터링', method: '"위치별로 보기" > "1번 칸" 선택', expected: '1번 칸에 있는 도서(권)를 포함한 도서 그룹만 표시' },
          { id: 'v2-6.2.5', name: '라벨번호/도서명 검색', method: '검색창에 라벨번호 또는 도서명 입력', expected: '해당하는 도서만 필터링' }
        ]
      },
      {
        title: '6.3 선택 기능',
        items: [
          { id: 'v2-6.3.1', name: '도서 정보 영역 클릭', method: '도서 카드의 회색 도서 정보 영역 클릭', expected: '해당 도서의 모든 권 선택 (파란색 테두리)' },
          { id: 'v2-6.3.2', name: '라벨별 정보 클릭', method: '개별 라벨번호 정보 영역 클릭', expected: '해당 권만 개별 선택' },
          { id: 'v2-6.3.3', name: '전체 선택', method: '상단 "전체 선택" 체크박스 클릭', expected: '모든 도서 선택' },
          { id: 'v2-6.3.4', name: '선택 해제', method: '선택된 도서 다시 클릭', expected: '선택 해제됨' }
        ]
      },
      {
        title: '6.4 페이지네이션',
        items: [
          { id: 'v2-6.4.1', name: '10개씩 표시', method: '도서 관리 페이지에서 목록 확인', expected: '한 페이지에 최대 10개 도서 그룹 표시' },
          { id: 'v2-6.4.2', name: '페이지 이동', method: '페이지네이션 번호 클릭', expected: '해당 페이지로 이동' },
          { id: 'v2-6.4.3', name: '필터 변경 시 초기화', method: '정렬/필터 변경 후 페이지 확인', expected: '1페이지로 자동 초기화' }
        ]
      },
      {
        title: '6.5 정보 수정',
        items: [
          { id: 'v2-6.5.1', name: '정보수정 링크 클릭', method: '도서의 "정보수정" 링크 클릭', expected: '정보 수정 다이얼로그 표시' },
          { id: 'v2-6.5.2', name: '수정 다이얼로그 정보 표시', method: '정보 수정 다이얼로그 확인', expected: '표지(확대), 제목, 현재 라벨번호, 위치 표시' },
          { id: 'v2-6.5.3', name: '카테고리 수정', method: '카테고리 드롭다운 변경', expected: '카테고리 변경 가능' },
          { id: 'v2-6.5.4', name: '라벨번호 수정', method: '라벨번호 입력 필드 수정', expected: '라벨번호 변경 가능' },
          { id: 'v2-6.5.5', name: '위치 수정', method: '위치 드롭다운 변경', expected: '위치 변경 가능' },
          { id: 'v2-6.5.6', name: '수정 저장', method: '수정 후 저장 버튼 클릭', expected: '변경 내용 저장, 목록에 반영' }
        ]
      },
      {
        title: '6.6 반납 처리 다이얼로그',
        items: [
          { id: 'v2-6.6.1', name: '반납 처리 버튼', method: '대여중인 도서의 "반납처리" 버튼 클릭', expected: '반납 확인 다이얼로그 표시' },
          { id: 'v2-6.6.2', name: '반납 다이얼로그 정보', method: '반납 확인 다이얼로그 내용 확인', expected: '도서 정보, 라벨번호, 위치 표시' },
          { id: 'v2-6.6.3', name: '다권 반납', method: '여러 도서 선택 후 상단 "반납 처리" 클릭', expected: '선택한 모든 도서 목록 표시' }
        ]
      }
    ]
  },
  {
    section: '7. 도서 대여 페이지 개선 테스트',
    subsections: [
      {
        title: '7.1 대여 확인 다이얼로그',
        items: [
          { id: 'v2-7.1.1', name: '단일 도서 대여 다이얼로그', method: '"대여하기" 버튼 클릭', expected: '도서 정보 + 라벨번호 + 위치 통합 카드 형태로 표시' },
          { id: 'v2-7.1.2', name: '라벨번호 선택 다이얼로그', method: '같은 도서 여러 권일 때 대여 시도', expected: '라벨번호 선택 다이얼로그 표시' },
          { id: 'v2-7.1.3', name: '위치 정보 확인', method: '대여 확인 다이얼로그에서 위치 확인', expected: '라벨번호와 위치 정보 표시, 위치 보기 버튼' },
          { id: 'v2-7.1.4', name: '안내 메시지', method: '대여 확인 다이얼로그 하단 확인', expected: '"위치와 라벨번호를 확인 후 해당 도서를 가져가주세요" 표시' }
        ]
      },
      {
        title: '7.2 다권 대여 다이얼로그',
        items: [
          { id: 'v2-7.2.1', name: '다권 대여 스타일', method: '여러 도서 선택 후 "대여 신청" 클릭', expected: '단일 대여와 동일한 카드 스타일로 각 도서 표시' },
          { id: 'v2-7.2.2', name: '스크롤 동작', method: '5권 이상 선택하여 대여 시도', expected: '도서 목록 세로 스크롤 가능' },
          { id: 'v2-7.2.3', name: '각 도서 정보', method: '다권 대여 다이얼로그 내 도서 카드 확인', expected: '각 도서별 표지, 제목, 저자, 출판사, 라벨번호, 위치 표시' }
        ]
      },
      {
        title: '7.3 페이지네이션',
        items: [
          { id: 'v2-7.3.1', name: '도서 대여 목록 페이지네이션', method: '도서 대여 페이지 하단 확인', expected: '10개씩 표시, 페이지네이션 컴포넌트' },
          { id: 'v2-7.3.2', name: '페이지네이션 스타일', method: '페이지네이션 스타일 확인', expected: '도서 관리 페이지와 동일한 스타일' }
        ]
      },
      {
        title: '7.4 도서 카드',
        items: [
          { id: 'v2-7.4.1', name: '위치 정보 미표시', method: '도서 대여 메인 목록의 도서 카드 확인', expected: '위치 정보 표시 안됨 (대여 확인 다이얼로그에서만 표시)' },
          { id: 'v2-7.4.2', name: '저자/출판사 형식', method: '도서 카드 저자/출판사 표시 확인', expected: '"저자: [저자명]", "출판사: [출판사명]" 형식' },
          { id: 'v2-7.4.3', name: '빈 저자/출판사', method: '저자/출판사 정보 없는 도서 확인', expected: '해당 필드 미표시, 박스 크기 유지' }
        ]
      }
    ]
  },
  {
    section: '8. 마이페이지 개선 테스트',
    subsections: [
      {
        title: '8.1 반납 다이얼로그',
        items: [
          { id: 'v2-8.1.1', name: '반납 확인 다이얼로그 스타일', method: '도서 선택 후 "반납하기" 클릭', expected: '대여 확인과 동일한 카드 스타일' },
          { id: 'v2-8.1.2', name: '도서 정보 표시', method: '반납 확인 다이얼로그 내용 확인', expected: '표지, 제목, 저자, 출판사, 라벨번호, 위치 표시' },
          { id: 'v2-8.1.3', name: '반납 안내 메시지', method: '반납 확인 다이얼로그 하단 확인', expected: '"위치와 라벨번호를 확인 후 해당 위치에 도서를 반납해주세요" 표시' },
          { id: 'v2-8.1.4', name: '다권 반납 스크롤', method: '여러 도서 선택 후 반납', expected: '도서 목록 세로 스크롤 가능' }
        ]
      },
      {
        title: '8.2 위치 안내 팝업',
        items: [
          { id: 'v2-8.2.1', name: '위치 아이콘 클릭', method: '대여 목록 도서의 위치 ⓘ 아이콘 클릭', expected: '위치 안내 팝업 표시' },
          { id: 'v2-8.2.2', name: '위치 텍스트 클릭', method: '위치 텍스트 영역 클릭', expected: '팝업 열리지 않음 (아이콘 클릭 시에만)' }
        ]
      }
    ]
  },
  {
    section: '9. 도서 카드 공통 변경 테스트',
    subsections: [
      {
        title: '9.1 NO IMAGE 표시',
        items: [
          { id: 'v2-9.1.1', name: '이미지 없는 도서', method: '표지 이미지 없는 도서 확인 (전체 페이지)', expected: '동일 크기 박스에 회색 배경 + "NO IMAGE" 텍스트' },
          { id: 'v2-9.1.2', name: '다이얼로그 내 NO IMAGE', method: '이미지 없는 도서 대여/반납 시 다이얼로그 확인', expected: 'NO IMAGE 플레이스홀더 표시' }
        ]
      },
      {
        title: '9.2 저자/출판사 표시',
        items: [
          { id: 'v2-9.2.1', name: '표시 형식', method: '도서 카드 저자/출판사 확인', expected: '"저자: [저자명]", "출판사: [출판사명]" 형식' },
          { id: 'v2-9.2.2', name: '긴 텍스트 처리', method: '저자/출판사명이 긴 도서 확인', expected: '한 줄에서 ... 으로 말줄임 처리' },
          { id: 'v2-9.2.3', name: '빈 정보 처리', method: '저자 또는 출판사 정보 없는 도서 확인', expected: '해당 필드 미표시, 전체 박스 높이 유지' }
        ]
      }
    ]
  },
  {
    section: '10. 카테고리 관리 테스트',
    subsections: [
      {
        title: '10.1 카테고리 관리 링크',
        items: [
          { id: 'v2-10.1.1', name: '카테고리 관리 링크 표시', method: '도서 등록 다이얼로그의 카테고리 셀렉트박스 위 확인', expected: '"카테고리 관리" 텍스트 링크 표시' },
          { id: 'v2-10.1.2', name: '카테고리 관리 링크 클릭', method: '"카테고리 관리" 링크 클릭', expected: '준비 중 안내 메시지 (추후 관리 페이지 연결 예정)' }
        ]
      }
    ]
  }
]

/**
 * v2 전체 테스트 항목 수 계산
 */
export const getTotalTestCountV2 = () => {
  let count = 0
  TEST_SCENARIOS_V2.forEach(section => {
    section.subsections.forEach(subsection => {
      count += subsection.items.length
    })
  })
  return count
}

/**
 * v2 모든 테스트 ID 목록 반환
 */
export const getAllTestIdsV2 = () => {
  const ids = []
  TEST_SCENARIOS_V2.forEach(section => {
    section.subsections.forEach(subsection => {
      subsection.items.forEach(item => {
        ids.push(item.id)
      })
    })
  })
  return ids
}

