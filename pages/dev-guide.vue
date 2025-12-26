<template>
  <div class="guide-page">
    <div class="page-header">
      <h1>💻 개발자 가이드</h1>
      <p class="subtitle">CNX Library 프로젝트 개발 및 유지보수 가이드</p>
    </div>
    
    <div class="guide-content">
      <!-- 목차 -->
      <nav class="toc">
        <h2>📑 목차</h2>
        <ul>
          <li><a href="#overview">프로젝트 개요</a></li>
          <li><a href="#tech-stack">기술 스택</a></li>
          <li><a href="#structure">프로젝트 구조</a></li>
          <li><a href="#setup">설치 및 실행</a></li>
          <li><a href="#firebase">Firebase 설정</a></li>
          <li><a href="#firestore">Firestore 스키마</a></li>
          <li><a href="#functions">Cloud Functions</a></li>
          <li><a href="#email">이메일 알림</a></li>
          <li><a href="#aladin">알라딘 API</a></li>
          <li><a href="#deploy">배포</a></li>
          <li><a href="#troubleshoot">트러블슈팅</a></li>
          <li><a href="#tips">개발 시 주의사항</a></li>
        </ul>
      </nav>

      <!-- 프로젝트 개요 -->
      <section id="overview" class="guide-section">
        <h2>📋 프로젝트 개요</h2>
        <div class="section-content">
          <p>CNX Library는 Concentrix 사내 도서관 관리 시스템입니다. 직원들이 도서를 검색하고 대여/반납할 수 있으며, 관리자는 도서를 등록하고 대여 현황을 관리할 수 있습니다.</p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <h4>👤 사용자 기능</h4>
              <ul>
                <li>도서 검색 및 목록 조회</li>
                <li>도서 대여/반납 (최대 5권, 다권 가능)</li>
                <li>도서 등록 신청</li>
                <li>대여 현황 및 읽은 책 목록</li>
                <li>위치 안내 팝업 (서가 위치 확인)</li>
                <li>정보 수정 (이름, 근무지 변경)</li>
                <li>알림 수신 (웹 + 이메일)</li>
              </ul>
            </div>
            <div class="feature-card">
              <h4>⚙️ 관리자 기능 (매니저)</h4>
              <ul>
                <li>모든 사용자 기능 포함</li>
                <li>도서 등록 (검색/직접 등록, 다권 등록)</li>
                <li>도서 삭제</li>
                <li>도서 정보 수정 (카테고리, 라벨번호, 위치)</li>
                <li>도서 신청 승인</li>
                <li>대여 처리 (타 센터 대여 신청 승인)</li>
                <li>반납 처리</li>
                <li>센터 변경 (모든 센터 관리 가능)</li>
              </ul>
            </div>
            <div class="feature-card">
              <h4>👑 최고관리자 기능</h4>
              <ul>
                <li>매니저 관리 (지정/해제)</li>
                <li>모든 관리자 기능 포함</li>
              </ul>
            </div>
          </div>

          <div class="info-box">
            <h4>📍 센터-근무지 매핑</h4>
            <div class="code-block">
              <pre>// utils/centerMapping.js
const WORKPLACE_CENTER_MAP = {
  '강남': '강남센터',
  '잠실': '강남센터',
  '수원': '강남센터',
  '판교': '강남센터',
  '용산': '용산센터',
  '증미': '용산센터',
  '여의도': '용산센터'
}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- 기술 스택 -->
      <section id="tech-stack" class="guide-section">
        <h2>🛠 기술 스택</h2>
        <div class="section-content">
          <table class="data-table">
            <thead>
              <tr>
                <th>분류</th>
                <th>기술</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Frontend</strong></td>
                <td>Nuxt 3, Vue 3, Vuetify 3</td>
              </tr>
              <tr>
                <td><strong>Backend</strong></td>
                <td>Firebase (Authentication, Firestore, Functions)</td>
              </tr>
              <tr>
                <td><strong>외부 API</strong></td>
                <td>네이버 도서 API (도서 검색), 알라딘 Open API (베스트셀러)</td>
              </tr>
              <tr>
                <td><strong>이메일</strong></td>
                <td>Nodemailer + Gmail SMTP (인증/알림 메일 발송)</td>
              </tr>
              <tr>
                <td><strong>스타일링</strong></td>
                <td>SCSS, Vuetify</td>
              </tr>
              <tr>
                <td><strong>배포</strong></td>
                <td>GitHub Pages</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 프로젝트 구조 -->
      <section id="structure" class="guide-section">
        <h2>📁 프로젝트 구조</h2>
        <div class="section-content">
          <div class="code-block">
            <pre>cnx-library/
