# CNX Library

사내 도서 대여 관리 시스템

## 📋 프로젝트 개요

CNX Library는 Concentrix 사내 도서관 관리 시스템입니다. 직원들이 도서를 검색하고 대여/반납할 수 있으며, 관리자는 도서를 등록하고 대여 현황을 관리할 수 있습니다.

### 주요 기능

- **사용자 기능**
  - 도서 검색 및 목록 조회
  - 도서 대여/반납
  - 도서 등록 신청
  - 대여 현황 및 읽은 책 목록 확인
  - 알림 수신 (웹 + 이메일)

- **관리자 기능**
  - 도서 등록/삭제
  - 도서 신청 승인
  - 대여 현황 관리
  - 반납 처리

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | Nuxt 3, Vue 3, Vuetify 3 |
| **Backend** | Firebase (Authentication, Firestore, Functions, Hosting) |
| **외부 API** | 알라딘 Open API (도서 검색) |
| **스타일링** | SCSS, Vuetify |
| **배포** | Firebase Hosting, GitHub Pages |

---

## 📁 프로젝트 구조

```
cnx-library/
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
│   ├── useNaverBooks.js      # 도서 관련 로직 (알라딘 API)
│   └── useNotifications.js   # 알림 관련 로직
├── functions/
│   ├── index.js              # Firebase Cloud Functions
│   ├── package.json
│   └── .env                  # 환경 변수 (Git 제외)
├── middleware/
│   ├── admin.js              # 관리자 권한 체크
│   └── auth.js               # 인증 체크
├── pages/
│   ├── admin/
│   │   └── books/
│   │       ├── index.vue     # 도서 관리
│   │       └── register.vue  # 도서 등록
│   ├── books/
│   │   ├── index.vue         # 도서 목록
│   │   └── request.vue       # 도서 신청
│   ├── mypage/
│   │   ├── index.vue         # 마이페이지
│   │   └── edit.vue          # 정보 수정
│   ├── index.vue             # 메인 페이지
│   ├── login.vue             # 로그인
│   ├── signup.vue            # 회원가입
│   ├── forgot-password.vue   # 비밀번호 찾기
│   ├── reset-password.vue    # 비밀번호 재설정
│   ├── verify-email.vue      # 이메일 인증
│   └── notifications.vue     # 알림 페이지
├── plugins/
│   ├── firebase.client.js    # Firebase 초기화
│   └── vuetify.js            # Vuetify 설정
├── public/
│   └── images/
│       └── concentrix-logo.svg
├── utils/
│   └── centerMapping.js      # 센터-근무지 매핑
├── firebase.json             # Firebase 설정
├── firestore.rules           # Firestore 보안 규칙
├── firestore.indexes.json    # Firestore 인덱스
├── nuxt.config.js            # Nuxt 설정
└── package.json
```

---

## 🚀 설치 및 실행

### 사전 요구사항

- Node.js 20.x 이상
- npm 또는 yarn
- Firebase CLI (`npm install -g firebase-tools`)

### 설치

```bash
# 저장소 클론
git clone https://github.com/rarecat85/cnx-library.git
cd cnx-library

# 의존성 설치
npm install

# Functions 의존성 설치
cd functions
npm install
cd ..
```

### 환경 변수 설정

#### 1. 루트 `.env` 파일 생성

```bash
# .env
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cnx-library.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=cnx-library
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cnx-library.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 2. Functions `.env` 파일 생성

```bash
# functions/.env
ALADIN_TTB_KEY=your_aladin_ttb_key
GMAIL_USER=cnx.library.noreply@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 로컬 실행

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

---

## 🔥 Firebase 설정

### Firebase Console 설정

1. **Authentication**
   - 이메일/비밀번호 로그인 활성화
   - Authorized domains에 배포 도메인 추가
     - `localhost`
     - `cnx-library.web.app`
     - `rarecat85.github.io`
   - Email Templates > Action URL: `https://rarecat85.github.io/cnx-library`

2. **Firestore Database**
   - 보안 규칙: `firestore.rules` 파일 참조
   - 인덱스: `firestore.indexes.json` 파일 참조

3. **Functions**
   - Node.js 20 런타임 사용

### Firebase CLI 로그인

```bash
npx firebase login
```

---

## 📦 배포

### Firebase Hosting + Functions 배포

```bash
# 빌드
npm run build

# 전체 배포 (Hosting + Functions + Firestore Rules)
npx firebase deploy

# Functions만 배포
npx firebase deploy --only functions

# Hosting만 배포
npx firebase deploy --only hosting
```

### GitHub Pages 배포

```bash
# 빌드
npm run generate

# gh-pages 브랜치에 배포 (별도 설정 필요)
```

### 배포 URL

- **Firebase Hosting**: https://cnx-library.web.app
- **GitHub Pages**: https://rarecat85.github.io/cnx-library

---

## 📊 Firestore 데이터 구조

### Collections

