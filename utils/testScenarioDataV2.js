/**
 * 테스트 시나리오 데이터 V2
 * 2026.01.19 - 보안정책, 반납알림, 설정관리 등 신규 기능 통합
 * 
 * 이후 생성되는 테스트 세션은 이 템플릿을 사용합니다.
 * 기존 세션은 testScenarioData.js (V1)를 계속 사용합니다.
 */

export const TEST_SCENARIOS_V2 = [
  {
    section: '1. 인증 테스트',
    subsections: [
      {
        title: '1.1 회원가입',
        items: [
          { id: '1.1.1', name: '회원가입 페이지 접근', method: '로그인 페이지에서 "회원가입" 클릭', expected: '회원가입 페이지로 이동' },
          { id: '1.1.2', name: '필수 입력값 검증', method: '빈 폼으로 "회원가입" 클릭', expected: '필수 입력 오류 메시지 표시' },
          { id: '1.1.3', name: '이메일 형식 검증', method: '잘못된 이메일 형식 입력 (예: "test")', expected: '이메일 형식 오류 메시지' },
          { id: '1.1.4', name: '회사 이메일 검증', method: '외부 이메일 입력 (예: "test@gmail.com")', expected: '"@concentrix.com 이메일만 사용 가능합니다" 오류' },
          { id: '1.1.5', name: '비밀번호 확인 불일치', method: '비밀번호와 확인이 다르게 입력', expected: '불일치 오류 메시지' },
          { id: '1.1.6', name: '정상 회원가입', method: '모든 정보 올바르게 입력 후 가입', expected: '인증 이메일 발송 안내 표시' },
          { id: '1.1.7', name: '중복 이메일 가입 시도', method: '이미 가입된 이메일로 재가입', expected: '"이미 사용 중인 이메일" 오류' }
        ]
      },
      {
        title: '1.2 이메일 인증',
        items: [
          { id: '1.2.1', name: '인증 이메일 수신', method: '회원가입 후 이메일 확인', expected: 'CNX Library 인증 이메일 수신 (자체 토큰 시스템)' },
          { id: '1.2.2', name: '인증 링크 클릭', method: '이메일의 인증 링크 클릭', expected: 'verify-email 페이지로 이동' },
          { id: '1.2.3', name: '인증 완료 처리', method: '인증 페이지에서 "로그인하기" 클릭', expected: '로그인 페이지로 이동' },
          { id: '1.2.4', name: '미인증 상태 로그인', method: '이메일 미인증 상태에서 로그인 시도', expected: '"이메일 인증이 완료되지 않았습니다" 오류' },
          { id: '1.2.5', name: '인증 이메일 재발송', method: '로그인 페이지에서 재발송 요청', expected: '인증 이메일 재발송' },
          { id: '1.2.6', name: '미인증 계정 자동 삭제', method: '24시간 이상 미인증 계정 확인 (Firebase Console)', expected: '매일 새벽 3시 자동 삭제됨' }
        ]
      },
      {
        title: '1.3 로그인',
        items: [
          { id: '1.3.1', name: '정상 로그인', method: '올바른 이메일/비밀번호 입력', expected: '메인 페이지로 이동' },
          { id: '1.3.2', name: '잘못된 비밀번호', method: '틀린 비밀번호 입력', expected: '"이메일 또는 비밀번호가 올바르지 않습니다" 오류' },
          { id: '1.3.3', name: '존재하지 않는 계정', method: '미등록 이메일로 로그인', expected: '"이메일 또는 비밀번호가 올바르지 않습니다" 오류' },
          { id: '1.3.4', name: '자동로그인 UI 제거 확인', method: '로그인 페이지 접속', expected: '"로그인 상태 유지" 체크박스가 없음' },
          { id: '1.3.5', name: '브라우저 닫고 재접속', method: '로그인 후 브라우저 완전히 닫고 재접속', expected: '로그인 페이지로 이동 (로그아웃 상태)' },
          { id: '1.3.6', name: '탭 닫고 재접속', method: '로그인 후 탭만 닫고 새 탭에서 재접속', expected: '로그인 페이지로 이동 (로그아웃 상태)' },
          { id: '1.3.7', name: '새 탭 열기', method: '로그인 상태에서 새 탭으로 사이트 열기', expected: '로그인 상태 유지됨 (같은 세션)' },
          { id: '1.3.8', name: '로그아웃', method: '사이드 메뉴에서 "로그아웃" 클릭', expected: '로그인 페이지로 이동' }
        ]
      },
      {
        title: '1.4 10분 비활성 자동 로그아웃',
        items: [
          { id: '1.4.1', name: '비활성 타이머 작동', method: '로그인 후 10분간 아무 조작 없이 대기', expected: '자동 로그아웃되어 로그인 페이지로 이동' },
          { id: '1.4.2', name: '활동 시 타이머 리셋', method: '9분 대기 후 마우스 클릭, 다시 10분 대기', expected: '클릭 후 10분 뒤에 로그아웃' },
          { id: '1.4.3', name: '마우스 이동으로 활동 감지', method: '마우스 움직임만으로 활동 확인', expected: '타이머 리셋됨' },
          { id: '1.4.4', name: '키보드 입력으로 활동 감지', method: '키보드 입력만으로 활동 확인', expected: '타이머 리셋됨' },
          { id: '1.4.5', name: '스크롤로 활동 감지', method: '페이지 스크롤로 활동 확인', expected: '타이머 리셋됨' },
          { id: '1.4.6', name: '터치로 활동 감지 (모바일)', method: '터치 이벤트로 활동 확인', expected: '타이머 리셋됨' }
        ]
      },
      {
        title: '1.5 비밀번호 재설정',
        items: [
          { id: '1.5.1', name: '비밀번호 찾기 페이지 접근', method: '로그인 페이지에서 "비밀번호 찾기" 클릭', expected: 'forgot-password 페이지로 이동' },
          { id: '1.5.2', name: '재설정 이메일 발송', method: '가입된 이메일 입력 후 요청', expected: '비밀번호 재설정 이메일 발송' },
          { id: '1.5.3', name: '재설정 링크 접속', method: '이메일의 재설정 링크 클릭', expected: 'reset-password 페이지로 이동' },
          { id: '1.5.4', name: '새 비밀번호 설정', method: '새 비밀번호 입력 후 변경', expected: '비밀번호 변경 완료, 로그인 페이지 이동' },
          { id: '1.5.5', name: '변경된 비밀번호로 로그인', method: '새 비밀번호로 로그인', expected: '정상 로그인' }
        ]
      }
    ]
  },
  {
    section: '2. 메인 페이지 테스트',
    subsections: [
      {
        title: '2.1 메인 페이지 기본',
        items: [
          { id: '2.1.1', name: '페이지 로딩', method: '메인 페이지 접속', expected: '모든 섹션 정상 표시' },
          { id: '2.1.2', name: '사용자 이름 표시', method: '로그인 후 메인 페이지 확인', expected: '"[이름]님의 도서 대여 현황" 표시' },
          { id: '2.1.3', name: '대여 현황 표시', method: '대여중인 도서가 있는 상태에서 확인', expected: '대여중/반납예정/연체중 카운트 정상' },
          { id: '2.1.4', name: '베스트셀러 스와이퍼', method: '베스트셀러 섹션 확인', expected: '알라딘 베스트셀러 10권 표시' },
          { id: '2.1.5', name: '스와이퍼 네비게이션', method: '좌/우 화살표 클릭', expected: '슬라이드 이동' },
          { id: '2.1.6', name: '헤더 알림 아이콘', method: '알림 벨 아이콘 확인', expected: '읽지 않은 알림 수 배지 표시' },
          { id: '2.1.7', name: '사이드 메뉴', method: '햄버거 메뉴 클릭', expected: '사이드 네비게이션 열림' }
        ]
      },
      {
        title: '2.2 신규 도서 (NEW)',
        items: [
          { id: '2.2.1', name: '신규 도서 스와이퍼', method: '센터별 신규 도서 섹션 확인', expected: '기본 칸(설정 관리에서 설정) 도서만 표시 (NEW 배지)' },
          { id: '2.2.2', name: '기본 칸 도서 NEW 표시', method: '기본 칸으로 설정된 위치의 도서 확인', expected: 'NEW 배지 표시' },
          { id: '2.2.3', name: '다른 위치 도서 NEW 미표시', method: '기본 칸이 아닌 위치의 도서 확인', expected: 'NEW 배지 미표시' },
          { id: '2.2.4', name: '위치 변경 시 NEW 제거', method: '기본 칸 도서를 다른 위치로 변경 후 확인', expected: '신규 도서 섹션에서 사라짐' },
          { id: '2.2.5', name: '신규 도서 반납알림 버튼', method: '모든 권 대여중인 신규 도서 확인', expected: '"반납알림받기" 버튼 표시' },
          { id: '2.2.6', name: '신규 도서 반납알림 신청', method: '"반납알림받기" 클릭', expected: '"반납 알림 신청됨" 표시' },
          { id: '2.2.7', name: '내가 대여중인 신규 도서', method: '내가 대여중인 신규 도서 확인', expected: '"반납알림받기" 버튼 미표시' }
        ]
      }
    ]
  },
  {
    section: '3. 도서 대여 테스트',
    subsections: [
      {
        title: '3.1 도서 목록 조회',
        items: [
          { id: '3.1.1', name: '도서 목록 페이지 접근', method: '메뉴에서 "도서 대여" 클릭', expected: '/books 페이지로 이동' },
          { id: '3.1.2', name: '센터 필터링', method: '센터 선택 드롭다운 변경', expected: '해당 센터 도서만 표시' },
          { id: '3.1.3', name: '도서 검색', method: '검색창에 도서명 또는 ISBN-13 입력', expected: '검색어와 일치하는 도서 표시' },
          { id: '3.1.4', name: '정렬 기능', method: '정렬 드롭다운 변경 (등록일순/제목순)', expected: '정렬 기준에 따라 목록 재정렬' },
          { id: '3.1.5', name: '도서 카드 정보', method: '도서 카드 확인', expected: '제목, 저자, 출판사, 상태 표시' },
          { id: '3.1.6', name: '빈 목록', method: '검색 결과 없을 때', expected: '"검색 결과가 없습니다" 메시지' },
          { id: '3.1.7', name: '페이지네이션', method: '도서 목록 하단 확인', expected: '10개씩 표시, 페이지 이동 가능' }
        ]
      },
      {
        title: '3.2 도서 대여',
        items: [
          { id: '3.2.1', name: '도서 선택', method: '대여 가능한 도서 카드 클릭', expected: '체크박스 선택됨' },
          { id: '3.2.2', name: '복수 도서 선택 대여', method: '여러 권 선택 후 "대여 신청" 클릭', expected: '선택한 모든 도서 대여 처리' },
          { id: '3.2.3', name: '개별 도서 대여', method: '도서 카드의 "대여" 버튼 클릭', expected: '해당 도서 즉시 대여 처리' },
          { id: '3.2.4', name: '같은 센터 도서 대여', method: '내 근무지와 동일 센터 도서 대여', expected: '즉시 대여 완료' },
          { id: '3.2.5', name: '대여 후 상태 변경', method: '대여 완료 후 도서 카드 확인', expected: '"대여중" 상태로 변경' },
          { id: '3.2.6', name: '다른 센터 도서 대여 신청', method: '다른 센터 도서의 "대여 신청" 클릭', expected: '"대여 신청 중" 상태로 변경, 관리자 승인 대기' },
          { id: '3.2.7', name: '대여중인 도서', method: '대여중인 도서 카드 확인', expected: '대여 버튼 미노출, "대여중" 상태 표시, 선택 불가' },
          { id: '3.2.8', name: '최대 대여 권수 제한', method: '5권 대여 상태에서 추가 대여 시도', expected: '"5권을 대여중입니다. 반납 후 대여해주세요" 메시지' },
          { id: '3.2.9', name: '남은 대여 가능 권수 표시', method: '3권 대여 상태에서 도서 목록 확인', expected: '"3권 대여중, 2권 추가 가능" 표시' }
        ]
      },
      {
        title: '3.3 읽은 책 대여 확인',
        items: [
          { id: '3.3.1', name: '읽은 책 대여 시도', method: '읽은 책 목록에 있는 도서 대여 시도', expected: '"이미 읽은 책입니다. 정말로 대여하시겠습니까?" 확인 메시지' },
          { id: '3.3.2', name: '확인 후 대여', method: '확인 다이얼로그에서 "확인" 클릭', expected: '정상 대여 처리' },
          { id: '3.3.3', name: '취소 시 대여 안됨', method: '확인 다이얼로그에서 "취소" 클릭', expected: '대여 취소됨' },
          { id: '3.3.4', name: '같은 ISBN 다른 라벨', method: '같은 ISBN의 다른 라벨번호 도서 대여', expected: '읽은 책 확인 메시지 표시' },
          { id: '3.3.5', name: '미열람 도서 대여', method: '읽은 책 목록에 없는 도서 대여', expected: '확인 메시지 없이 바로 대여' }
        ]
      },
      {
        title: '3.4 반납 알림 신청',
        items: [
          { id: '3.4.1', name: '대여중 도서 상태 표시', method: '모든 권이 대여중인 도서 확인', expected: '"대여중인 도서입니다." 메시지 표시' },
          { id: '3.4.2', name: '반납알림받기 버튼 표시', method: '모든 권이 대여중인 도서 확인', expected: '"반납알림받기" 버튼 표시' },
          { id: '3.4.3', name: '반납알림 신청', method: '"반납알림받기" 버튼 클릭', expected: '"반납 알림 신청됨" 텍스트로 변경' },
          { id: '3.4.4', name: '내가 대여중인 도서 - 버튼 미표시', method: '내가 대여중인 도서 확인', expected: '"반납알림받기" 버튼 미표시' },
          { id: '3.4.5', name: '같은 ISBN 여러 권 중 내가 대여', method: '같은 책 여러 권 중 내가 1권 대여 중일 때', expected: '"반납알림받기" 버튼 미표시' },
          { id: '3.4.6', name: '일부 권만 대여중 - 버튼 미표시', method: '3권 중 2권만 대여중인 도서 확인', expected: '"반납알림받기" 버튼 미표시 (대여 가능하므로)' },
          { id: '3.4.7', name: '반납 알림 신청됨 스타일', method: '"반납 알림 신청됨" 표시 확인', expected: '아이콘 없음, 짙은 회색 텍스트' }
        ]
      },
      {
        title: '3.5 반납 알림 수신',
        items: [
          { id: '3.5.1', name: '반납 시 알림 발송', method: '반납 알림 신청한 도서가 반납됨', expected: '신청자에게 "도서가 반납되었습니다" 알림' },
          { id: '3.5.2', name: '알림 클릭 시 이동', method: '반납 알림 클릭', expected: '/books 페이지로 이동' },
          { id: '3.5.3', name: '이메일 알림', method: '이메일 알림 활성화 상태에서 반납', expected: '이메일로 반납 알림 수신' }
        ]
      },
      {
        title: '3.6 대여 다이얼로그',
        items: [
          { id: '3.6.1', name: '단일 도서 대여 다이얼로그', method: '"대여하기" 버튼 클릭', expected: '도서 정보 + 라벨번호 + 위치 카드 형태로 표시' },
          { id: '3.6.2', name: '라벨번호 선택', method: '같은 도서 여러 권일 때 대여 시도', expected: '라벨번호 선택 옵션 표시' },
          { id: '3.6.3', name: '위치 정보 확인', method: '대여 확인 다이얼로그에서 위치 확인', expected: '라벨번호와 위치 정보 표시' },
          { id: '3.6.4', name: '다권 대여 다이얼로그', method: '여러 도서 선택 후 "대여 신청" 클릭', expected: '각 도서별 표지, 제목, 저자, 라벨번호, 위치 표시' },
          { id: '3.6.5', name: '안내 메시지', method: '대여 확인 다이얼로그 하단 확인', expected: '"위치와 라벨번호를 확인 후 해당 도서를 가져가주세요" 표시' }
        ]
      }
    ]
  },
  {
    section: '4. 마이페이지 테스트',
    subsections: [
      {
        title: '4.1 내 대여 목록',
        items: [
          { id: '4.1.1', name: '마이페이지 접근', method: '메뉴에서 "마이페이지" 클릭', expected: '/mypage 페이지로 이동' },
          { id: '4.1.2', name: '대여중인 도서 표시', method: '내 대여 목록 섹션 확인', expected: '현재 대여중인 도서 목록' },
          { id: '4.1.3', name: '센터 필터링', method: '센터 선택 드롭다운 변경', expected: '해당 센터 대여 도서만 표시' },
          { id: '4.1.4', name: '반납예정일 표시', method: '대여 도서 카드 확인', expected: '반납예정일 표시 (대여일 +7일)' },
          { id: '4.1.5', name: '도서 선택', method: '도서 카드 클릭', expected: '체크박스 선택됨' },
          { id: '4.1.6', name: '단일 도서 반납', method: '1권 선택 후 "반납하기" 클릭', expected: '반납 확인 → 반납 완료' },
          { id: '4.1.7', name: '복수 도서 반납', method: '여러 권 선택 후 "반납하기" 클릭', expected: '선택한 모든 도서 반납 완료' }
        ]
      },
      {
        title: '4.2 대여 신청 목록',
        items: [
          { id: '4.2.1', name: '타 센터 신청 시 섹션 표시', method: '타 센터 도서 대여 신청 후 마이페이지 확인', expected: '"대여 신청 목록" 섹션 표시' },
          { id: '4.2.2', name: '같은 센터 선택 시 미표시', method: '본인 근무지 센터 선택', expected: '"대여 신청 목록" 섹션 미표시' },
          { id: '4.2.3', name: '신청 도서 정보 표시', method: '대여 신청 목록 확인', expected: '도서 표지, 제목, 저자, 신청일, 취소 버튼 표시' },
          { id: '4.2.4', name: '신청 취소', method: '"취소" 버튼 클릭', expected: '취소 확인 → 목록에서 제거' }
        ]
      },
      {
        title: '4.3 반납 다이얼로그',
        items: [
          { id: '4.3.1', name: '반납 확인 다이얼로그 스타일', method: '도서 선택 후 "반납하기" 클릭', expected: '대여 확인과 동일한 카드 스타일' },
          { id: '4.3.2', name: '도서 정보 표시', method: '반납 확인 다이얼로그 내용 확인', expected: '표지, 제목, 저자, 출판사, 라벨번호, 위치 표시' },
          { id: '4.3.3', name: '반납 안내 메시지', method: '반납 확인 다이얼로그 하단 확인', expected: '"위치와 라벨번호를 확인 후 해당 위치에 도서를 반납해주세요" 표시' },
          { id: '4.3.4', name: '다권 반납 스크롤', method: '여러 도서 선택 후 반납', expected: '도서 목록 세로 스크롤 가능' }
        ]
      },
      {
        title: '4.4 신청한 책 목록',
        items: [
          { id: '4.4.1', name: '신청한 책 섹션 표시', method: '도서 신청 후 마이페이지 확인', expected: '리스트로 신청 도서 표시 (10개씩 페이지네이션)' },
          { id: '4.4.2', name: '신청일 및 취소 버튼 표시', method: '신청 도서 카드 확인', expected: '신청일 표시, "신청 취소" 버튼 표시' },
          { id: '4.4.3', name: '신청 취소', method: '"신청 취소" 버튼 클릭', expected: '취소 확인 → 목록에서 제거' }
        ]
      },
      {
        title: '4.5 읽은 책 목록',
        items: [
          { id: '4.5.1', name: '읽은 책 목록 표시', method: '반납 완료 후 확인', expected: '반납한 도서가 읽은 책 목록에 추가' },
          { id: '4.5.2', name: '중복 대여 기록', method: '같은 책 재대여 후 반납', expected: '대여 횟수 증가, 목록에 1개만 표시' },
          { id: '4.5.3', name: '읽은 책 삭제', method: '읽은 책 선택 후 "삭제하기" 클릭', expected: '목록에서 제거' }
        ]
      },
      {
        title: '4.6 정보 수정',
        items: [
          { id: '4.6.1', name: '정보수정 페이지 접근', method: '"정보수정" 버튼 클릭', expected: '/mypage/edit 페이지로 이동' },
          { id: '4.6.2', name: '현재 정보 표시', method: '페이지 로딩 확인', expected: '현재 이름, 근무지 표시' },
          { id: '4.6.3', name: '이름 변경', method: '이름 수정 후 저장', expected: '변경 완료 메시지, 마이페이지 반영' },
          { id: '4.6.4', name: '근무지 변경', method: '근무지 선택 변경 후 저장', expected: '변경 완료, 센터 필터 기본값 변경' },
          { id: '4.6.5', name: '비밀번호 변경', method: '"비밀번호 변경" 버튼 클릭', expected: '비밀번호 재설정 링크 이메일 발송 성공 메시지' }
        ]
      },
      {
        title: '4.7 위치 안내 팝업',
        items: [
          { id: '4.7.1', name: '위치 아이콘 클릭', method: '대여 목록 도서의 위치 ⓘ 아이콘 클릭', expected: '위치 안내 팝업 표시' },
          { id: '4.7.2', name: '서가 이미지 표시', method: '위치 안내 팝업 내용 확인', expected: '설정된 서가 이미지와 위치 설명 표시' },
          { id: '4.7.3', name: '팝업 닫기', method: '팝업 외부 또는 닫기 버튼 클릭', expected: '팝업 정상 닫힘' },
          { id: '4.7.4', name: '위치 텍스트 클릭', method: '위치 텍스트 영역 클릭', expected: '팝업 열리지 않음 (아이콘 클릭 시에만 열림)' },
          { id: '4.7.5', name: '이미지 없는 칸', method: '이미지 미매핑 칸의 위치 팝업', expected: '기본 메시지 또는 이미지 없음 표시' }
        ]
      }
    ]
  },
  {
    section: '5. 도서 신청 테스트',
    subsections: [
      {
        title: '5.1 도서 검색',
        items: [
          { id: '5.1.1', name: '도서 신청 페이지 접근', method: '메뉴에서 "도서 신청" 클릭', expected: '/books/request 페이지로 이동' },
          { id: '5.1.2', name: '센터 변경', method: '센터 선택 드롭다운 변경', expected: '선택한 센터로 신청 대상 변경' },
          { id: '5.1.3', name: '도서명 검색', method: '검색창에 도서명 입력 후 검색', expected: '네이버 도서 API 검색 결과 표시' },
          { id: '5.1.4', name: 'ISBN-13 검색', method: '검색창에 ISBN-13 입력 (예: "9788966262472")', expected: 'ISBN에 해당하는 도서 정확히 검색됨' },
          { id: '5.1.5', name: '검색 결과 표시', method: '검색 완료 후 확인', expected: '도서 목록 그리드 형태로 표시, 페이지네이션' },
          { id: '5.1.6', name: '베스트셀러 표시', method: '베스트셀러 섹션 확인', expected: '알라딘 베스트셀러 스와이퍼 표시' },
          { id: '5.1.7', name: '세트 상품 자동 제외', method: '일반 도서명 검색 (예: "해리포터")', expected: '세트/전집 상품이 결과에서 자동 제외됨' },
          { id: '5.1.8', name: '검색 결과 없음 안내', method: '결과 없는 검색어 입력 (예: "zzzxxx123")', expected: '"검색 결과가 없습니다" 안내 메시지 표시' }
        ]
      },
      {
        title: '5.2 도서 신청',
        items: [
          { id: '5.2.1', name: '이미 등록된 도서', method: '등록된 도서 검색', expected: '"이미 등록된 도서" 표시' },
          { id: '5.2.2', name: '도서 신청하기', method: '미등록 도서의 "신청하기" 클릭', expected: '신청 확인 → 신청 완료 메시지' },
          { id: '5.2.3', name: '신청 후 상태', method: '신청한 도서 재검색', expected: '"신청완료" 상태 표시' }
        ]
      }
    ]
  },
  {
    section: '6. 관리자 기능 테스트',
    subsections: [
      {
        title: '6.1 도서 등록 - 검색 등록',
        items: [
          { id: '6.1.1', name: '관리자 메뉴 접근', method: '관리자 계정으로 로그인 후 메뉴 확인', expected: '"관리자 메뉴" 표시' },
          { id: '6.1.2', name: '도서 등록 페이지 접근', method: '관리자 메뉴 > 도서 등록', expected: '/admin/books/register 페이지로 이동' },
          { id: '6.1.3', name: '센터 변경', method: '센터 선택 드롭다운 변경', expected: '선택한 센터에 도서 등록 가능' },
          { id: '6.1.4', name: '도서 검색', method: '도서명 또는 ISBN-13으로 검색', expected: '네이버 도서 API 검색 결과 그리드 표시' },
          { id: '6.1.5', name: '베스트셀러 표시', method: '베스트셀러 섹션 확인', expected: '알라딘 베스트셀러 스와이퍼 표시' },
          { id: '6.1.6', name: '도서 등록 다이얼로그', method: '검색된 도서의 "등록하기" 클릭', expected: '등록 다이얼로그 표시 (카테고리, 수량, 라벨번호 4자리, 위치)' },
          { id: '6.1.7', name: '라벨번호 형식', method: '등록 다이얼로그 라벨번호 미리보기 확인', expected: '카테고리_센터코드+4자리 형식 (예: 국내소설_20001)' },
          { id: '6.1.8', name: '센터코드 확인', method: '용산/강남센터 각각 등록 시도', expected: '용산센터: 2, 강남센터: 1 코드 부여' },
          { id: '6.1.9', name: '라벨번호 중복 체크', method: '이미 사용중인 라벨번호 4자리 입력', expected: '"이미 사용중인 라벨번호입니다" 메시지' },
          { id: '6.1.10', name: '위치 선택', method: '위치 드롭다운 확인', expected: '설정 관리에서 설정한 칸 목록 표시, 기본 칸 자동 선택' },
          { id: '6.1.11', name: '다권 등록 필드', method: '수량 2 이상 선택', expected: '권수만큼 라벨번호/위치 입력 필드 생성' },
          { id: '6.1.12', name: '다권 등록 완료', method: '3권 설정 후 등록 완료', expected: '3개의 개별 도서 레코드 생성' },
          { id: '6.1.13', name: '등록 완료', method: '모든 정보 입력 후 "등록" 클릭', expected: '등록 완료 메시지 (라벨번호 표시)' },
          { id: '6.1.14', name: '카테고리 관리 링크', method: '도서 등록 다이얼로그에서 "카테고리 관리" 클릭', expected: '/admin/settings 페이지로 이동' }
        ]
      },
      {
        title: '6.2 도서 등록 - 추가/직접 등록',
        items: [
          { id: '6.2.1', name: '등록된 도서 추가 등록', method: '이미 등록된 도서 검색 결과 확인', expected: '"등록된 도서입니다" + "추가 등록" 버튼 표시' },
          { id: '6.2.2', name: '추가 등록 실행', method: '"추가 등록" 버튼 클릭 후 등록', expected: '새 라벨번호로 추가 등록 가능' },
          { id: '6.2.3', name: '검색 결과 없음 시 버튼', method: '검색 결과 없는 키워드 검색', expected: '"ISBN 조회하기", "직접 등록하기" 버튼 표시' },
          { id: '6.2.4', name: 'ISBN 조회 외부 링크', method: '"ISBN 조회하기" 버튼 클릭', expected: 'isbnsearch.org 새 탭에서 열림' },
          { id: '6.2.5', name: '직접 등록 다이얼로그', method: '"직접 등록하기" 버튼 클릭', expected: '직접 등록 다이얼로그 표시' },
          { id: '6.2.6', name: '직접 등록 필수 입력', method: '직접 등록 다이얼로그 필드 확인', expected: '도서명*, ISBN* 필수, 저자/출판사 선택' },
          { id: '6.2.7', name: '직접 등록 완료', method: '모든 정보 입력 후 등록', expected: '도서 등록 완료, 기본 이미지로 저장' }
        ]
      },
      {
        title: '6.3 도서 등록 - 신청 도서',
        items: [
          { id: '6.3.1', name: '도서 신청 목록', method: '도서 신청 목록 섹션 확인', expected: '사용자들이 신청한 도서 표시' },
          { id: '6.3.2', name: '신청자 정보 표시', method: '신청 도서 카드 확인', expected: '신청자 근무지, 이름 표시' },
          { id: '6.3.3', name: '신청 도서 등록', method: '신청 도서의 "등록하기" 클릭', expected: '등록 완료, 신청자에게 알림 발송' }
        ]
      },
      {
        title: '6.4 도서 관리 - 목록/필터',
        items: [
          { id: '6.4.1', name: '도서 관리 페이지 접근', method: '관리자 메뉴 > 도서 관리', expected: '/admin/books 페이지로 이동' },
          { id: '6.4.2', name: '센터 변경', method: '센터 선택 드롭다운 변경', expected: '선택한 센터 도서만 표시 (모든 센터 관리 가능)' },
          { id: '6.4.3', name: '그리드 레이아웃', method: '도서 목록 레이아웃 확인', expected: '2열 그리드 형태로 도서 카드 표시' },
          { id: '6.4.4', name: '도서 카드 구성', method: '도서 카드 내용 확인', expected: '표지, 제목, 저자, 출판사, 총 권수, 각 라벨별 상태/위치' },
          { id: '6.4.5', name: '라벨번호순 정렬', method: '정렬 "라벨번호순" 선택', expected: '라벨번호 숫자 기준 정렬' },
          { id: '6.4.6', name: '위치별로 보기', method: '"위치별로 보기" > 특정 칸 선택', expected: '해당 칸에 있는 도서만 필터링' },
          { id: '6.4.7', name: '라벨번호/도서명 검색', method: '검색창에 라벨번호 또는 도서명 입력', expected: '해당하는 도서만 필터링' },
          { id: '6.4.8', name: '페이지네이션', method: '도서 목록 하단 확인', expected: '10개씩 표시, 페이지네이션 컴포넌트' }
        ]
      },
      {
        title: '6.5 도서 관리 - 선택/삭제',
        items: [
          { id: '6.5.1', name: '도서 정보 영역 클릭', method: '도서 카드의 도서 정보 영역 클릭', expected: '해당 도서의 모든 권 선택 (파란색 테두리)' },
          { id: '6.5.2', name: '라벨별 정보 클릭', method: '개별 라벨번호 정보 영역 클릭', expected: '해당 권만 개별 선택' },
          { id: '6.5.3', name: '전체 선택', method: '상단 "전체 선택" 체크박스 클릭', expected: '모든 도서 선택' },
          { id: '6.5.4', name: '도서 삭제', method: '도서 카드의 삭제 버튼 클릭', expected: '삭제 확인 → 삭제 완료' },
          { id: '6.5.5', name: '대여중 도서 삭제 시도', method: '대여중인 도서 삭제 시도', expected: '삭제 불가 메시지' }
        ]
      },
      {
        title: '6.6 도서 관리 - 정보수정',
        items: [
          { id: '6.6.1', name: '정보수정 링크 클릭', method: '도서의 "정보수정" 링크 클릭', expected: '정보 수정 다이얼로그 표시' },
          { id: '6.6.2', name: '수정 다이얼로그 정보', method: '정보 수정 다이얼로그 확인', expected: '표지(확대), 제목, 현재 라벨번호, 위치 표시' },
          { id: '6.6.3', name: '카테고리 수정', method: '카테고리 드롭다운 변경', expected: '카테고리 변경 가능' },
          { id: '6.6.4', name: '라벨번호 수정', method: '라벨번호 입력 필드 수정', expected: '라벨번호 변경 가능' },
          { id: '6.6.5', name: '위치 수정', method: '위치 드롭다운 변경', expected: '위치 변경 가능' },
          { id: '6.6.6', name: '수정 저장', method: '수정 후 저장 버튼 클릭', expected: '변경 내용 저장, 목록에 반영' }
        ]
      },
      {
        title: '6.7 도서 관리 - 대여/반납',
        items: [
          { id: '6.7.1', name: '대여 현황 표시', method: '대여중인 도서 카드 확인', expected: '대여자 정보 (근무지, 이름, 이메일) 표시' },
          { id: '6.7.2', name: '반납예정일 표시', method: '대여중 도서 확인', expected: '반납예정일 표시' },
          { id: '6.7.3', name: '반납 처리 버튼', method: '대여중인 도서의 "반납처리" 버튼 클릭', expected: '반납 확인 다이얼로그 표시' },
          { id: '6.7.4', name: '반납 다이얼로그 정보', method: '반납 확인 다이얼로그 내용 확인', expected: '도서 정보, 라벨번호, 위치 표시' },
          { id: '6.7.5', name: '관리자 반납 처리', method: '"반납 처리" 확인', expected: '반납 완료, 상태 변경' },
          { id: '6.7.6', name: '대여 신청 승인', method: '대여 신청 도서의 "승인" 클릭', expected: '대여 처리 완료' }
        ]
      },
      {
        title: '6.8 권한 테스트',
        items: [
          { id: '6.8.1', name: '일반 사용자 관리자 메뉴 접근', method: '일반 사용자로 /admin/books 직접 접속', expected: '접근 거부 또는 리다이렉트' },
          { id: '6.8.2', name: '매니저 권한 확인', method: '매니저 계정으로 관리자 메뉴 접근', expected: '정상 접근 가능' },
          { id: '6.8.3', name: '매니저의 매니저관리 접근', method: '매니저 계정으로 /admin/managers 직접 접속', expected: '접근 거부 또는 리다이렉트 (최고관리자만 접근 가능)' }
        ]
      },
      {
        title: '6.9 매니저 관리 (최고관리자 전용)',
        items: [
          { id: '6.9.1', name: '매니저 관리 메뉴 표시', method: '최고관리자로 로그인 후 사이드 메뉴 확인', expected: '"최고관리자" 섹션에 "매니저 관리" 메뉴 표시' },
          { id: '6.9.2', name: '매니저 관리 페이지 접근', method: '"매니저 관리" 클릭', expected: '/admin/managers 페이지로 이동' },
          { id: '6.9.3', name: '사용자 검색', method: '검색창에 사용자 이름 또는 이메일 입력 후 검색', expected: '검색된 사용자 목록 표시 (역할 포함)' },
          { id: '6.9.4', name: '매니저 목록 표시', method: '페이지 하단 매니저 목록 확인', expected: '현재 등록된 매니저 목록 표시' },
          { id: '6.9.5', name: '일반 사용자 → 매니저 지정', method: '검색된 일반 사용자의 "매니저 지정" 클릭', expected: '확인 팝업 → 매니저 지정 완료' },
          { id: '6.9.6', name: '매니저 → 일반 사용자 해제', method: '매니저 카드의 "해제" 클릭', expected: '확인 팝업 → 매니저 해제 완료' },
          { id: '6.9.7', name: '최고관리자 해제 불가', method: '최고관리자 카드 확인', expected: '"최고관리자는 변경할 수 없습니다" 메시지 표시' }
        ]
      },
      {
        title: '6.10 임시 회원 관리',
        items: [
          { id: '6.10.1', name: '미가입 이메일로 대여 처리', method: '도서 관리에서 대여 처리 시 미가입 이메일 입력', expected: '임시 회원으로 등록되어 대여 처리' },
          { id: '6.10.2', name: '임시 회원 정보 입력', method: '이메일, 이름, 근무지 입력', expected: '모든 정보 입력 후 대여 가능' },
          { id: '6.10.3', name: '임시 회원 관리 페이지', method: '관리자 메뉴 > 임시 회원 관리', expected: '/admin/users/pending 페이지로 이동' },
          { id: '6.10.4', name: '임시 회원 목록 표시', method: '페이지 로드', expected: '임시 회원 목록 표시 (이메일, 이름, 근무지, 등록일)' },
          { id: '6.10.5', name: '실제 회원가입 시 연결', method: '임시 회원 이메일로 회원가입', expected: '대여 기록이 새 계정에 연결됨' }
        ]
      }
    ]
  },
  {
    section: '7. 설정 관리 테스트 (관리자)',
    subsections: [
      {
        title: '7.1 카테고리 관리',
        items: [
          { id: '7.1.1', name: '설정 관리 페이지 접근', method: '관리자 메뉴 > 설정 관리', expected: '/admin/settings 페이지로 이동' },
          { id: '7.1.2', name: '센터별 카테고리 로드', method: '센터 선택 변경', expected: '해당 센터 카테고리 설정 표시' },
          { id: '7.1.3', name: '카테고리 토글 ON/OFF', method: '카테고리 토글 클릭', expected: '해당 센터에서 사용 여부 변경' },
          { id: '7.1.4', name: '커스텀 카테고리 추가', method: '"카테고리 추가" 클릭 후 이름 입력', expected: '새 카테고리 추가됨' },
          { id: '7.1.5', name: '카테고리명 변경', method: '카테고리 이름 수정', expected: '해당 카테고리 도서의 라벨번호도 함께 변경' },
          { id: '7.1.6', name: '카테고리 삭제 - 도서 있음', method: '도서가 있는 카테고리 삭제 시도', expected: '삭제 불가 메시지' }
        ]
      },
      {
        title: '7.2 서가 이미지 관리',
        items: [
          { id: '7.2.1', name: '서가 이미지 업로드', method: '이미지 선택 후 이름 입력, 업로드', expected: '이미지 업로드 완료, 목록에 표시' },
          { id: '7.2.2', name: '서가 이미지 삭제 - 매핑 있음', method: '칸에 매핑된 이미지 삭제 시도', expected: '삭제 불가 메시지' },
          { id: '7.2.3', name: '서가 이미지 삭제 - 매핑 없음', method: '매핑되지 않은 이미지 삭제', expected: '정상 삭제' }
        ]
      },
      {
        title: '7.3 칸-이미지 매핑',
        items: [
          { id: '7.3.1', name: '칸 목록 로드', method: '칸-이미지 매핑 섹션 확인', expected: '센터별 칸 목록과 매핑된 이미지 표시' },
          { id: '7.3.2', name: '칸 추가', method: '"칸 추가" 클릭, 이름과 이미지 선택', expected: '새 칸 추가됨' },
          { id: '7.3.3', name: '칸 이름 변경', method: '칸 이름 수정 후 저장', expected: '해당 칸의 모든 도서 위치도 함께 변경' },
          { id: '7.3.4', name: '칸 이미지 매핑', method: '칸에 서가 이미지 선택', expected: '위치 안내 팝업에서 해당 이미지 표시' },
          { id: '7.3.5', name: '칸 삭제 - 도서 있음', method: '도서가 있는 칸 삭제 시도', expected: '삭제 불가 메시지' },
          { id: '7.3.6', name: '레이아웃 확인 (데스크탑)', method: '데스크탑에서 칸 목록 확인', expected: '4개씩 한 줄에 표시' },
          { id: '7.3.7', name: '레이아웃 확인 (모바일)', method: '모바일에서 칸 목록 확인', expected: '2개씩 한 줄에 표시' }
        ]
      },
      {
        title: '7.4 기본 칸 설정',
        items: [
          { id: '7.4.1', name: '기본 칸 설정', method: '칸에서 "기본" 버튼 클릭', expected: '해당 칸이 기본 칸으로 설정, 배지 표시' },
          { id: '7.4.2', name: '기본 칸 변경', method: '다른 칸을 기본으로 설정', expected: '이전 기본 칸 배지 제거, 새 칸에 배지 표시' },
          { id: '7.4.3', name: '신규 도서 기준 변경', method: '기본 칸을 변경 후 메인 페이지 확인', expected: '새 기본 칸에 있는 도서가 신규 도서로 표시' },
          { id: '7.4.4', name: '도서 등록 시 기본 위치', method: '도서 등록 다이얼로그 위치 기본값 확인', expected: '기본 칸이 선택되어 있음' }
        ]
      }
    ]
  },
  {
    section: '8. 알림 테스트',
    subsections: [
      {
        title: '8.1 웹 알림',
        items: [
          { id: '8.1.1', name: '알림 벨 아이콘', method: '헤더의 알림 아이콘 확인', expected: '읽지 않은 알림 수 배지 표시' },
          { id: '8.1.2', name: '알림 드롭다운', method: '알림 벨 클릭', expected: '최근 알림 5개 드롭다운 표시' },
          { id: '8.1.3', name: '알림 페이지 접근', method: '알림 드롭다운에서 "전체보기" 클릭', expected: '/notifications 페이지로 이동' },
          { id: '8.1.4', name: '알림 목록 표시', method: '알림 페이지 확인', expected: '모든 알림 목록 표시' },
          { id: '8.1.5', name: '알림 필터', method: '"읽지 않음" 필터 선택', expected: '읽지 않은 알림만 표시' },
          { id: '8.1.6', name: '알림 읽음 처리', method: '알림 클릭', expected: '해당 알림 읽음 처리, 관련 페이지 이동' },
          { id: '8.1.7', name: '모두 읽음', method: '"모두 읽음" 버튼 클릭', expected: '모든 알림 읽음 처리' },
          { id: '8.1.8', name: '알림 삭제', method: '알림의 X 버튼 클릭', expected: '해당 알림 삭제' }
        ]
      },
      {
        title: '8.2 알림 발생 시나리오',
        items: [
          { id: '8.2.1', name: '도서 등록 신청', method: '사용자가 도서 신청', expected: '"새로운 도서 등록 신청" 알림 (관리자)' },
          { id: '8.2.2', name: '도서 대여 신청', method: '사용자가 다른 센터 도서 대여 신청', expected: '"새로운 도서 대여 신청" 알림 (관리자)' },
          { id: '8.2.3', name: '신청 도서 등록', method: '관리자가 신청 도서 등록', expected: '"신청한 도서가 등록되었습니다" 알림 (신청자)' },
          { id: '8.2.4', name: '반납 예정 알림', method: '스케줄러 (매일 09:00)', expected: '"반납예정일이 내일입니다" 알림 (대여자)' },
          { id: '8.2.5', name: '연체 알림', method: '스케줄러 (매일 09:00)', expected: '"도서가 N일 연체되었습니다" 알림 (대여자/관리자)' }
        ]
      },
      {
        title: '8.3 이메일 알림',
        items: [
          { id: '8.3.1', name: '이메일 설정 UI', method: '알림 페이지 상단 확인', expected: '"이메일로 알림 받기" 토글 표시' },
          { id: '8.3.2', name: '신규 가입자 기본값', method: '새 계정으로 알림 페이지 접속', expected: '"이메일로 알림 받기" 토글이 ON 상태' },
          { id: '8.3.3', name: '이메일 알림 활성화', method: '토글 ON', expected: '설정 저장, 활성화 메시지' },
          { id: '8.3.4', name: '이메일 알림 비활성화', method: '토글 OFF', expected: '설정 저장, 비활성화 메시지' },
          { id: '8.3.5', name: '기존 계정 설정 유지', method: '기존에 OFF로 설정한 계정 확인', expected: 'OFF 상태 유지됨' },
          { id: '8.3.6', name: '이메일 수신 확인', method: '알림 발생 후 이메일 확인', expected: 'CNX Library 이메일 수신' },
          { id: '8.3.7', name: '이메일 링크 확인', method: '이메일의 "바로가기" 링크 클릭', expected: 'GitHub Pages URL로 이동' }
        ]
      }
    ]
  },
  {
    section: '9. 사이드 메뉴 테스트',
    subsections: [
      {
        title: '9.1 하단 링크',
        items: [
          { id: '9.1.1', name: '하단 링크 레이아웃', method: '사이드 메뉴 열기', expected: '"이용가이드 | 문의하기 | 로그아웃" 가로 배치, 중앙 정렬' },
          { id: '9.1.2', name: '이용가이드 링크', method: '"이용가이드" 클릭', expected: '/user-guide 페이지로 이동' },
          { id: '9.1.3', name: '이용가이드 스타일', method: '이용가이드 링크 스타일 확인', expected: '밑줄 없음' },
          { id: '9.1.4', name: '문의하기 링크', method: '"문의하기" 클릭', expected: 'mailto:officemanager.korea@concentrix.com 이메일 열림' },
          { id: '9.1.5', name: '문의하기 스타일', method: '문의하기 링크 스타일 확인', expected: '텍스트에만 밑줄 (아이콘 제외)' },
          { id: '9.1.6', name: '로그아웃 링크', method: '"로그아웃" 클릭', expected: '로그아웃 처리, 로그인 페이지로 이동' },
          { id: '9.1.7', name: '기존 메뉴와 간격', method: '하단 링크 위 여백 확인', expected: '기존 메뉴와 충분한 간격' }
        ]
      }
    ]
  },
  {
    section: '10. UI/UX 테스트',
    subsections: [
      {
        title: '10.1 반응형 테스트',
        items: [
          { id: '10.1.1', name: '모바일 뷰 (360px)', method: '브라우저 너비 360px로 조정', expected: '모든 요소 정상 표시, 가로 스크롤 없음' },
          { id: '10.1.2', name: '태블릿 뷰 (768px)', method: '브라우저 너비 768px로 조정', expected: '레이아웃 적절히 조정됨' },
          { id: '10.1.3', name: '데스크탑 뷰 (1024px+)', method: '브라우저 너비 1024px 이상', expected: '최대 768px 컨테이너 중앙 정렬' },
          { id: '10.1.4', name: '도서 카드 그리드', method: '모바일/데스크탑 전환', expected: '1열 ↔ 2열 전환' },
          { id: '10.1.5', name: '사이드 메뉴', method: '모바일에서 메뉴 열기', expected: '전체 너비 280px, 우측에서 슬라이드' }
        ]
      },
      {
        title: '10.2 도서 카드 공통',
        items: [
          { id: '10.2.1', name: 'NO IMAGE 표시', method: '표지 이미지 없는 도서 확인', expected: '동일 크기 박스에 회색 배경 + "NO IMAGE" 텍스트' },
          { id: '10.2.2', name: '저자/출판사 표시 형식', method: '도서 카드 저자/출판사 확인', expected: '"저자: [저자명]", "출판사: [출판사명]" 형식' },
          { id: '10.2.3', name: '긴 텍스트 처리', method: '저자/출판사명이 긴 도서 확인', expected: '한 줄에서 ... 으로 말줄임 처리' },
          { id: '10.2.4', name: '빈 정보 처리', method: '저자 또는 출판사 정보 없는 도서 확인', expected: '해당 필드 미표시, 전체 박스 높이 유지' },
          { id: '10.2.5', name: '위치 정보 표시', method: '도서 카드에서 위치 정보 확인', expected: '위치 아이콘 및 텍스트 표시 (설정된 칸 이름)' }
        ]
      },
      {
        title: '10.3 로딩 상태',
        items: [
          { id: '10.3.1', name: '페이지 로딩', method: '페이지 새로고침', expected: '로딩 인디케이터 표시' },
          { id: '10.3.2', name: '도서 검색 로딩', method: '도서 검색 실행', expected: '검색 중 로딩 표시' },
          { id: '10.3.3', name: '버튼 로딩', method: '대여/반납 버튼 클릭', expected: '버튼에 로딩 스피너 표시' }
        ]
      },
      {
        title: '10.4 에러 상태',
        items: [
          { id: '10.4.1', name: '네트워크 오류', method: '오프라인 상태에서 작업', expected: '오류 메시지 표시' },
          { id: '10.4.2', name: '빈 목록', method: '검색 결과 없을 때', expected: '적절한 빈 상태 메시지' },
          { id: '10.4.3', name: '폼 유효성 오류', method: '잘못된 입력 제출', expected: '필드별 오류 메시지 표시' }
        ]
      }
    ]
  },
  {
    section: '11. ISBN 필드 일관성 테스트',
    subsections: [
      {
        title: '11.1 ISBN 기반 기능',
        items: [
          { id: '11.1.1', name: '읽은 책 확인 (isbn13)', method: 'isbn13만 있는 도서 대여 시도', expected: '읽은 책 확인 정상 작동' },
          { id: '11.1.2', name: '읽은 책 확인 (isbn)', method: 'isbn만 있는 도서 대여 시도', expected: '읽은 책 확인 정상 작동' },
          { id: '11.1.3', name: '반납알림 구독 (isbn13)', method: 'isbn13 도서 반납알림 신청', expected: '정상 구독, 상태 표시' },
          { id: '11.1.4', name: '반납알림 구독 (isbn)', method: 'isbn만 있는 도서 반납알림 신청', expected: '정상 구독, 상태 표시' },
          { id: '11.1.5', name: '같은 ISBN 대여 제한 (isbn13)', method: 'isbn13 도서 대여 중 같은 ISBN 대여 시도', expected: '"이미 대여중인 책입니다" 메시지' },
          { id: '11.1.6', name: '같은 ISBN 대여 제한 (isbn)', method: 'isbn만 있는 도서 대여 중 같은 ISBN 대여 시도', expected: '"이미 대여중인 책입니다" 메시지' }
        ]
      }
    ]
  },
  {
    section: '12. 성능 테스트',
    subsections: [
      {
        title: '12. 성능',
        items: [
          { id: '12.1', name: '초기 로딩 시간', method: '메인 페이지 첫 로딩', expected: '3초 이내' },
          { id: '12.2', name: '페이지 전환', method: '페이지 간 이동', expected: '1초 이내' },
          { id: '12.3', name: '도서 검색 응답', method: '네이버 도서 API 검색', expected: '2초 이내' },
          { id: '12.4', name: '대여/반납 처리', method: 'Firestore 업데이트', expected: '1초 이내' }
        ]
      }
    ]
  },
  {
    section: '13. 데이터 정합성 테스트',
    subsections: [
      {
        title: '13. 데이터 정합성',
        items: [
          { id: '13.1', name: '대여 후 상태 동기화', method: '대여 완료 후 다른 브라우저에서 확인', expected: '즉시 "대여중" 상태 반영' },
          { id: '13.2', name: '반납 후 상태 동기화', method: '반납 완료 후 다른 브라우저에서 확인', expected: '즉시 "대여가능" 상태 반영' },
          { id: '13.3', name: '알림 실시간 수신', method: '알림 발생 후 다른 탭에서 확인', expected: '새로고침 없이 알림 배지 업데이트' },
          { id: '13.4', name: '읽은 책 중복 방지', method: '같은 책 여러 번 대여/반납', expected: '읽은 책 목록에 1개만 표시' }
        ]
      }
    ]
  },
  {
    section: '14. 보안 테스트',
    subsections: [
      {
        title: '14.1 접근 권한',
        items: [
          { id: '14.1.1', name: '비로그인 페이지 접근', method: '로그아웃 상태로 /mypage 접근', expected: '로그인 페이지로 리다이렉트' },
          { id: '14.1.2', name: '다른 사용자 알림 접근', method: 'Firestore 직접 쿼리 시도', expected: '자신의 알림만 조회 가능' },
          { id: '14.1.3', name: '권한 없는 도서 삭제', method: '일반 사용자가 삭제 API 호출', expected: '권한 오류' }
        ]
      },
      {
        title: '14.2 XSS 방지',
        items: [
          { id: '14.2.1', name: '회원가입 이름 필드', method: '이름 필드에 <script>alert(1)</script> 입력', expected: '스크립트 실행 안됨, 텍스트로 표시되거나 제거됨' },
          { id: '14.2.2', name: '도서 검색 필드', method: '검색창에 <img src=x onerror=alert(1)> 입력', expected: '스크립트 실행 안됨' },
          { id: '14.2.3', name: '직접 등록 도서명', method: '도서명에 <script>alert(1)</script> 입력 후 등록', expected: '스크립트 실행 안됨, 정상 저장' },
          { id: '14.2.4', name: '테스트 비고 필드', method: '비고에 <script>alert(1)</script> 입력', expected: '스크립트 실행 안됨' }
        ]
      }
    ]
  },
  {
    section: '15. 크로스 브라우저 테스트',
    subsections: [
      {
        title: '15. 크로스 브라우저',
        items: [
          { id: '15.1', name: 'Chrome 최신', method: 'Chrome 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '15.2', name: 'Safari 최신', method: 'Safari 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '15.3', name: 'Edge 최신', method: 'Edge 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '15.4', name: 'Firefox 최신', method: 'Firefox 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '15.5', name: 'Mobile Safari (iOS)', method: 'iOS Safari에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '15.6', name: 'Chrome (Android)', method: 'Android Chrome에서 전체 기능 테스트', expected: '모든 기능 정상 동작' }
        ]
      }
    ]
  }
]

/**
 * V2 전체 테스트 항목 수 계산
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
 * V2 모든 테스트 ID 목록 반환
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