├── assets/
│   └── scss/
│       ├── _variables.scss   # SCSS 변수 (색상, breakpoint 등)
│       ├── functions.scss    # SCSS 함수 (rem 변환 등)
│       └── main.scss         # 전역 스타일
├── components/
│   ├── BookCard.vue          # 도서 카드 컴포넌트
│   ├── BookListSwiper.vue    # 도서 목록 스와이퍼
│   ├── ConcentrixLogo.vue    # 로고 컴포넌트
│   ├── GlobalDialog.vue      # 전역 다이얼로그 컴포넌트
│   ├── LocationGuidePopup.vue # 위치 안내 팝업
│   ├── NotificationBell.vue  # 알림 벨 (헤더)
│   ├── PageLayout.vue        # 페이지 레이아웃
│   └── SideNavigation.vue    # 사이드 네비게이션
├── composables/
│   ├── useAuth.js            # 인증 관련 로직
│   ├── useBooks.js           # 도서 관련 로직 (네이버/알라딘 API)
│   ├── useDialog.js          # 다이얼로그 상태 관리
│   ├── useDrawer.js          # Navigation Drawer 상태 관리
│   ├── useNotifications.js   # 알림 관련 로직
│   ├── useTestScenario.js    # 테스트 시나리오 관리
│   └── useUser.js            # 사용자 Firestore 데이터 관리
├── functions/
│   ├── index.js              # Firebase Cloud Functions
│   ├── package.json
│   └── .env                  # 환경 변수 (Git 제외)
├── middleware/
│   ├── admin.js              # 관리자/최고관리자 권한 체크
│   └── auth.js               # 인증 체크
├── pages/
│   ├── admin/
│   │   ├── managers/         # 매니저 관리 (최고관리자 전용)
│   │   └── books/            # 도서 등록/관리
│   ├── test-scenario/        # 테스트 시나리오 (개발자/QA 전용)
│   │   └── sessions/         # 테스트 세션 관리
│   └── ...                   # 기타 라우트 페이지들
├── plugins/
│   ├── firebase.client.js    # Firebase 초기화
│   └── vuetify.js            # Vuetify 설정
├── utils/
│   ├── centerMapping.js      # 센터-근무지 매핑
│   ├── labelConfig.js        # 라벨번호 설정 및 유틸리티
│   ├── locationCoordinates.js # 위치 좌표 (서가 이미지)
│   └── testScenarioData.js   # 테스트 시나리오 데이터
├── firebase.json             # Firebase 설정
├── firestore.rules           # Firestore 보안 규칙
└── firestore.indexes.json    # Firestore 인덱스</pre>
          </div>
        </div>
      </section>

      <!-- 설치 및 실행 -->
      <section id="setup" class="guide-section">
        <h2>🚀 설치 및 실행</h2>
        <div class="section-content">
          <h3>사전 요구사항</h3>
          <ul>
            <li>Node.js 20.x 이상</li>
            <li>npm 또는 yarn</li>
            <li>Firebase CLI (<code>npm install -g firebase-tools</code>)</li>
          </ul>

          <h3>설치</h3>
          <div class="code-block">
            <pre># 저장소 클론
git clone https://github.com/rarecat85/cnx-library.git
cd cnx-library

# 의존성 설치
npm install

# Functions 의존성 설치
cd functions
npm install
cd ..</pre>
          </div>

          <h3>환경 변수 설정</h3>
          
          <h4>1. 루트 .env 파일</h4>
          <div class="code-block">
            <pre># .env
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cnx-library.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=cnx-library
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cnx-library.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id</pre>
          </div>

          <h4>2. Functions .env 파일</h4>
          <div class="code-block">
            <pre># functions/.env
