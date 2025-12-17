import{u as c}from"./BR71aGi7.js";import{F as t,G as d,U as e,H as s}from"./BL-9d7-Z.js";const i={class:"guide-page"},v={__name:"dev-guide",setup(n){return c({title:"개발자 가이드 - CNX Library"}),(o,a)=>(s(),d("div",i,[...a[0]||(a[0]=[e(`<div class="page-header" data-v-254c732c><h1 data-v-254c732c>💻 개발자 가이드</h1><p class="subtitle" data-v-254c732c>CNX Library 프로젝트 개발 및 유지보수 가이드</p></div><div class="guide-content" data-v-254c732c><nav class="toc" data-v-254c732c><h2 data-v-254c732c>📑 목차</h2><ul data-v-254c732c><li data-v-254c732c><a href="#overview" data-v-254c732c>프로젝트 개요</a></li><li data-v-254c732c><a href="#tech-stack" data-v-254c732c>기술 스택</a></li><li data-v-254c732c><a href="#structure" data-v-254c732c>프로젝트 구조</a></li><li data-v-254c732c><a href="#setup" data-v-254c732c>설치 및 실행</a></li><li data-v-254c732c><a href="#firebase" data-v-254c732c>Firebase 설정</a></li><li data-v-254c732c><a href="#firestore" data-v-254c732c>Firestore 스키마</a></li><li data-v-254c732c><a href="#functions" data-v-254c732c>Cloud Functions</a></li><li data-v-254c732c><a href="#email" data-v-254c732c>이메일 알림</a></li><li data-v-254c732c><a href="#aladin" data-v-254c732c>알라딘 API</a></li><li data-v-254c732c><a href="#deploy" data-v-254c732c>배포</a></li><li data-v-254c732c><a href="#troubleshoot" data-v-254c732c>트러블슈팅</a></li><li data-v-254c732c><a href="#tips" data-v-254c732c>개발 시 주의사항</a></li></ul></nav><section id="overview" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📋 프로젝트 개요</h2><div class="section-content" data-v-254c732c><p data-v-254c732c>CNX Library는 Concentrix 사내 도서관 관리 시스템입니다. 직원들이 도서를 검색하고 대여/반납할 수 있으며, 관리자는 도서를 등록하고 대여 현황을 관리할 수 있습니다.</p><div class="feature-grid" data-v-254c732c><div class="feature-card" data-v-254c732c><h4 data-v-254c732c>👤 사용자 기능</h4><ul data-v-254c732c><li data-v-254c732c>도서 검색 및 목록 조회</li><li data-v-254c732c>도서 대여/반납 (최대 5권)</li><li data-v-254c732c>도서 등록 신청</li><li data-v-254c732c>대여 현황 및 읽은 책 목록</li><li data-v-254c732c>알림 수신 (웹 + 이메일)</li></ul></div><div class="feature-card" data-v-254c732c><h4 data-v-254c732c>⚙️ 관리자 기능</h4><ul data-v-254c732c><li data-v-254c732c>도서 등록/삭제</li><li data-v-254c732c>도서 신청 승인</li><li data-v-254c732c>대여 현황 관리</li><li data-v-254c732c>대여 처리 (타 센터 대여 신청 승인)</li><li data-v-254c732c>반납 처리</li><li data-v-254c732c>연체 도서 관리</li></ul></div></div><div class="info-box" data-v-254c732c><h4 data-v-254c732c>📍 센터-근무지 매핑</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c>// utils/centerMapping.js
const WORKPLACE_CENTER_MAP = {
  &#39;강남&#39;: &#39;강남센터&#39;,
  &#39;잠실&#39;: &#39;강남센터&#39;,
  &#39;수원&#39;: &#39;강남센터&#39;,
  &#39;판교&#39;: &#39;강남센터&#39;,
  &#39;용산&#39;: &#39;용산센터&#39;,
  &#39;증미&#39;: &#39;용산센터&#39;,
  &#39;여의도&#39;: &#39;용산센터&#39;
}</pre></div></div></div></section><section id="tech-stack" class="guide-section" data-v-254c732c><h2 data-v-254c732c>🛠 기술 스택</h2><div class="section-content" data-v-254c732c><table class="data-table" data-v-254c732c><thead data-v-254c732c><tr data-v-254c732c><th data-v-254c732c>분류</th><th data-v-254c732c>기술</th></tr></thead><tbody data-v-254c732c><tr data-v-254c732c><td data-v-254c732c><strong data-v-254c732c>Frontend</strong></td><td data-v-254c732c>Nuxt 3, Vue 3, Vuetify 3</td></tr><tr data-v-254c732c><td data-v-254c732c><strong data-v-254c732c>Backend</strong></td><td data-v-254c732c>Firebase (Authentication, Firestore, Functions)</td></tr><tr data-v-254c732c><td data-v-254c732c><strong data-v-254c732c>외부 API</strong></td><td data-v-254c732c>알라딘 Open API (도서 검색)</td></tr><tr data-v-254c732c><td data-v-254c732c><strong data-v-254c732c>스타일링</strong></td><td data-v-254c732c>SCSS, Vuetify</td></tr><tr data-v-254c732c><td data-v-254c732c><strong data-v-254c732c>배포</strong></td><td data-v-254c732c>GitHub Pages</td></tr></tbody></table></div></section><section id="structure" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📁 프로젝트 구조</h2><div class="section-content" data-v-254c732c><div class="code-block" data-v-254c732c><pre data-v-254c732c>cnx-library/
├── assets/
│   └── scss/
│       ├── functions.scss    # SCSS 함수 (rem 변환 등)
│       └── main.scss         # 전역 스타일
├── components/
│   ├── BookCard.vue          # 도서 카드 컴포넌트
│   ├── BookListSwiper.vue    # 도서 목록 스와이퍼
│   ├── ConcentrixLogo.vue    # 로고 컴포넌트
│   ├── NotificationBell.vue  # 알림 벨 (헤더)
│   ├── PageLayout.vue        # 페이지 레이아웃
│   └── SideNavigation.vue    # 사이드 네비게이션
├── composables/
│   ├── useAuth.js            # 인증 관련 로직
│   ├── useBooks.js           # 도서 관련 로직 (알라딘 API)
│   └── useNotifications.js   # 알림 관련 로직
├── functions/
│   ├── index.js              # Firebase Cloud Functions
│   ├── package.json
│   └── .env                  # 환경 변수 (Git 제외)
├── middleware/
│   ├── admin.js              # 관리자 권한 체크
│   └── auth.js               # 인증 체크
├── pages/                    # 라우트 페이지들
├── plugins/
│   ├── firebase.client.js    # Firebase 초기화
│   └── vuetify.js            # Vuetify 설정
├── utils/
│   └── centerMapping.js      # 센터-근무지 매핑
├── firebase.json             # Firebase 설정
├── firestore.rules           # Firestore 보안 규칙
└── firestore.indexes.json    # Firestore 인덱스</pre></div></div></section><section id="setup" class="guide-section" data-v-254c732c><h2 data-v-254c732c>🚀 설치 및 실행</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>사전 요구사항</h3><ul data-v-254c732c><li data-v-254c732c>Node.js 20.x 이상</li><li data-v-254c732c>npm 또는 yarn</li><li data-v-254c732c>Firebase CLI (<code data-v-254c732c>npm install -g firebase-tools</code>)</li></ul><h3 data-v-254c732c>설치</h3><div class="code-block" data-v-254c732c><pre data-v-254c732c># 저장소 클론
git clone https://github.com/rarecat85/cnx-library.git
cd cnx-library

# 의존성 설치
npm install

# Functions 의존성 설치
cd functions
npm install
cd ..</pre></div><h3 data-v-254c732c>환경 변수 설정</h3><h4 data-v-254c732c>1. 루트 .env 파일</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c># .env
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cnx-library.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=cnx-library
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cnx-library.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id</pre></div><h4 data-v-254c732c>2. Functions .env 파일</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c># functions/.env
ALADIN_TTB_KEY=your_aladin_ttb_key
GMAIL_USER=cnx.library.noreply@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password</pre></div><h3 data-v-254c732c>로컬 실행</h3><div class="code-block" data-v-254c732c><pre data-v-254c732c># 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5001 접속</pre></div></div></section><section id="firebase" class="guide-section" data-v-254c732c><h2 data-v-254c732c>🔥 Firebase 설정</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>Firebase Console 설정</h3><div class="step-cards" data-v-254c732c><div class="step-card" data-v-254c732c><div class="step-header" data-v-254c732c><span class="step-number" data-v-254c732c>1</span><h4 data-v-254c732c>Authentication</h4></div><ul data-v-254c732c><li data-v-254c732c>이메일/비밀번호 로그인 활성화</li><li data-v-254c732c>Authorized domains에 추가: <ul data-v-254c732c><li data-v-254c732c><code data-v-254c732c>localhost</code></li><li data-v-254c732c><code data-v-254c732c>cnx-library.web.app</code></li><li data-v-254c732c><code data-v-254c732c>rarecat85.github.io</code></li></ul></li><li data-v-254c732c>Email Templates &gt; Action URL:<br data-v-254c732c><code data-v-254c732c>https://rarecat85.github.io/cnx-library</code></li></ul></div><div class="step-card" data-v-254c732c><div class="step-header" data-v-254c732c><span class="step-number" data-v-254c732c>2</span><h4 data-v-254c732c>Firestore Database</h4></div><ul data-v-254c732c><li data-v-254c732c>보안 규칙: <code data-v-254c732c>firestore.rules</code> 파일 참조</li><li data-v-254c732c>인덱스: <code data-v-254c732c>firestore.indexes.json</code> 파일 참조</li></ul></div><div class="step-card" data-v-254c732c><div class="step-header" data-v-254c732c><span class="step-number" data-v-254c732c>3</span><h4 data-v-254c732c>Functions</h4></div><ul data-v-254c732c><li data-v-254c732c>Node.js 20 런타임 사용</li><li data-v-254c732c>스케줄러: Cloud Scheduler 연동</li></ul></div></div><h3 data-v-254c732c>Firebase CLI 로그인</h3><div class="code-block" data-v-254c732c><pre data-v-254c732c>npx firebase login</pre></div></div></section><section id="firestore" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📊 Firestore 데이터 구조</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>Collections</h3><div class="schema-card" data-v-254c732c><h4 data-v-254c732c>users</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c>{
  uid: string,
  email: string,
  name: string,
  workplace: string,           // 근무지 (강남, 용산, 잠실 등)
  role: string,                // &#39;user&#39; | &#39;admin&#39; | &#39;manager&#39;
  emailVerified: boolean,
  receiveEmailNotifications: boolean,  // 이메일 알림 수신
  createdAt: timestamp,
  updatedAt: timestamp
}</pre></div></div><div class="schema-card" data-v-254c732c><h4 data-v-254c732c>books</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c>{
  isbn: string,
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  image: string,               // 표지 이미지 URL
  center: string,              // 소속 센터 (강남센터, 용산센터)
  status: string,              // &#39;available&#39; | &#39;rented&#39; | &#39;requested&#39;
  rentedBy: string,            // 대여자 UID
  rentedAt: timestamp,
  requestedBy: string,         // 대여 신청자 UID
  registeredBy: string,
  registeredAt: timestamp
}</pre></div></div><div class="schema-card" data-v-254c732c><h4 data-v-254c732c>bookRequests</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c>{
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  cover: string,
  center: string,
  status: string,              // &#39;pending&#39; | &#39;approved&#39; | &#39;rejected&#39;
  requestedBy: string,
  requestedAt: timestamp
}</pre></div></div><div class="schema-card" data-v-254c732c><h4 data-v-254c732c>notifications</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c>{
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
}</pre></div></div><h3 data-v-254c732c>알림 타입</h3><table class="data-table" data-v-254c732c><thead data-v-254c732c><tr data-v-254c732c><th data-v-254c732c>타입</th><th data-v-254c732c>설명</th><th data-v-254c732c>대상</th></tr></thead><tbody data-v-254c732c><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>book_request</code></td><td data-v-254c732c>도서 등록 신청</td><td data-v-254c732c>관리자</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>rent_request</code></td><td data-v-254c732c>도서 대여 신청</td><td data-v-254c732c>관리자</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>book_registered</code></td><td data-v-254c732c>신청 도서 등록 완료</td><td data-v-254c732c>신청자</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>return_reminder</code></td><td data-v-254c732c>반납 예정일 1일 전</td><td data-v-254c732c>대여자</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>overdue</code></td><td data-v-254c732c>연체 알림</td><td data-v-254c732c>대여자</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>overdue_admin</code></td><td data-v-254c732c>연체 알림</td><td data-v-254c732c>관리자</td></tr></tbody></table></div></section><section id="functions" class="guide-section" data-v-254c732c><h2 data-v-254c732c>🔧 Cloud Functions</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>함수 목록</h3><table class="data-table" data-v-254c732c><thead data-v-254c732c><tr data-v-254c732c><th data-v-254c732c>함수</th><th data-v-254c732c>타입</th><th data-v-254c732c>설명</th></tr></thead><tbody data-v-254c732c><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>updateEmailVerificationStatus</code></td><td data-v-254c732c>onCall</td><td data-v-254c732c>이메일 인증 상태 업데이트</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>resendVerificationEmailWithReset</code></td><td data-v-254c732c>onCall</td><td data-v-254c732c>재인증 이메일 발송</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>searchAladinBooks</code></td><td data-v-254c732c>onCall</td><td data-v-254c732c>알라딘 도서 검색</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>getAladinBestsellers</code></td><td data-v-254c732c>onCall</td><td data-v-254c732c>알라딘 베스트셀러 조회</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>onBookRequestCreated</code></td><td data-v-254c732c>Firestore Trigger</td><td data-v-254c732c>도서 신청 시 관리자 알림</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>onRentRequestCreated</code></td><td data-v-254c732c>Firestore Trigger</td><td data-v-254c732c>대여 신청 시 관리자 알림</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>onBookRequestApproved</code></td><td data-v-254c732c>Firestore Trigger</td><td data-v-254c732c>신청 승인 시 사용자 알림</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>scheduledNotifications</code></td><td data-v-254c732c>Scheduled</td><td data-v-254c732c>매일 09:00 반납/연체 알림</td></tr></tbody></table><h3 data-v-254c732c>Functions 로그 확인</h3><div class="code-block" data-v-254c732c><pre data-v-254c732c>npx firebase functions:log</pre></div></div></section><section id="email" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📧 이메일 알림 설정</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>Gmail 앱 비밀번호 발급</h3><ol class="step-list" data-v-254c732c><li data-v-254c732c><span class="step-number" data-v-254c732c>1</span><div class="step-content" data-v-254c732c><strong data-v-254c732c>Google 계정 2단계 인증 활성화</strong><p data-v-254c732c>보안 &gt; 2단계 인증 활성화</p></div></li><li data-v-254c732c><span class="step-number" data-v-254c732c>2</span><div class="step-content" data-v-254c732c><strong data-v-254c732c>앱 비밀번호 생성</strong><p data-v-254c732c><a href="https://myaccount.google.com/apppasswords" target="_blank" data-v-254c732c>https://myaccount.google.com/apppasswords</a></p></div></li><li data-v-254c732c><span class="step-number" data-v-254c732c>3</span><div class="step-content" data-v-254c732c><strong data-v-254c732c>functions/.env에 설정</strong><p data-v-254c732c>GMAIL_APP_PASSWORD=생성된_비밀번호</p></div></li></ol><div class="info-box" data-v-254c732c><h4 data-v-254c732c>📬 이메일 발송 계정</h4><ul data-v-254c732c><li data-v-254c732c><strong data-v-254c732c>발신자:</strong> cnx.library.noreply@gmail.com</li><li data-v-254c732c><strong data-v-254c732c>앱 비밀번호:</strong> functions/.env에 저장</li></ul></div></div></section><section id="aladin" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📱 알라딘 API</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>API 키 발급</h3><ol class="step-list" data-v-254c732c><li data-v-254c732c><span class="step-number" data-v-254c732c>1</span><div class="step-content" data-v-254c732c><strong data-v-254c732c>알라딘 Open API 가입</strong><p data-v-254c732c><a href="https://www.aladin.co.kr/ttb/wblog_manage.aspx" target="_blank" data-v-254c732c>https://www.aladin.co.kr/ttb/wblog_manage.aspx</a></p></div></li><li data-v-254c732c><span class="step-number" data-v-254c732c>2</span><div class="step-content" data-v-254c732c><strong data-v-254c732c>TTB 키 발급</strong><p data-v-254c732c>블로그 등록 후 TTB 키 확인</p></div></li><li data-v-254c732c><span class="step-number" data-v-254c732c>3</span><div class="step-content" data-v-254c732c><strong data-v-254c732c>functions/.env에 설정</strong><p data-v-254c732c>ALADIN_TTB_KEY=발급받은_키</p></div></li></ol><h3 data-v-254c732c>사용 API</h3><table class="data-table" data-v-254c732c><thead data-v-254c732c><tr data-v-254c732c><th data-v-254c732c>API</th><th data-v-254c732c>엔드포인트</th><th data-v-254c732c>용도</th></tr></thead><tbody data-v-254c732c><tr data-v-254c732c><td data-v-254c732c>도서 검색</td><td data-v-254c732c><code data-v-254c732c>ItemSearch.aspx</code></td><td data-v-254c732c>도서 신청/등록 시 검색</td></tr><tr data-v-254c732c><td data-v-254c732c>베스트셀러</td><td data-v-254c732c><code data-v-254c732c>ItemList.aspx</code></td><td data-v-254c732c>메인 페이지 베스트셀러</td></tr></tbody></table></div></section><section id="deploy" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📦 배포</h2><div class="section-content" data-v-254c732c><h3 data-v-254c732c>Firebase Functions 배포</h3><div class="code-block" data-v-254c732c><pre data-v-254c732c># Functions 배포
npx firebase deploy --only functions

# Firestore Rules 배포
npx firebase deploy --only firestore:rules

# Functions + Rules 동시 배포
npx firebase deploy --only functions,firestore:rules</pre></div><h3 data-v-254c732c>GitHub Pages 배포</h3><div class="code-block" data-v-254c732c><pre data-v-254c732c># 정적 빌드
npm run generate

# gh-pages 브랜치에 배포 (별도 설정 필요)</pre></div><h3 data-v-254c732c>배포 URL</h3><div class="url-cards" data-v-254c732c><div class="url-card primary" data-v-254c732c><span class="url-label" data-v-254c732c>GitHub Pages</span><a href="https://rarecat85.github.io/cnx-library" target="_blank" data-v-254c732c>https://rarecat85.github.io/cnx-library</a></div></div></div></section><section id="troubleshoot" class="guide-section" data-v-254c732c><h2 data-v-254c732c>❗ 트러블슈팅</h2><div class="section-content" data-v-254c732c><div class="troubleshoot-item" data-v-254c732c><h4 data-v-254c732c>Firebase Functions 배포 오류</h4><div class="code-block error" data-v-254c732c><pre data-v-254c732c>Error: In non-interactive mode but have no value for the following environment variables</pre></div><p data-v-254c732c><strong data-v-254c732c>해결:</strong> <code data-v-254c732c>functions/.env</code> 파일에 필요한 변수 추가</p></div><div class="troubleshoot-item" data-v-254c732c><h4 data-v-254c732c>이메일 발송 실패</h4><ol data-v-254c732c><li data-v-254c732c>Gmail 앱 비밀번호 확인</li><li data-v-254c732c>2단계 인증 활성화 확인</li><li data-v-254c732c>Functions 로그 확인: <code data-v-254c732c>npx firebase functions:log</code></li></ol></div><div class="troubleshoot-item" data-v-254c732c><h4 data-v-254c732c>Firestore 권한 오류</h4><div class="code-block" data-v-254c732c><pre data-v-254c732c># firestore.rules 확인 후 배포
npx firebase deploy --only firestore:rules</pre></div></div><div class="troubleshoot-item" data-v-254c732c><h4 data-v-254c732c>알림이 오지 않음</h4><ol data-v-254c732c><li data-v-254c732c>Cloud Functions 배포 확인</li><li data-v-254c732c>Functions 로그에서 오류 확인</li><li data-v-254c732c>Firestore indexes 배포 확인</li></ol></div></div></section><section id="tips" class="guide-section" data-v-254c732c><h2 data-v-254c732c>📝 개발 시 주의사항</h2><div class="section-content" data-v-254c732c><div class="tip-grid" data-v-254c732c><div class="tip-card warning" data-v-254c732c><h4 data-v-254c732c>⚠️ !important 사용 자제</h4><p data-v-254c732c>Vuetify 컴포넌트 스타일 오버라이드 시에만 제한적으로 사용</p></div><div class="tip-card warning" data-v-254c732c><h4 data-v-254c732c>⚠️ 센터 매핑 수정 시</h4><p data-v-254c732c><code data-v-254c732c>utils/centerMapping.js</code>와 <code data-v-254c732c>functions/index.js</code> 양쪽 모두 수정 필요</p></div><div class="tip-card danger" data-v-254c732c><h4 data-v-254c732c>🚫 환경 변수</h4><p data-v-254c732c><code data-v-254c732c>.env</code> 파일은 Git에 커밋하지 않음 (.gitignore 확인)</p></div><div class="tip-card info" data-v-254c732c><h4 data-v-254c732c>ℹ️ Functions 배포</h4><p data-v-254c732c>코드 수정 후 반드시 <code data-v-254c732c>firebase deploy --only functions</code> 실행</p></div><div class="tip-card info" data-v-254c732c><h4 data-v-254c732c>ℹ️ 권한 변경</h4><p data-v-254c732c>Firestore Console에서 <code data-v-254c732c>users</code> 컬렉션의 <code data-v-254c732c>role</code> 필드 수정</p></div><div class="tip-card info" data-v-254c732c><h4 data-v-254c732c>ℹ️ 대여 규정</h4><p data-v-254c732c>최대 5권, 대여기간 7일, 연체 시 추가 대여 불가</p></div></div></div></section><section class="guide-section" data-v-254c732c><h2 data-v-254c732c>🔐 사용자 권한</h2><div class="section-content" data-v-254c732c><table class="data-table" data-v-254c732c><thead data-v-254c732c><tr data-v-254c732c><th data-v-254c732c>권한</th><th data-v-254c732c>설명</th><th data-v-254c732c>접근 가능 페이지</th></tr></thead><tbody data-v-254c732c><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>user</code></td><td data-v-254c732c>일반 사용자</td><td data-v-254c732c>도서 목록, 마이페이지, 도서 신청</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>manager</code></td><td data-v-254c732c>매니저</td><td data-v-254c732c>+ 관리자 메뉴 (모든 센터 도서 관리 가능)</td></tr><tr data-v-254c732c><td data-v-254c732c><code data-v-254c732c>admin</code></td><td data-v-254c732c>최고 관리자</td><td data-v-254c732c>시스템 관리, 사용자 권한 관리</td></tr></tbody></table></div></section></div><div class="page-footer" data-v-254c732c><p data-v-254c732c>🔒 이 페이지는 숨겨진 페이지입니다. URL 직접 입력으로만 접근 가능합니다.</p><p data-v-254c732c>프로젝트 관련 문의는 개발팀으로 연락해주세요.</p></div>`,3)])]))}},p=t(v,[["__scopeId","data-v-254c732c"]]);export{p as default};
