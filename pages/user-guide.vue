<template>
  <div class="guide-page">
    <div class="page-header">
      <h1>📚 사용자 이용안내</h1>
      <p class="subtitle">CNX Library 서비스 이용 방법을 안내합니다.</p>
    </div>
    
    <div class="guide-content">
      <!-- 목차 -->
      <nav class="toc">
        <h2>📑 목차</h2>
        <ul>
          <li><a href="#intro">서비스 소개</a></li>
          <li><a href="#auth">회원가입 및 로그인</a></li>
          <li><a href="#books">도서 검색 및 조회</a></li>
          <li><a href="#rental">도서 대여/반납</a></li>
          <li><a href="#request">도서 신청</a></li>
          <li><a href="#mypage">마이페이지</a></li>
          <li><a href="#notification">알림 기능</a></li>
          <li><a href="#faq">자주 묻는 질문</a></li>
        </ul>
      </nav>

      <!-- 서비스 소개 -->
      <section id="intro" class="guide-section">
        <h2>🏠 서비스 소개</h2>
        <div class="section-content">
          <p>CNX Library는 사내 도서 대여 서비스입니다. 각 센터에 비치된 도서를 자유롭게 대여하고 반납할 수 있습니다.</p>
          
          <div class="info-box">
            <h4>📍 운영 센터</h4>
            <ul>
              <li><strong>용산센터:</strong> 용산, 증미, 여의도 근무자</li>
              <li><strong>강남센터:</strong> 강남, 잠실, 수원, 판교 근무자</li>
            </ul>
          </div>
          
          <div class="info-box highlight">
            <h4>⏰ 대여 규정</h4>
            <ul>
              <li>최대 대여 권수: <strong>5권</strong></li>
              <li>대여 기간: <strong>7일</strong></li>
              <li>연체 시 추가 대여 불가</li>
              <li>내 근무지와 동일한 센터 도서는 <strong>즉시 대여</strong> 가능</li>
              <li>내 근무지와 다른 센터 도서는 <strong>관리자 승인 후</strong> 대여</li>
            </ul>
            <p class="small-note">예) 용산 근무자 → 용산센터 도서 즉시 대여 / 증미 근무자 → 용산센터 도서 승인 필요</p>
          </div>
        </div>
      </section>

      <!-- 회원가입 및 로그인 -->
      <section id="auth" class="guide-section">
        <h2>🔐 회원가입 및 로그인</h2>
        <div class="section-content">
          <h3>회원가입</h3>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>로그인 페이지 접속</strong>
                <p>사이트 접속 시 로그인 페이지가 표시됩니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>"회원가입" 클릭</strong>
                <p>로그인 폼 하단의 회원가입 링크를 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>정보 입력</strong>
                <p>회사 이메일(@concentrix.com), 비밀번호, 이름, 근무지를 입력합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">4</span>
              <div class="step-content">
                <strong>이메일 인증</strong>
                <p>입력한 이메일로 발송된 인증 링크를 클릭하여 가입을 완료합니다.</p>
              </div>
            </li>
          </ol>

          <div class="warning-box">
            <h4>⚠️ 주의사항</h4>
            <ul>
              <li><strong>회사 이메일(@concentrix.com)만</strong> 사용 가능합니다.</li>
              <li>이메일 인증을 완료해야 로그인이 가능합니다.</li>
              <li>인증 메일이 오지 않으면 스팸함을 확인하세요.</li>
              <li>근무지는 정확하게 선택해주세요. (센터 배정에 영향)</li>
            </ul>
          </div>

          <h3>비밀번호 찾기</h3>
          <p>로그인 페이지에서 "비밀번호 찾기"를 클릭하면 이메일로 비밀번호 재설정 링크가 발송됩니다.</p>
        </div>
      </section>

      <!-- 도서 검색 및 조회 -->
      <section id="books" class="guide-section">
        <h2>🔍 도서 검색 및 조회</h2>
        <div class="section-content">
          <h3>도서 목록 확인</h3>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>메뉴에서 "도서 목록" 선택</strong>
                <p>좌측 햄버거 메뉴를 열고 "도서 목록"을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>센터 필터링</strong>
                <p>상단 드롭다운에서 원하는 센터를 선택하여 해당 센터의 도서만 볼 수 있습니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>도서 검색</strong>
                <p>검색창에 도서명, 저자명 등을 입력하여 검색할 수 있습니다.</p>
              </div>
            </li>
          </ol>

          <div class="info-box">
            <h4>📊 도서 상태 안내</h4>
            <ul>
              <li><span class="status available">대여가능</span> 바로 대여할 수 있습니다.</li>
              <li><span class="status rented">대여중</span> 다른 사용자가 대여 중입니다.</li>
              <li><span class="status pending">대여신청중</span> 대여 신청이 진행 중입니다.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 도서 대여/반납 -->
      <section id="rental" class="guide-section">
        <h2>📖 도서 대여/반납</h2>
        <div class="section-content">
          <h3>도서 대여하기</h3>
          
          <h4>같은 센터 도서 (즉시 대여)</h4>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>도서 목록에서 원하는 도서 찾기</strong>
                <p>대여 가능한 도서의 "대여하기" 버튼을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>대여 확인</strong>
                <p>팝업에서 "확인"을 누르면 즉시 대여됩니다.</p>
              </div>
            </li>
          </ol>

          <h4>다른 센터 도서 (승인 필요)</h4>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>"대여 신청" 버튼 클릭</strong>
                <p>다른 센터 도서는 "대여 신청" 버튼이 표시됩니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>관리자 승인 대기</strong>
                <p>해당 센터 관리자가 승인하면 대여가 완료됩니다.</p>
              </div>
            </li>
          </ol>

          <h3>도서 반납하기</h3>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>마이페이지 접속</strong>
                <p>메뉴에서 "마이페이지"를 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>반납할 도서 선택</strong>
                <p>"내 대여 목록"에서 반납할 도서를 클릭하여 선택합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>"반납하기" 클릭</strong>
                <p>하단의 반납하기 버튼을 눌러 반납을 완료합니다.</p>
              </div>
            </li>
          </ol>

          <div class="warning-box">
            <h4>⚠️ 연체 주의</h4>
            <p>반납예정일이 지나면 <strong>연체</strong> 상태가 됩니다. 연체 중에는 새로운 도서를 대여할 수 없으니 반드시 기한 내에 반납해주세요.</p>
          </div>
        </div>
      </section>

      <!-- 도서 신청 -->
      <section id="request" class="guide-section">
        <h2>✋ 도서 신청</h2>
        <div class="section-content">
          <p>원하는 도서가 도서관에 없다면 신청할 수 있습니다.</p>
          
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>메뉴에서 "도서 신청" 선택</strong>
                <p>사이드 메뉴에서 "도서 신청"을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>도서 검색</strong>
                <p>검색창에 원하는 도서명을 입력하고 검색합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>"신청하기" 클릭</strong>
                <p>검색 결과에서 원하는 도서의 "신청하기" 버튼을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">4</span>
              <div class="step-content">
                <strong>관리자 검토</strong>
                <p>관리자가 신청을 검토하고 도서를 등록하면 알림을 받습니다.</p>
              </div>
            </li>
          </ol>

          <div class="info-box">
            <h4>💡 신청 현황 확인</h4>
            <p>마이페이지의 "내가 신청한 책" 섹션에서 신청 현황을 확인할 수 있습니다.</p>
          </div>
        </div>
      </section>

      <!-- 마이페이지 -->
      <section id="mypage" class="guide-section">
        <h2>👤 마이페이지</h2>
        <div class="section-content">
          <p>마이페이지에서는 다음 기능을 이용할 수 있습니다:</p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <h4>📚 내 대여 목록</h4>
              <p>현재 대여 중인 도서 목록과 반납예정일을 확인하고 반납할 수 있습니다.</p>
            </div>
            <div class="feature-card">
              <h4>✋ 내가 신청한 책</h4>
              <p>도서 신청 현황을 확인할 수 있습니다.</p>
            </div>
            <div class="feature-card">
              <h4>✅ 읽은 책 목록</h4>
              <p>지금까지 대여했던 도서 기록을 확인할 수 있습니다.</p>
            </div>
            <div class="feature-card">
              <h4>⚙️ 정보 수정</h4>
              <p>이름, 근무지 등 개인정보를 수정할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 알림 기능 -->
      <section id="notification" class="guide-section">
        <h2>🔔 알림 기능</h2>
        <div class="section-content">
          <h3>알림 종류</h3>
          <ul class="notification-list">
            <li>
              <span class="noti-icon">⏰</span>
              <div>
                <strong>반납 예정 알림</strong>
                <p>반납예정일 1일 전에 알림을 받습니다.</p>
              </div>
            </li>
            <li>
              <span class="noti-icon">📕</span>
              <div>
                <strong>연체 알림</strong>
                <p>도서가 연체되면 매일 알림을 받습니다.</p>
              </div>
            </li>
            <li>
              <span class="noti-icon">🎉</span>
              <div>
                <strong>도서 등록 알림</strong>
                <p>신청한 도서가 등록되면 알림을 받습니다.</p>
              </div>
            </li>
          </ul>

          <h3>알림 확인 방법</h3>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>헤더의 벨 아이콘 확인</strong>
                <p>읽지 않은 알림이 있으면 숫자 배지가 표시됩니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>알림 클릭</strong>
                <p>알림을 클릭하면 관련 페이지로 이동합니다.</p>
              </div>
            </li>
          </ol>

          <h3>이메일 알림</h3>
          <p>알림 페이지에서 "이메일로 알림 받기"를 활성화하면 중요한 알림을 이메일로도 받을 수 있습니다.</p>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="guide-section">
        <h2>❓ 자주 묻는 질문</h2>
        <div class="section-content">
          <div class="faq-list">
            <div class="faq-item">
              <h4>Q. 대여 기간을 연장할 수 있나요?</h4>
              <p>A. 현재 대여 연장 기능은 지원하지 않습니다. 반납 후 재대여해주세요.</p>
            </div>
            <div class="faq-item">
              <h4>Q. 한 번에 몇 권까지 대여할 수 있나요?</h4>
              <p>A. 최대 <strong>5권</strong>까지 대여할 수 있습니다. 5권을 모두 대여 중이면 반납 후 추가 대여가 가능합니다.</p>
            </div>
            <div class="faq-item">
              <h4>Q. 다른 센터 도서를 대여하면 어디서 수령하나요?</h4>
              <p>A. 관리자 승인 후 해당 센터에서 직접 수령하시거나, 센터 간 배송을 이용해주세요.</p>
            </div>
            <div class="faq-item">
              <h4>Q. 근무지를 변경하고 싶어요.</h4>
              <p>A. 마이페이지 > 정보수정에서 근무지를 변경할 수 있습니다.</p>
            </div>
            <div class="faq-item">
              <h4>Q. 도서 신청 후 얼마나 기다려야 하나요?</h4>
              <p>A. 관리자 검토 및 도서 구매에 따라 다르며, 보통 1~2주 정도 소요됩니다.</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="page-footer">
      <p>🔒 이 페이지는 숨겨진 페이지입니다. URL 직접 입력으로만 접근 가능합니다.</p>
      <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'page'
})