ALADIN_TTB_KEY=your_aladin_ttb_key
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
GMAIL_USER=cnx.library.noreply@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password</pre>
          </div>

          <h3>로컬 실행</h3>
          <div class="code-block">
            <pre># 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5001 접속</pre>
          </div>
        </div>
      </section>

      <!-- Firebase 설정 -->
      <section id="firebase" class="guide-section">
        <h2>🔥 Firebase 설정</h2>
        <div class="section-content">
          <h3>Firebase Console 설정</h3>
          
          <div class="step-cards">
            <div class="step-card">
              <div class="step-header">
                <span class="step-number">1</span>
                <h4>Authentication</h4>
              </div>
              <ul>
                <li>이메일/비밀번호 로그인 활성화</li>
                <li>Authorized domains에 추가:
                  <ul>
                    <li><code>localhost</code></li>
                    <li><code>cnx-library.web.app</code></li>
                    <li><code>rarecat85.github.io</code></li>
                  </ul>
                </li>
                <li>이메일 인증/비밀번호 재설정: 자체 토큰 시스템 사용<br><small style="color: #888;">(Firebase Action URL 미사용)</small></li>
              </ul>
            </div>
            
            <div class="step-card">
              <div class="step-header">
                <span class="step-number">2</span>
                <h4>Firestore Database</h4>
              </div>
              <ul>
                <li>보안 규칙: <code>firestore.rules</code> 파일 참조</li>
                <li>인덱스: <code>firestore.indexes.json</code> 파일 참조</li>
              </ul>
            </div>
            
            <div class="step-card">
              <div class="step-header">
                <span class="step-number">3</span>
                <h4>Functions</h4>
              </div>
              <ul>
                <li>Node.js 20 런타임 사용</li>
                <li>스케줄러: Cloud Scheduler 연동</li>
              </ul>
            </div>
          </div>

          <h3>Firebase CLI 로그인</h3>
          <div class="code-block">
            <pre>npx firebase login</pre>
          </div>
        </div>
      </section>

      <!-- Firestore 스키마 -->
      <section id="firestore" class="guide-section">
        <h2>📊 Firestore 데이터 구조</h2>
        <div class="section-content">
          <h3>Collections</h3>
          
          <div class="schema-card">
            <h4>users</h4>
            <div class="code-block">
              <pre>{
  uid: string,
  email: string,
  name: string,
  workplace: string,           // 근무지 (강남, 용산, 잠실 등)
  role: string,                // 'user'(기본) | 'manager' | 'admin'
  center: string,              // 매니저/관리자 소속 센터 (선택)
  emailVerified: boolean,
  receiveEmailNotifications: boolean,  // 이메일 알림 수신
  createdAt: timestamp,
  updatedAt: timestamp
}</pre>
            </div>
            <p class="schema-note">* 회원가입 시 <code>role: 'user'</code>가 기본값으로 설정됨</p>
            <p class="schema-note">* 최고관리자가 매니저 지정 시 <code>center</code> 필드가 자동 배정됨</p>
          </div>

          <div class="schema-card">
            <h4>books</h4>
            <div class="code-block">
              <pre>{
  isbn: string,
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  image: string,               // 표지 이미지 URL
  cover: string,               // 표지 이미지 URL (alias)
  center: string,              // 소속 센터 (강남센터, 용산센터)
  category: string,            // 도서 카테고리
  labelNumber: string,         // 라벨번호 (예: 국내소설_20001)
  location: string,            // 위치 (구매칸, 기부칸, 1~16)
  status: string,              // 'available' | 'rented' | 'requested'
  rentedBy: string,            // 대여자 UID
  rentedAt: timestamp,
  expectedReturnDate: timestamp,
  requestedBy: string,         // 대여 신청자 UID
  registeredBy: string,
  registeredAt: timestamp
}</pre>
            </div>
            <p class="schema-note">* <code>labelNumber</code>는 고유해야 함</p>
            <p class="schema-note">* <code>location</code>이 '구매칸'인 도서는 NEW 표시됨</p>
          </div>

          <div class="schema-card">
            <h4>bookRequests</h4>
            <div class="code-block">
              <pre>{
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  cover: string,
  center: string,
  status: string,              // 'pending' | 'approved' | 'rejected'
  requestedBy: string,
  requestedAt: timestamp
}</pre>
            </div>
          </div>

          <div class="schema-card">
            <h4>notifications</h4>
            <div class="code-block">
              <pre>{
  userId: string,
  type: string,                // 알림 타입 (아래 표 참조)
  title: string,
  message: string,
  isRead: boolean,
  createdAt: timestamp,
  expiresAt: timestamp,        // 30일 후 자동 삭제
  bookId: string,
  bookTitle: string,
  center: string
}</pre>
            </div>
          </div>

          <h3>알림 타입</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>타입</th>
                <th>설명</th>
                <th>대상</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>book_request</code></td>
                <td>도서 등록 신청</td>
                <td>관리자</td>
              </tr>
              <tr>
                <td><code>rent_request</code></td>
                <td>도서 대여 신청</td>
                <td>관리자</td>
              </tr>
              <tr>
                <td><code>book_registered</code></td>
                <td>신청 도서 등록 완료</td>
                <td>신청자</td>
              </tr>
              <tr>
                <td><code>return_reminder</code></td>
                <td>반납 예정일 1일 전</td>
                <td>대여자</td>
              </tr>
              <tr>
                <td><code>overdue</code></td>
                <td>연체 알림</td>
                <td>대여자</td>
              </tr>
              <tr>
                <td><code>overdue_admin</code></td>
                <td>연체 알림</td>
                <td>관리자</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Cloud Functions -->
      <section id="functions" class="guide-section">
        <h2>🔧 Cloud Functions</h2>
        <div class="section-content">
          <h3>함수 목록</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>함수</th>
                <th>타입</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>updateEmailVerificationStatus</code></td>
                <td>onCall</td>
                <td>이메일 인증 상태 업데이트</td>
              </tr>
              <tr>
                <td><code>resendVerificationEmailWithReset</code></td>
                <td>onCall</td>
                <td>재인증 이메일 발송</td>
              </tr>
              <tr>
                <td><code>searchNaverBooks</code></td>
                <td>onCall</td>
                <td>네이버 도서 검색 (국내/외국)</td>
              </tr>
              <tr>
                <td><code>getAladinBestsellers</code></td>
                <td>onCall</td>
                <td>알라딘 베스트셀러 조회</td>
              </tr>
              <tr>
                <td><code>onBookRequestCreated</code></td>
                <td>Firestore Trigger</td>
                <td>도서 신청 시 관리자 알림</td>
              </tr>
              <tr>
                <td><code>onRentRequestCreated</code></td>
                <td>Firestore Trigger</td>
                <td>대여 신청 시 관리자 알림</td>
              </tr>
              <tr>
                <td><code>onBookRequestApproved</code></td>
                <td>Firestore Trigger</td>
                <td>신청 승인 시 사용자 알림</td>
              </tr>
              <tr>
                <td><code>scheduledNotifications</code></td>
                <td>Scheduled</td>
                <td>매일 09:00 반납/연체 알림</td>
              </tr>
            </tbody>
          </table>

          <h3>Functions 로그 확인</h3>
          <div class="code-block">
            <pre>npx firebase functions:log</pre>
          </div>
        </div>
      </section>

      <!-- 이메일 알림 -->
      <section id="email" class="guide-section">
        <h2>📧 이메일 알림 설정</h2>
        <div class="section-content">
          <h3>이메일 발송 종류</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>종류</th>
                <th>발송 시점</th>
                <th>대상</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>회원가입 인증</strong></td>
                <td>회원가입 시 (Firebase Auth)</td>
                <td>가입자</td>
              </tr>
              <tr>
                <td><strong>비밀번호 재설정</strong></td>
                <td>비밀번호 찾기 요청 시 (Firebase Auth)</td>
                <td>요청자</td>
              </tr>
              <tr>
                <td><strong>도서 등록 신청 알림</strong></td>
                <td>사용자가 도서 신청 시</td>
                <td>관리자 (이메일 알림 활성화된 경우)</td>
              </tr>
              <tr>
                <td><strong>도서 대여 신청 알림</strong></td>
                <td>타 센터 도서 대여 신청 시</td>
                <td>관리자 (이메일 알림 활성화된 경우)</td>
              </tr>
              <tr>
                <td><strong>신청 도서 등록 알림</strong></td>
                <td>관리자가 신청 도서 등록 시</td>
                <td>신청자 (이메일 알림 활성화된 경우)</td>
              </tr>
              <tr>
                <td><strong>반납 예정 알림</strong></td>
                <td>반납예정일 1일 전 (매일 09:00)</td>
                <td>대여자 (이메일 알림 활성화된 경우)</td>
              </tr>
              <tr>
                <td><strong>연체 알림</strong></td>
                <td>반납예정일 초과 시 (매일 09:00)</td>
                <td>대여자/관리자 (이메일 알림 활성화된 경우)</td>
              </tr>
            </tbody>
          </table>
          
          <div class="info-box">
            <h4>💡 이메일 알림 활성화 조건</h4>
            <ul>
              <li>사용자가 알림 페이지에서 "이메일로 알림 받기" 토글 활성화</li>
              <li>Firestore <code>users</code> 컬렉션의 <code>receiveEmailNotifications: true</code></li>
              <li>회원가입 인증, 비밀번호 재설정은 설정과 무관하게 항상 발송</li>
            </ul>
          </div>

          <h3>Gmail 앱 비밀번호 발급</h3>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>Google 계정 2단계 인증 활성화</strong>
                <p>보안 > 2단계 인증 활성화</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>앱 비밀번호 생성</strong>
                <p><a href="https://myaccount.google.com/apppasswords" target="_blank">https://myaccount.google.com/apppasswords</a></p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>functions/.env에 설정</strong>
                <p>GMAIL_APP_PASSWORD=생성된_비밀번호</p>
              </div>
            </li>
          </ol>

          <div class="info-box">
            <h4>📬 이메일 발송 계정</h4>
            <ul>
              <li><strong>발신자:</strong> cnx.library.noreply@gmail.com</li>
              <li><strong>앱 비밀번호:</strong> functions/.env에 저장</li>
              <li><strong>발송 방식:</strong> Nodemailer + Gmail SMTP</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 외부 API -->
      <section id="aladin" class="guide-section">
        <h2>📱 외부 API</h2>
        <div class="section-content">
          <h3>네이버 도서 API</h3>
          <p>도서 검색에 사용됩니다. 국내/외국 도서 모두 검색 가능합니다.</p>
          
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>네이버 개발자 센터 가입</strong>
                <p><a href="https://developers.naver.com" target="_blank">https://developers.naver.com</a></p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>애플리케이션 등록 및 API 사용 신청</strong>
                <p>검색 API > 도서 검색 선택</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>functions/.env에 설정</strong>
                <p>NAVER_CLIENT_ID=발급받은_ID<br>NAVER_CLIENT_SECRET=발급받은_SECRET</p>
              </div>
            </li>
          </ol>
          
          <div class="info-box">
            <h4>💡 세트/전집 필터링</h4>
            <p>검색 결과에서 세트, 전집, 박스 등의 키워드가 포함된 도서는 자동 필터링됩니다.</p>
            <ul>
              <li>한글: 세트, 전집, 박스, 시리즈, 전권, 합본, 모음 등</li>
              <li>영문: box, boxed set, collection, complete, omnibus 등</li>
            </ul>
          </div>
          
          <h3>알라딘 API</h3>
          <p>베스트셀러 조회에 사용됩니다.</p>
          
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>알라딘 Open API 가입</strong>
                <p><a href="https://www.aladin.co.kr/ttb/wblog_manage.aspx" target="_blank">https://www.aladin.co.kr/ttb/wblog_manage.aspx</a></p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>TTB 키 발급</strong>
                <p>블로그 등록 후 TTB 키 확인</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>functions/.env에 설정</strong>
                <p>ALADIN_TTB_KEY=발급받은_키</p>
              </div>
            </li>
          </ol>

          <h3>사용 API 요약</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>서비스</th>
                <th>API</th>
                <th>용도</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>네이버</td>
                <td>도서 검색</td>
                <td>도서 신청/등록 시 검색 (ISBN-13 지원)</td>
              </tr>
              <tr>
                <td>알라딘</td>
                <td>베스트셀러</td>
                <td>메인 페이지 베스트셀러</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 배포 -->
      <section id="deploy" class="guide-section">
        <h2>📦 배포</h2>
        <div class="section-content">
          <h3>Firebase Functions 배포</h3>
          <div class="code-block">
            <pre># Functions 배포