#### `users`
```javascript
{
  uid: string,
  email: string,
  name: string,
  workplace: string,           // 근무지 (강남, 용산, 잠실 등)
  role: string,                // 'user' | 'admin' | 'manager'
  emailVerified: boolean,
  emailVerifiedAt: timestamp,
  emailNotification: boolean,  // 이메일 알림 수신 여부
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `books`
```javascript
{
  isbn: string,
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  pubdate: string,
  description: string,
  image: string,               // 표지 이미지 URL
  center: string,              // 소속 센터 (강남센터, 용산센터)
  status: string,              // 'available' | 'rented' | 'requested'
  rentedBy: string,            // 대여자 UID
  rentedAt: timestamp,
  requestedBy: string,         // 대여 신청자 UID
  requestedAt: timestamp,
  registeredBy: string,
  registeredAt: timestamp
}
```

#### `bookRequests`
```javascript
{
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  cover: string,
  center: string,
  status: string,              // 'pending' | 'approved' | 'rejected'
  requestedBy: string,
  requestedAt: timestamp
}
```

#### `rentalHistory`
```javascript
{
  bookId: string,
  isbn13: string,
  title: string,
  author: string,
  publisher: string,
  cover: string,
  center: string,
  userId: string,
  rentedAt: timestamp,
  returnedAt: timestamp,
  rentCount: number
}
```

#### `notifications`
```javascript
{
  userId: string,
  type: string,                // 알림 타입 (아래 참조)
  title: string,
  message: string,
  isRead: boolean,
  createdAt: timestamp,
  expiresAt: timestamp,        // 30일 후 자동 삭제
  // 추가 필드 (타입별)
  bookId: string,
  bookTitle: string,
  center: string
}
```

### 알림 타입

| 타입 | 설명 | 대상 |
|------|------|------|
| `book_request` | 도서 등록 신청 | 관리자 |
| `rent_request` | 도서 대여 신청 | 관리자 |
| `book_registered` | 신청 도서 등록 완료 | 신청자 |
| `return_reminder` | 반납 예정일 1일 전 | 대여자 |
| `overdue` | 연체 알림 | 대여자 |
| `overdue_admin` | 연체 알림 | 관리자 |

---

## 🔧 Cloud Functions

### 함수 목록

| 함수 | 타입 | 설명 |
|------|------|------|
| `updateEmailVerificationStatus` | onCall | 이메일 인증 상태 업데이트 |
| `resendVerificationEmailWithReset` | onCall | 재인증 이메일 발송 |
| `searchAladinBooks` | onCall | 알라딘 도서 검색 |
| `getAladinBestsellers` | onCall | 알라딘 베스트셀러 조회 |
| `onBookRequestCreated` | Firestore Trigger | 도서 신청 시 관리자 알림 |
| `onRentRequestCreated` | Firestore Trigger | 대여 신청 시 관리자 알림 |
| `onBookRequestApproved` | Firestore Trigger | 신청 승인 시 사용자 알림 |
| `scheduledNotifications` | Scheduled | 매일 09:00 반납/연체 알림 |

### Functions 로그 확인

```bash
npx firebase functions:log
```

---

## 🏢 센터-근무지 매핑

```javascript
// utils/centerMapping.js
const WORKPLACE_CENTER_MAP = {
  '강남': '강남센터',
  '잠실': '강남센터',
  '수원': '강남센터',
  '판교': '강남센터',
  '용산': '용산센터',
  '증미': '용산센터',
  '여의도': '용산센터'
}
```

---

## 📧 이메일 알림 설정

### Gmail 앱 비밀번호 발급

1. Google 계정 > 보안 > 2단계 인증 활성화
2. 앱 비밀번호 생성 (https://myaccount.google.com/apppasswords)
3. `functions/.env`에 설정

### 이메일 발송 계정

- **발신자**: cnx.library.noreply@gmail.com
- **앱 비밀번호**: functions/.env에 저장

---

## 📱 알라딘 API

### API 키 발급

1. 알라딘 Open API 가입: https://www.aladin.co.kr/ttb/wblog_manage.aspx
2. TTB 키 발급
3. `functions/.env`에 `ALADIN_TTB_KEY` 설정

### 사용 API

- 도서 검색: `ItemSearch.aspx`
- 베스트셀러: `ItemList.aspx` (QueryType=Bestseller)

---

## 🔐 사용자 권한

| 권한 | 설명 | 접근 가능 페이지 |
|------|------|-----------------|
| `user` | 일반 사용자 | 도서 목록, 마이페이지, 도서 신청 |
| `manager` | 매니저 | + 관리자 메뉴 (도서 관리) |
| `admin` | 관리자 | + 모든 권한 |

### 권한 변경

Firestore Console에서 `users` 컬렉션의 `role` 필드 수정

---

## ❗ 트러블슈팅

### Firebase Functions 배포 오류

```bash
# 환경 변수 누락 시
Error: In non-interactive mode but have no value for the following environment variables

# 해결: functions/.env 파일에 필요한 변수 추가
```

### 이메일 발송 실패

1. Gmail 앱 비밀번호 확인
2. 2단계 인증 활성화 확인
3. Functions 로그에서 오류 확인: `npx firebase functions:log`

### Firestore 권한 오류

```bash
# firestore.rules 확인 후 배포
npx firebase deploy --only firestore:rules
```

---

## 📝 개발 시 주의사항

1. **!important 사용 자제**: Vuetify 컴포넌트 스타일 오버라이드 시에만 제한적 사용
2. **센터 매핑 수정 시**: `utils/centerMapping.js`와 `functions/index.js` 양쪽 수정 필요
3. **환경 변수**: `.env` 파일은 Git에 커밋하지 않음
4. **Functions 배포**: 코드 수정 후 반드시 `firebase deploy --only functions` 실행

---

## 📞 문의

프로젝트 관련 문의는 개발팀으로 연락해주세요.

---

## 📄 라이선스

이 프로젝트는 사내용으로 개발되었습니다.

