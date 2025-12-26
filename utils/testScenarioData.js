/**
 * 테스트 시나리오 데이터
 * 테스트 세션 생성 시 이 템플릿을 기반으로 결과를 기록합니다.
 */

export const TEST_SCENARIOS = [
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
          { id: '1.2.5', name: '인증 이메일 재발송', method: '로그인 페이지에서 재발송 요청', expected: '인증 이메일 재발송' }
        ]
      },
      {
        title: '1.3 로그인',
        items: [
          { id: '1.3.1', name: '정상 로그인', method: '올바른 이메일/비밀번호 입력', expected: '메인 페이지로 이동' },
          { id: '1.3.2', name: '잘못된 비밀번호', method: '틀린 비밀번호 입력', expected: '"이메일 또는 비밀번호가 올바르지 않습니다" 오류' },
          { id: '1.3.3', name: '존재하지 않는 계정', method: '미등록 이메일로 로그인', expected: '"이메일 또는 비밀번호가 올바르지 않습니다" 오류' },
          { id: '1.3.4', name: '자동 로그인', method: '"로그인 상태 유지" 체크 후 로그인 → 브라우저 닫고 재접속', expected: '로그인 상태 유지됨' },
          { id: '1.3.5', name: '로그아웃', method: '사이드 메뉴에서 "로그아웃" 클릭', expected: '로그인 페이지로 이동' }
        ]
      },
      {
        title: '1.4 비밀번호 재설정',
        items: [
          { id: '1.4.1', name: '비밀번호 찾기 페이지 접근', method: '로그인 페이지에서 "비밀번호 찾기" 클릭', expected: 'forgot-password 페이지로 이동' },
          { id: '1.4.2', name: '재설정 이메일 발송', method: '가입된 이메일 입력 후 요청', expected: '비밀번호 재설정 이메일 발송' },
          { id: '1.4.3', name: '재설정 링크 접속', method: '이메일의 재설정 링크 클릭', expected: 'reset-password 페이지로 이동' },
          { id: '1.4.4', name: '새 비밀번호 설정', method: '새 비밀번호 입력 후 변경', expected: '비밀번호 변경 완료, 로그인 페이지 이동' },
          { id: '1.4.5', name: '변경된 비밀번호로 로그인', method: '새 비밀번호로 로그인', expected: '정상 로그인' }
        ]
      }
    ]
  },
  {
    section: '2. 메인 페이지 테스트',
    subsections: [
      {
        title: '2. 메인 페이지',
        items: [
          { id: '2.1', name: '페이지 로딩', method: '메인 페이지 접속', expected: '모든 섹션 정상 표시' },
          { id: '2.2', name: '사용자 이름 표시', method: '로그인 후 메인 페이지 확인', expected: '"[이름]님의 도서 대여 현황" 표시' },
          { id: '2.3', name: '대여 현황 표시', method: '대여중인 도서가 있는 상태에서 확인', expected: '대여중/반납예정/연체중 카운트 정상' },
          { id: '2.4', name: '베스트셀러 스와이퍼', method: '베스트셀러 섹션 확인', expected: '알라딘 베스트셀러 10권 표시' },
          { id: '2.5', name: '스와이퍼 네비게이션', method: '좌/우 화살표 클릭', expected: '슬라이드 이동' },
          { id: '2.6', name: '신규 도서 스와이퍼', method: '센터별 신규 도서 섹션 확인', expected: '최근 등록된 도서 표시' },
          { id: '2.7', name: '헤더 알림 아이콘', method: '알림 벨 아이콘 확인', expected: '읽지 않은 알림 수 배지 표시' },
          { id: '2.8', name: '사이드 메뉴', method: '햄버거 메뉴 클릭', expected: '사이드 네비게이션 열림' }
        ]
      }
    ]
  },
  {
    section: '3. 도서 목록 테스트',
    subsections: [
      {
        title: '3.1 도서 목록 조회',
        items: [
          { id: '3.1.1', name: '도서 목록 페이지 접근', method: '메뉴에서 "도서 대여" 클릭', expected: '/books 페이지로 이동' },
          { id: '3.1.2', name: '센터 필터링', method: '센터 선택 드롭다운 변경', expected: '해당 센터 도서만 표시' },
          { id: '3.1.3', name: '도서 검색', method: '검색창에 도서명 입력', expected: '검색어와 일치하는 도서 표시' },
          { id: '3.1.4', name: '정렬 기능', method: '정렬 드롭다운 변경 (등록일순/제목순)', expected: '정렬 기준에 따라 목록 재정렬' },
          { id: '3.1.5', name: '도서 카드 정보', method: '도서 카드 확인', expected: '제목, 저자, 출판사, 상태 표시' },
          { id: '3.1.6', name: '빈 목록', method: '검색 결과 없을 때', expected: '"검색 결과가 없습니다" 메시지' }
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
          { id: '3.2.7', name: '대여중인 도서', method: '대여중인 도서 카드 확인 (타인/본인 무관)', expected: '대여 버튼 미노출, "대여중" 상태 표시, 선택 불가' },
          { id: '3.2.8', name: '최대 대여 권수 제한', method: '5권 대여 상태에서 추가 대여 시도', expected: '"5권을 대여중입니다. 반납 후 대여해주세요" 메시지' },
          { id: '3.2.9', name: '남은 대여 가능 권수 표시', method: '3권 대여 상태에서 도서 목록 확인', expected: '"3권 대여중, 2권 추가 가능" 표시' }
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
        title: '4.2 신청한 책 목록',
        items: [
          { id: '4.2.1', name: '신청한 책 섹션 표시', method: '도서 신청 후 마이페이지 확인', expected: '리스트로 신청 도서 표시 (10개씩 페이지네이션)' },
          { id: '4.2.2', name: '신청일 및 취소 버튼 표시', method: '신청 도서 카드 확인', expected: '신청일 표시, "신청 취소" 버튼 표시' },
          { id: '4.2.3', name: '신청 취소', method: '"신청 취소" 버튼 클릭', expected: '취소 확인 → 목록에서 제거' }
        ]
      },
      {
        title: '4.3 읽은 책 목록',
        items: [
          { id: '4.3.1', name: '읽은 책 목록 표시', method: '반납 완료 후 확인', expected: '반납한 도서가 읽은 책 목록에 추가' },
          { id: '4.3.2', name: '중복 대여 기록', method: '같은 책 재대여 후 반납', expected: '대여 횟수 증가, 목록에 1개만 표시' },
          { id: '4.3.3', name: '읽은 책 삭제', method: '읽은 책 선택 후 "삭제하기" 클릭', expected: '목록에서 제거 (대여 횟수 포함 전체 이력 삭제)' }
        ]
      },
      {
        title: '4.4 정보 수정',
        items: [
          { id: '4.4.1', name: '정보수정 페이지 접근', method: '"정보수정" 버튼 클릭', expected: '/mypage/edit 페이지로 이동' },
          { id: '4.4.2', name: '현재 정보 표시', method: '페이지 로딩 확인', expected: '현재 이름, 근무지 표시' },
          { id: '4.4.3', name: '이름 변경', method: '이름 수정 후 저장', expected: '변경 완료 메시지, 마이페이지 반영' },
          { id: '4.4.4', name: '근무지 변경', method: '근무지 선택 변경 후 저장', expected: '변경 완료, 센터 필터 기본값 변경' },
          { id: '4.4.5', name: '비밀번호 변경', method: '"비밀번호 변경" 버튼 클릭', expected: '비밀번호 재설정 링크 이메일 발송 성공 메시지' }
        ]
      }
    ]
  },
  {
    section: '5. 도서 신청 테스트',
    subsections: [
      {
        title: '5. 도서 신청',
        items: [
          { id: '5.1', name: '도서 신청 페이지 접근', method: '메뉴에서 "도서 신청" 클릭', expected: '/books/request 페이지로 이동' },
          { id: '5.2', name: '센터 변경', method: '센터 선택 드롭다운 변경', expected: '선택한 센터로 신청 대상 변경' },
          { id: '5.3', name: '도서 검색', method: '검색창에 도서명 입력 후 검색', expected: '네이버 도서 API 검색 결과 표시' },
          { id: '5.4', name: '검색 결과 표시', method: '검색 완료 후 확인', expected: '도서 목록 그리드 형태로 표시, 페이지네이션' },
          { id: '5.5', name: '베스트셀러 표시', method: '베스트셀러 섹션 확인', expected: '알라딘 베스트셀러 스와이퍼 표시' },
          { id: '5.6', name: '이미 등록된 도서', method: '등록된 도서 검색', expected: '"이미 등록된 도서" 표시' },
          { id: '5.7', name: '도서 신청하기', method: '미등록 도서의 "신청하기" 클릭', expected: '신청 확인 → 신청 완료 메시지' },
          { id: '5.8', name: '신청 후 상태', method: '신청한 도서 재검색', expected: '"신청완료" 상태 표시' },
          { id: '5.9', name: '검색 결과 없음 안내', method: '결과 없는 검색어 입력 (예: "zzzxxx123")', expected: '"검색 결과가 없습니다" 안내 메시지 표시' },
          { id: '5.10', name: '세트 상품 자동 제외', method: '일반 도서명 검색 (예: "해리포터")', expected: '세트/전집 상품이 결과에서 자동 제외됨' }
        ]
      }
    ]
  },
  {
    section: '6. 관리자 기능 테스트',
    subsections: [
      {
        title: '6.1 도서 등록',
        items: [
          { id: '6.1.1', name: '관리자 메뉴 접근', method: '관리자 계정으로 로그인 후 메뉴 확인', expected: '"관리자 메뉴" 표시' },
          { id: '6.1.2', name: '도서 등록 페이지 접근', method: '관리자 메뉴 > 도서 등록', expected: '/admin/books/register 페이지로 이동' },
          { id: '6.1.3', name: '센터 변경', method: '센터 선택 드롭다운 변경', expected: '선택한 센터에 도서 등록 가능' },
          { id: '6.1.4', name: '도서 검색', method: '도서명으로 검색', expected: '네이버 도서 API 검색 결과 그리드 표시' },
          { id: '6.1.5', name: '베스트셀러 표시', method: '베스트셀러 섹션 확인', expected: '알라딘 베스트셀러 스와이퍼 표시' },
          { id: '6.1.6', name: '도서 등록 다이얼로그', method: '검색된 도서의 "등록하기" 클릭', expected: '등록 다이얼로그 표시 (카테고리, 수량, 라벨번호 4자리, 위치 입력)' },
          { id: '6.1.7', name: '라벨번호 중복 체크', method: '이미 사용중인 라벨번호 4자리 입력', expected: '"이미 사용중인 라벨번호입니다" 메시지' },
          { id: '6.1.8', name: '다권 등록', method: '수량 2 이상 선택 후 각 라벨번호 입력', expected: '입력 필드가 수량만큼 생성됨' },
          { id: '6.1.9', name: '등록 완료', method: '모든 정보 입력 후 "등록" 클릭', expected: '등록 완료 메시지 (라벨번호 표시)' },
          { id: '6.1.10', name: '도서 신청 목록', method: '도서 신청 목록 섹션 확인', expected: '사용자들이 신청한 도서 표시' },
          { id: '6.1.11', name: '신청자 정보 표시', method: '신청 도서 카드 확인', expected: '신청자 근무지, 이름 표시' },
          { id: '6.1.12', name: '신청 도서 등록', method: '신청 도서의 "등록하기" 클릭', expected: '등록 완료, 신청자에게 알림 발송' }
        ]
      },
      {
        title: '6.2 도서 관리',
        items: [
          { id: '6.2.1', name: '도서 관리 페이지 접근', method: '관리자 메뉴 > 도서 관리', expected: '/admin/books 페이지로 이동' },
          { id: '6.2.2', name: '센터 변경', method: '센터 선택 드롭다운 변경', expected: '선택한 센터 도서만 표시 (모든 센터 관리 가능)' },
          { id: '6.2.3', name: '등록 도서 목록', method: '등록된 도서 목록 섹션 확인', expected: '센터별 등록 도서 표시' },
          { id: '6.2.4', name: '도서 검색', method: '검색창에 도서명 입력', expected: '검색된 도서만 필터링' },
          { id: '6.2.5', name: '도서 삭제', method: '도서 카드의 삭제 버튼 클릭', expected: '삭제 확인 → 삭제 완료' },
          { id: '6.2.6', name: '대여중 도서 삭제 시도', method: '대여중인 도서 삭제 시도', expected: '삭제 불가 메시지' },
          { id: '6.2.7', name: '대여 현황 표시', method: '대여중인 도서 카드 확인', expected: '대여자 정보 (근무지, 이름, 이메일) 표시' },
          { id: '6.2.8', name: '반납예정일 표시', method: '대여중 도서 확인', expected: '반납예정일 표시' },
          { id: '6.2.9', name: '관리자 반납 처리', method: '"반납 처리" 버튼 클릭', expected: '반납 완료, 상태 변경' },
          { id: '6.2.10', name: '대여 신청 승인', method: '대여 신청 도서의 "승인" 클릭', expected: '대여 처리 완료' }
        ]
      },
      {
        title: '6.3 권한 테스트',
        items: [
          { id: '6.3.1', name: '일반 사용자 관리자 메뉴 접근', method: '일반 사용자로 /admin/books 직접 접속', expected: '접근 거부 또는 리다이렉트' },
          { id: '6.3.2', name: '매니저 권한 확인', method: '매니저 계정으로 관리자 메뉴 접근', expected: '정상 접근 가능' },
          { id: '6.3.3', name: '매니저의 매니저관리 접근', method: '매니저 계정으로 /admin/managers 직접 접속', expected: '접근 거부 또는 리다이렉트 (최고관리자만 접근 가능)' }
        ]
      },
      {
        title: '6.4 매니저 관리 (최고관리자 전용)',
        items: [
          { id: '6.4.1', name: '매니저 관리 메뉴 표시', method: '최고관리자로 로그인 후 사이드 메뉴 확인', expected: '"최고관리자" 섹션에 "매니저 관리" 메뉴 표시' },
          { id: '6.4.2', name: '매니저 관리 페이지 접근', method: '"매니저 관리" 클릭', expected: '/admin/managers 페이지로 이동' },
          { id: '6.4.3', name: '사용자 검색', method: '검색창에 사용자 이름 또는 이메일 입력 후 검색', expected: '검색된 사용자 목록 표시 (역할 포함)' },
          { id: '6.4.4', name: '매니저 목록 표시', method: '페이지 하단 매니저 목록 확인', expected: '현재 등록된 매니저 목록 표시' },
          { id: '6.4.5', name: '일반 사용자 → 매니저 지정', method: '검색된 일반 사용자의 "매니저 지정" 클릭', expected: '확인 팝업 → 매니저 지정 완료, 센터 자동 배정' },
          { id: '6.4.6', name: '매니저 → 일반 사용자 해제', method: '매니저 카드의 "해제" 클릭', expected: '확인 팝업 → 매니저 해제 완료' },
          { id: '6.4.7', name: '최고관리자 해제 불가', method: '최고관리자 카드 확인', expected: '"최고관리자는 변경할 수 없습니다" 메시지 표시' },
          { id: '6.4.8', name: '지정 후 매니저 목록 갱신', method: '매니저 지정 후 목록 확인', expected: '새로 지정된 매니저가 목록에 추가됨' },
          { id: '6.4.9', name: '해제 후 매니저 목록 갱신', method: '매니저 해제 후 목록 확인', expected: '해제된 매니저가 목록에서 제거됨' }
        ]
      }
    ]
  },
  {
    section: '7. 알림 테스트',
    subsections: [
      {
        title: '7.1 웹 알림',
        items: [
          { id: '7.1.1', name: '알림 벨 아이콘', method: '헤더의 알림 아이콘 확인', expected: '읽지 않은 알림 수 배지 표시' },
          { id: '7.1.2', name: '알림 드롭다운', method: '알림 벨 클릭', expected: '최근 알림 5개 드롭다운 표시' },
          { id: '7.1.3', name: '알림 페이지 접근', method: '알림 드롭다운에서 "전체보기" 클릭', expected: '/notifications 페이지로 이동' },
          { id: '7.1.4', name: '알림 목록 표시', method: '알림 페이지 확인', expected: '모든 알림 목록 표시' },
          { id: '7.1.5', name: '알림 필터', method: '"읽지 않음" 필터 선택', expected: '읽지 않은 알림만 표시' },
          { id: '7.1.6', name: '알림 읽음 처리', method: '알림 클릭', expected: '해당 알림 읽음 처리, 관련 페이지 이동' },
          { id: '7.1.7', name: '모두 읽음', method: '"모두 읽음" 버튼 클릭', expected: '모든 알림 읽음 처리' },
          { id: '7.1.8', name: '알림 삭제', method: '알림의 X 버튼 클릭', expected: '해당 알림 삭제' }
        ]
      },
      {
        title: '7.2 알림 발생 시나리오',
        items: [
          { id: '7.2.1', name: '도서 등록 신청', method: '사용자가 도서 신청', expected: '"새로운 도서 등록 신청" 알림 (관리자)' },
          { id: '7.2.2', name: '도서 대여 신청', method: '사용자가 다른 센터 도서 대여 신청', expected: '"새로운 도서 대여 신청" 알림 (관리자)' },
          { id: '7.2.3', name: '신청 도서 등록', method: '관리자가 신청 도서 등록', expected: '"신청한 도서가 등록되었습니다" 알림 (신청자)' },
          { id: '7.2.4', name: '반납 예정 알림', method: '스케줄러 (매일 09:00)', expected: '"반납예정일이 내일입니다" 알림 (대여자)' },
          { id: '7.2.5', name: '연체 알림', method: '스케줄러 (매일 09:00)', expected: '"도서가 N일 연체되었습니다" 알림 (대여자/관리자)' }
        ]
      },
      {
        title: '7.3 이메일 알림',
        items: [
          { id: '7.3.1', name: '이메일 설정 UI', method: '알림 페이지 상단 확인', expected: '"이메일로 알림 받기" 토글 표시' },
          { id: '7.3.2', name: '이메일 알림 활성화', method: '토글 ON', expected: '설정 저장, 활성화 메시지' },
          { id: '7.3.3', name: '이메일 알림 비활성화', method: '토글 OFF', expected: '설정 저장, 비활성화 메시지' },
          { id: '7.3.4', name: '이메일 수신 확인', method: '알림 발생 후 이메일 확인', expected: 'CNX Library 이메일 수신' },
          { id: '7.3.5', name: '이메일 링크 확인', method: '이메일의 "바로가기" 링크 클릭', expected: 'GitHub Pages URL로 이동' }
        ]
      }
    ]
  },
  {
    section: '8. UI/UX 테스트',
    subsections: [
      {
        title: '8.1 반응형 테스트',
        items: [
          { id: '8.1.1', name: '모바일 뷰 (360px)', method: '브라우저 너비 360px로 조정', expected: '모든 요소 정상 표시, 가로 스크롤 없음' },
          { id: '8.1.2', name: '태블릿 뷰 (768px)', method: '브라우저 너비 768px로 조정', expected: '레이아웃 적절히 조정됨' },
          { id: '8.1.3', name: '데스크탑 뷰 (1024px+)', method: '브라우저 너비 1024px 이상', expected: '최대 768px 컨테이너 중앙 정렬' },
          { id: '8.1.4', name: '도서 카드 그리드', method: '모바일/데스크탑 전환', expected: '1열 ↔ 2열 전환' },
          { id: '8.1.5', name: '사이드 메뉴', method: '모바일에서 메뉴 열기', expected: '전체 너비 280px, 우측에서 슬라이드' }
        ]
      },
      {
        title: '8.2 로딩 상태',
        items: [
          { id: '8.2.1', name: '페이지 로딩', method: '페이지 새로고침', expected: '로딩 인디케이터 표시' },
          { id: '8.2.2', name: '도서 검색 로딩', method: '도서 검색 실행', expected: '검색 중 로딩 표시' },
          { id: '8.2.3', name: '버튼 로딩', method: '대여/반납 버튼 클릭', expected: '버튼에 로딩 스피너 표시' }
        ]
      },
      {
        title: '8.3 에러 상태',
        items: [
          { id: '8.3.1', name: '네트워크 오류', method: '오프라인 상태에서 작업', expected: '오류 메시지 표시' },
          { id: '8.3.2', name: '빈 목록', method: '검색 결과 없을 때', expected: '적절한 빈 상태 메시지' },
          { id: '8.3.3', name: '폼 유효성 오류', method: '잘못된 입력 제출', expected: '필드별 오류 메시지 표시' }
        ]
      }
    ]
  },
  {
    section: '9. 성능 테스트',
    subsections: [
      {
        title: '9. 성능',
        items: [
          { id: '9.1', name: '초기 로딩 시간', method: '메인 페이지 첫 로딩', expected: '3초 이내' },
          { id: '9.2', name: '페이지 전환', method: '페이지 간 이동', expected: '1초 이내' },
          { id: '9.3', name: '도서 검색 응답', method: '네이버 도서 API 검색', expected: '2초 이내' },
          { id: '9.4', name: '대여/반납 처리', method: 'Firestore 업데이트', expected: '1초 이내' }
        ]
      }
    ]
  },
  {
    section: '10. 데이터 정합성 테스트',
    subsections: [
      {
        title: '10. 데이터 정합성',
        items: [
          { id: '10.1', name: '대여 후 상태 동기화', method: '대여 완료 후 다른 브라우저에서 확인', expected: '즉시 "대여중" 상태 반영' },
          { id: '10.2', name: '반납 후 상태 동기화', method: '반납 완료 후 다른 브라우저에서 확인', expected: '즉시 "대여가능" 상태 반영' },
          { id: '10.3', name: '알림 실시간 수신', method: '알림 발생 후 다른 탭에서 확인', expected: '새로고침 없이 알림 배지 업데이트' },
          { id: '10.4', name: '읽은 책 중복 방지', method: '같은 책 여러 번 대여/반납', expected: '읽은 책 목록에 1개만 표시' }
        ]
      }
    ]
  },
  {
    section: '11. 보안 테스트',
    subsections: [
      {
        title: '11. 보안',
        items: [
          { id: '11.1', name: '비로그인 페이지 접근', method: '로그아웃 상태로 /mypage 접근', expected: '로그인 페이지로 리다이렉트' },
          { id: '11.2', name: '다른 사용자 알림 접근', method: 'Firestore 직접 쿼리 시도', expected: '자신의 알림만 조회 가능' },
          { id: '11.3', name: '권한 없는 도서 삭제', method: '일반 사용자가 삭제 API 호출', expected: '권한 오류' }
        ]
      }
    ]
  },
  {
    section: '12. 크로스 브라우저 테스트',
    subsections: [
      {
        title: '12. 크로스 브라우저',
        items: [
          { id: '12.1', name: 'Chrome 최신', method: 'Chrome 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '12.2', name: 'Safari 최신', method: 'Safari 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '12.3', name: 'Edge 최신', method: 'Edge 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '12.4', name: 'Firefox 최신', method: 'Firefox 브라우저에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '12.5', name: 'Mobile Safari (iOS)', method: 'iOS Safari에서 전체 기능 테스트', expected: '모든 기능 정상 동작' },
          { id: '12.6', name: 'Chrome (Android)', method: 'Android Chrome에서 전체 기능 테스트', expected: '모든 기능 정상 동작' }
        ]
      }
    ]
  }
]

/**
 * 전체 테스트 항목 수 계산
 */
export const getTotalTestCount = () => {
  let count = 0
  TEST_SCENARIOS.forEach(section => {
    section.subsections.forEach(subsection => {
      count += subsection.items.length
    })
  })
  return count
}

/**
 * 모든 테스트 ID 목록 반환
 */
export const getAllTestIds = () => {
  const ids = []
  TEST_SCENARIOS.forEach(section => {
    section.subsections.forEach(subsection => {
      subsection.items.forEach(item => {
        ids.push(item.id)
      })
    })
  })
  return ids
}