npx firebase deploy --only functions

# Firestore Rules 배포
npx firebase deploy --only firestore:rules

# Functions + Rules 동시 배포
npx firebase deploy --only functions,firestore:rules</pre>
          </div>

          <h3>GitHub Pages 배포</h3>
          <div class="code-block">
            <pre># 정적 빌드
npm run generate

# gh-pages 브랜치에 배포 (별도 설정 필요)</pre>
          </div>

          <h3>배포 URL</h3>
          <div class="url-cards">
            <div class="url-card primary">
              <span class="url-label">GitHub Pages</span>
              <a href="https://rarecat85.github.io/cnx-library" target="_blank">https://rarecat85.github.io/cnx-library</a>
            </div>
          </div>
        </div>
      </section>

      <!-- 트러블슈팅 -->
      <section id="troubleshoot" class="guide-section">
        <h2>❗ 트러블슈팅</h2>
        <div class="section-content">
          <div class="troubleshoot-item">
            <h4>Firebase Functions 배포 오류</h4>
            <div class="code-block error">
              <pre>Error: In non-interactive mode but have no value for the following environment variables</pre>
            </div>
            <p><strong>해결:</strong> <code>functions/.env</code> 파일에 필요한 변수 추가</p>
          </div>

          <div class="troubleshoot-item">
            <h4>이메일 발송 실패</h4>
            <ol>
              <li>Gmail 앱 비밀번호 확인</li>
              <li>2단계 인증 활성화 확인</li>
              <li>Functions 로그 확인: <code>npx firebase functions:log</code></li>
            </ol>
          </div>

          <div class="troubleshoot-item">
            <h4>Firestore 권한 오류</h4>
            <div class="code-block">
              <pre># firestore.rules 확인 후 배포