useHead({
  title: '사용자 이용안내 - CNX Library'
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/functions' as *;

.guide-page {
  max-width: 900px;
  margin: 0 auto;
  padding: rem(20);
  background-color: #fff;
}

.page-header {
  text-align: center;
  margin-bottom: rem(40);
  padding-bottom: rem(20);
  border-bottom: 3px solid #002C5B;
  
  h1 {
    font-size: rem(32);
    font-weight: 700;
    color: #002C5B;
    margin: 0 0 rem(10) 0;
  }
  
  .subtitle {
    font-size: rem(16);
    color: #666;
    margin: 0;
  }
}

.toc {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: rem(25);
  border-radius: 12px;
  margin-bottom: rem(40);
  
  h2 {
    font-size: rem(18);
    color: #002C5B;
    margin: 0 0 rem(15) 0;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: rem(10);
    
    li a {
      display: block;
      padding: rem(8) rem(12);
      background: #fff;
      border-radius: 6px;
      color: #333;
      text-decoration: none;
      font-size: rem(14);
      transition: all 0.2s;
      
      &:hover {
        background: #002C5B;
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
    color: #002C5B;
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
      background: #002C5B;
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

.info-box {
  background: #f0f7ff;
  border-left: 4px solid #002C5B;
  padding: rem(20);
  border-radius: 0 8px 8px 0;
  margin: rem(20) 0;
  
  &.highlight {
    background: #fff7ed;
    border-left-color: #f59e0b;
  }
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(15);
    color: #002C5B;
  }
  
  ul {
    margin: 0;
    padding-left: rem(20);
    
    li {
      font-size: rem(14);
      line-height: 1.8;
      color: #444;
    }
  }
  
  p {
    margin: 0;
    font-size: rem(14);
    
    &.small-note {
      margin-top: rem(12);
      font-size: rem(12);
      color: #888;
      font-style: italic;
    }
  }
}

.warning-box {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  padding: rem(20);
  border-radius: 0 8px 8px 0;
  margin: rem(20) 0;
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(15);
    color: #dc2626;
  }
  
  ul {
    margin: 0;
    padding-left: rem(20);
    
    li {
      font-size: rem(14);
      line-height: 1.8;
      color: #444;
    }
  }
  
  p {
    margin: 0;
    font-size: rem(14);
    color: #444;
  }
}

.status {
  display: inline-block;
  padding: rem(2) rem(8);
  border-radius: 4px;
  font-size: rem(12);
  font-weight: 600;
  
  &.available {
    background: #dcfce7;
    color: #16a34a;
  }
  
  &.rented {
    background: #fee2e2;
    color: #dc2626;
  }
  
  &.pending {
    background: #fef3c7;
    color: #d97706;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: rem(15);
  margin-top: rem(20);
}

.feature-card {
  background: #f8fafc;
  padding: rem(20);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(15);
    color: #002C5B;
  }
  
  p {
    margin: 0;
    font-size: rem(13);
    color: #666;
    line-height: 1.6;
  }
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: rem(15) 0;
  
  li {
    display: flex;
    gap: rem(15);
    padding: rem(15);
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: rem(10);
    
    .noti-icon {
      font-size: rem(24);
    }
    
    strong {
      display: block;
      font-size: rem(15);
      color: #333;
      margin-bottom: rem(5);
    }
    
    p {
      margin: 0;
      font-size: rem(13);
      color: #666;
    }
  }
}

.faq-list {
  .faq-item {
    padding: rem(20);
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: rem(15);
    
    h4 {
      margin: 0 0 rem(10) 0;
      font-size: rem(15);
      color: #002C5B;
    }
    
    p {
      margin: 0;
      font-size: rem(14);
      color: #666;
      line-height: 1.6;
    }
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
    grid-template-columns: 1fr;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>