npx firebase deploy --only firestore:rules</pre>
            </div>
          </div>

          <div class="troubleshoot-item">
            <h4>알림이 오지 않음</h4>
            <ol>
              <li>Cloud Functions 배포 확인</li>
              <li>Functions 로그에서 오류 확인</li>
              <li>Firestore indexes 배포 확인</li>
            </ol>
          </div>
        </div>
      </section>

      <!-- 개발 시 주의사항 -->
      <section id="tips" class="guide-section">
        <h2>📝 개발 시 주의사항</h2>
        <div class="section-content">
          <div class="tip-grid">
            <div class="tip-card warning">
              <h4>⚠️ !important 사용 자제</h4>
              <p>Vuetify 컴포넌트 스타일 오버라이드 시에만 제한적으로 사용</p>
            </div>
            <div class="tip-card warning">
              <h4>⚠️ 센터 매핑 수정 시</h4>
              <p><code>utils/centerMapping.js</code>와 <code>functions/index.js</code> 양쪽 모두 수정 필요</p>
            </div>
            <div class="tip-card warning">
              <h4>⚠️ 라벨번호 체계</h4>
              <p><code>utils/labelConfig.js</code>에서 카테고리, 센터코드, 위치 옵션 관리</p>
            </div>
            <div class="tip-card danger">
              <h4>🚫 환경 변수</h4>
              <p><code>.env</code> 파일은 Git에 커밋하지 않음 (.gitignore 확인)</p>
            </div>
            <div class="tip-card info">
              <h4>ℹ️ Functions 배포</h4>
              <p>코드 수정 후 반드시 <code>firebase deploy --only functions</code> 실행</p>
            </div>
            <div class="tip-card info">
              <h4>ℹ️ 권한 변경</h4>
              <p>Firestore Console에서 <code>users</code> 컬렉션의 <code>role</code> 필드 수정</p>
            </div>
            <div class="tip-card info">
              <h4>ℹ️ 대여 규정</h4>
              <p>최대 5권, 대여기간 7일, 연체 시 추가 대여 불가</p>
            </div>
            <div class="tip-card info">
              <h4>ℹ️ NEW 도서 로직</h4>
              <p><code>location === '구매칸'</code>인 도서만 NEW 표시 (등록일과 무관)</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 사용자 권한 -->
      <section class="guide-section">
        <h2>🔐 사용자 권한</h2>
        <div class="section-content">
          <table class="data-table">
            <thead>
              <tr>
                <th>권한</th>
                <th>설명</th>
                <th>접근 가능 페이지</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>user</code></td>
                <td>일반 사용자</td>
                <td>도서 목록, 마이페이지, 도서 신청</td>
              </tr>
              <tr>
                <td><code>manager</code></td>
                <td>매니저</td>
                <td>+ 관리자 메뉴 (도서 등록/관리, 모든 센터 접근 가능)</td>
              </tr>
              <tr>
                <td><code>admin</code></td>
                <td>최고 관리자</td>
                <td>+ 최고관리자 메뉴 (매니저 관리 - 지정/해제)</td>
              </tr>
            </tbody>
          </table>

          <div class="info-box">
            <h4>💡 역할별 메뉴 접근</h4>
            <ul>
              <li><code>/admin/books/*</code> - manager, admin 접근 가능</li>
              <li><code>/admin/managers</code> - <strong>admin만</strong> 접근 가능</li>
            </ul>
            <p>미들웨어(<code>middleware/admin.js</code>)에서 경로별 권한 체크 수행</p>
          </div>
        </div>
      </section>
    </div>

    <div class="page-footer">
      <p>🔒 이 페이지는 숨겨진 페이지입니다. URL 직접 입력으로만 접근 가능합니다.</p>
      <p>프로젝트 관련 문의는 개발팀으로 연락해주세요.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'page'
})

useHead({
  title: '개발자 가이드 - CNX Library'
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/functions' as *;

.guide-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: rem(20);
  background-color: #fff;
}

.page-header {
  text-align: center;
  margin-bottom: rem(40);
  padding-bottom: rem(20);
  border-bottom: 3px solid #10b981;
  
  h1 {
    font-size: rem(32);
    font-weight: 700;
    color: #065f46;
    margin: 0 0 rem(10) 0;
  }
  
  .subtitle {
    font-size: rem(16);
    color: #666;
    margin: 0;
  }
}

.toc {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  padding: rem(25);
  border-radius: 12px;
  margin-bottom: rem(40);
  
  h2 {
    font-size: rem(18);
    color: #065f46;
    margin: 0 0 rem(15) 0;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: rem(10);
    
    li a {
      display: block;
      padding: rem(8) rem(12);
      background: #fff;
      border-radius: 6px;
      color: #333;
      text-decoration: none;
      font-size: rem(13);
      transition: all 0.2s;
      
      &:hover {
        background: #065f46;
        color: #fff;
      }
    }
  }
}

.guide-section {
  margin-bottom: rem(50);
  scroll-margin-top: rem(20);
  
  h2 {
    font-size: rem(24);
    font-weight: 700;
    color: #065f46;
    margin: 0 0 rem(20) 0;
    padding-bottom: rem(10);
    border-bottom: 2px solid #e0e0e0;
  }
  
  h3 {
    font-size: rem(18);
    font-weight: 600;
    color: #333;
    margin: rem(25) 0 rem(15) 0;
  }
  
  h4 {
    font-size: rem(16);
    font-weight: 600;
    color: #444;
    margin: rem(20) 0 rem(10) 0;
  }
}

.section-content {
  p {
    font-size: rem(15);
    line-height: 1.8;
    color: #444;
    margin: rem(10) 0;
  }
  
  ul, ol {
    padding-left: rem(20);
    margin: rem(10) 0;
    
    li {
      font-size: rem(14);
      line-height: 1.8;
      color: #444;
    }
  }
  
  code {
    background: #f1f5f9;
    padding: rem(2) rem(6);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: rem(13);
    color: #0f766e;
  }
  
  a {
    color: #0f766e;
    text-decoration: underline;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: rem(20);
  margin: rem(20) 0;
}

.feature-card {
  background: #f8fafc;
  padding: rem(20);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  
  h4 {
    margin: 0 0 rem(15) 0;
    font-size: rem(16);
    color: #065f46;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      font-size: rem(13);
      color: #555;
      padding: rem(5) 0;
      padding-left: rem(15);
      position: relative;
      
      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #10b981;
      }
    }
  }
}

.code-block {
  background: #1e293b;
  padding: rem(15);
  border-radius: 8px;
  overflow-x: auto;
  margin: rem(15) 0;
  
  &.error {
    background: #7f1d1d;
  }
  
  pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: rem(13);
    color: #e2e8f0;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: rem(20) 0;
  font-size: rem(13);
  
  th, td {
    border: 1px solid #e2e8f0;
    padding: rem(10) rem(12);
    text-align: left;
  }
  
  th {
    background: #065f46;
    color: #fff;
    font-weight: 600;
  }
  
  tr:nth-child(even) {
    background: #f8fafc;
  }
  
  code {
    background: #e2e8f0;
    padding: rem(1) rem(4);
    border-radius: 3px;
    font-size: rem(12);
  }
}

.step-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: rem(15);
  margin: rem(20) 0;
}

.step-card {
  background: #f8fafc;
  padding: rem(20);
  border-radius: 10px;
  border-left: 4px solid #10b981;
  
  .step-header {
    display: flex;
    align-items: center;
    gap: rem(10);
    margin-bottom: rem(15);
    
    .step-number {
      width: 28px;
      height: 28px;
      background: #10b981;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: rem(14);
    }
    
    h4 {
      margin: 0;
      font-size: rem(15);
      color: #065f46;
    }
  }
  
  ul {
    margin: 0;
    padding-left: rem(20);
    
    li {
      font-size: rem(13);
      line-height: 1.8;
    }
    
    ul {
      margin-top: rem(5);
    }
  }
}

.step-list {
  list-style: none;
  padding: 0;
  margin: rem(15) 0;
  
  li {
    display: flex;
    gap: rem(15);
    margin-bottom: rem(20);
    
    .step-number {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      background: #10b981;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: rem(14);
    }
    
    .step-content {
      flex: 1;
      
      strong {
        display: block;
        font-size: rem(15);
        color: #333;
        margin-bottom: rem(5);
      }
      
      p {
        font-size: rem(14);
        color: #666;
        margin: 0;
      }
    }
  }
}

.schema-card {
  margin: rem(20) 0;
  
  h4 {
    background: #065f46;
    color: #fff;
    padding: rem(10) rem(15);
    margin: 0;
    border-radius: 8px 8px 0 0;
    font-size: rem(14);
  }
  
  .code-block {
    margin: 0;
    border-radius: 0 0 8px 8px;
  }
  
  .schema-note {
    font-size: rem(13);
    color: #666;
    margin: rem(8) 0 0 0;
    padding-left: rem(10);
    
    code {
      background: #e2e8f0;
      padding: rem(1) rem(4);
      border-radius: 3px;
      font-size: rem(12);
    }
  }
}

.info-box {
  background: #ecfdf5;
  border-left: 4px solid #10b981;
  padding: rem(20);
  border-radius: 0 8px 8px 0;
  margin: rem(20) 0;
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(15);
    color: #065f46;
  }
  
  ul {
    margin: 0;
    padding-left: rem(20);
  }
}

.url-cards {
  display: flex;
  flex-direction: column;
  gap: rem(10);
  margin: rem(20) 0;
}

.url-card {
  display: flex;
  align-items: center;
  gap: rem(15);
  padding: rem(15);
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  
  &.primary {
    background: #ecfdf5;
    border-color: #10b981;
  }
  
  .url-label {
    font-size: rem(13);
    font-weight: 600;
    color: #666;
    min-width: 150px;
  }
  
  a {
    font-size: rem(14);
    color: #0f766e;
  }
}

.troubleshoot-item {
  margin-bottom: rem(25);
  padding: rem(20);
  background: #fef2f2;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
  
  h4 {
    margin: 0 0 rem(10) 0;
    color: #b91c1c;
  }
  
  p {
    margin: rem(10) 0 0 0;
  }
  
  ol {
    margin: rem(10) 0 0 0;
    padding-left: rem(20);
  }
}

.tip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: rem(15);
  margin: rem(20) 0;
}

.tip-card {
  padding: rem(20);
  border-radius: 10px;
  border-left: 4px solid;
  
  &.warning {
    background: #fffbeb;
    border-color: #f59e0b;
    
    h4 { color: #92400e; }
  }
  
  &.danger {
    background: #fef2f2;
    border-color: #ef4444;
    
    h4 { color: #b91c1c; }
  }
  
  &.info {
    background: #ecfdf5;
    border-color: #10b981;
    
    h4 { color: #065f46; }
  }
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(14);
  }
  
  p {
    margin: 0;
    font-size: rem(13);
    color: #666;
    line-height: 1.6;
  }
}

.page-footer {
  margin-top: rem(50);
  padding-top: rem(20);
  border-top: 1px solid #e0e0e0;
  text-align: center;
  
  p {
    font-size: rem(13);
    color: #888;
    margin: rem(5) 0;
  }
}

@media (max-width: 768px) {
  .guide-page {
    padding: rem(15);
  }
  
  .page-header h1 {
    font-size: rem(24);
  }
  
  .toc ul {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .feature-grid,
  .step-cards,
  .tip-grid {
    grid-template-columns: 1fr;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
  
  .url-card {
    flex-direction: column;
    align-items: flex-start;
    gap: rem(5);
    
    .url-label {
      min-width: auto;
    }
  }
}
</style>

