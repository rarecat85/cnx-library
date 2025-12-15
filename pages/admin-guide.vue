<template>
  <div class="guide-page">
    <div class="page-header">
      <h1>🔧 관리자 이용안내</h1>
      <p class="subtitle">CNX Library 관리자 기능 사용법을 안내합니다.</p>
    </div>
    
    <div class="guide-content">
      <!-- 목차 -->
      <nav class="toc">
        <h2>📑 목차</h2>
        <ul>
          <li><a href="#role">관리자 권한 안내</a></li>
          <li><a href="#register">도서 등록</a></li>
          <li><a href="#manage">도서 관리</a></li>
          <li><a href="#rental-approve">대여 신청 승인</a></li>
          <li><a href="#return">반납 처리</a></li>
          <li><a href="#notification">알림 수신</a></li>
          <li><a href="#tips">관리 팁</a></li>
        </ul>
      </nav>

      <!-- 관리자 권한 안내 -->
      <section id="role" class="guide-section">
        <h2>👑 관리자 권한 안내</h2>
        <div class="section-content">
          <p>CNX Library에는 3가지 사용자 역할이 있습니다:</p>
          
          <div class="role-grid">
            <div class="role-card user">
              <div class="role-icon">👤</div>
              <h4>일반 사용자 (user)</h4>
              <ul>
                <li>도서 검색 및 조회</li>
                <li>도서 대여/반납</li>
                <li>도서 신청</li>
              </ul>
            </div>
            <div class="role-card manager">
              <div class="role-icon">👔</div>
              <h4>매니저 (manager)</h4>
              <ul>
                <li>일반 사용자 권한 모두 포함</li>
                <li>관리자 메뉴 접근</li>
                <li>도서 등록/삭제</li>
                <li>도서 대여/반납 관리</li>
                <li>연체 도서 관리</li>
                <li class="highlight">💡 센터 변경으로 모든 센터 관리 가능</li>
              </ul>
            </div>
            <div class="role-card admin">
              <div class="role-icon">👑</div>
              <h4>최고 관리자 (admin)</h4>
              <ul>
                <li>시스템 전체 관리자</li>
                <li>사용자 권한 관리 (Firestore)</li>
                <li>관리자 메뉴 접근 가능</li>
                <li class="note">* 도서 관리는 매니저가 담당</li>
              </ul>
            </div>
          </div>

          <div class="info-box">
            <h4>📍 센터 배정</h4>
            <ul>
              <li><strong>용산센터:</strong> 용산, 증미, 여의도 근무자</li>
              <li><strong>강남센터:</strong> 강남, 잠실, 수원, 판교 근무자</li>
            </ul>
            <p>관리자/매니저는 본인 근무지의 센터에 소속됩니다.</p>
          </div>
        </div>
      </section>

      <!-- 도서 등록 -->
      <section id="register" class="guide-section">
        <h2>📕 도서 등록</h2>
        <div class="section-content">
          <h3>신규 도서 검색 등록</h3>
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>관리자 메뉴 > 도서 등록</strong>
                <p>사이드 메뉴에서 "관리자 메뉴" > "도서 등록"을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>도서 검색</strong>
                <p>상단 검색창에 등록할 도서명을 입력하고 검색합니다.</p>
                <p class="note">* 알라딘 API를 통해 도서 정보를 검색합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>"등록하기" 클릭</strong>
                <p>검색 결과에서 원하는 도서의 "등록하기" 버튼을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">4</span>
              <div class="step-content">
                <strong>등록 완료</strong>
                <p>소속 센터에 도서가 등록됩니다.</p>
              </div>
            </li>
          </ol>

          <div class="warning-box">
            <h4>⚠️ 주의사항</h4>
            <ul>
              <li>이미 등록된 도서는 "등록됨" 표시가 됩니다.</li>
              <li>세트 상품, 전집류는 자동으로 필터링됩니다.</li>
              <li>도서는 관리자 본인의 소속 센터에 등록됩니다.</li>
            </ul>
          </div>

          <h3>사용자 신청 도서 등록</h3>
          <p>도서 등록 페이지 하단의 "도서 신청 목록"에서 사용자들이 신청한 도서를 확인하고 등록할 수 있습니다.</p>
          
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>신청 목록 확인</strong>
                <p>신청된 도서 카드에서 신청자 정보(근무지, 이름)를 확인합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>"[센터명]에 등록하기" 클릭</strong>
                <p>신청 도서를 해당 센터에 등록합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>신청자 알림</strong>
                <p>등록 완료 시 신청자에게 자동으로 알림이 발송됩니다.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- 도서 관리 -->
      <section id="manage" class="guide-section">
        <h2>📚 도서 관리</h2>
        <div class="section-content">
          <h3>도서 관리 페이지</h3>
          <p>"관리자 메뉴" > "도서 관리"에서 등록된 도서를 관리할 수 있습니다.</p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <h4>🔍 도서 검색</h4>
              <p>검색창에서 도서명으로 빠르게 검색할 수 있습니다.</p>
            </div>
            <div class="feature-card">
              <h4>📊 상태 확인</h4>
              <p>각 도서의 대여 상태와 대여자 정보를 확인할 수 있습니다.</p>
            </div>
            <div class="feature-card">
              <h4>🗑️ 도서 삭제</h4>
              <p>대여중이 아닌 도서를 삭제할 수 있습니다.</p>
            </div>
            <div class="feature-card">
              <h4>↩️ 반납 처리</h4>
              <p>대여중인 도서를 관리자가 직접 반납 처리할 수 있습니다.</p>
            </div>
          </div>

          <h3>도서 카드 정보</h3>
          <div class="info-box">
            <h4>대여중인 도서 카드에 표시되는 정보:</h4>
            <ul>
              <li><strong>대여자 근무지:</strong> 대여한 사용자의 근무지</li>
              <li><strong>대여자 이름 (이메일):</strong> 대여자 식별 정보</li>
              <li><strong>반납예정일:</strong> 대여일로부터 7일 후</li>
              <li><strong>반납 처리 버튼:</strong> 관리자 반납 처리용</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 대여 신청 승인 -->
      <section id="rental-approve" class="guide-section">
        <h2>✅ 대여 신청 승인</h2>
        <div class="section-content">
          <p>다른 센터 사용자가 도서 대여를 신청하면 관리자 승인이 필요합니다.</p>
          
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>알림 확인</strong>
                <p>새로운 대여 신청이 있으면 알림을 받습니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>도서 관리 페이지 이동</strong>
                <p>"관리자 메뉴" > "도서 관리"로 이동합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>신청 도서 확인</strong>
                <p>"대여 신청 중" 상태의 도서를 찾습니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">4</span>
              <div class="step-content">
                <strong>"승인" 버튼 클릭</strong>
                <p>승인하면 해당 사용자에게 도서가 대여됩니다.</p>
              </div>
            </li>
          </ol>

          <div class="warning-box">
            <h4>⚠️ 주의사항</h4>
            <p>승인 전 도서 수령 방법(직접 수령 또는 센터 간 배송)을 신청자와 확인하세요.</p>
          </div>
        </div>
      </section>

      <!-- 반납 처리 -->
      <section id="return" class="guide-section">
        <h2>↩️ 반납 처리</h2>
        <div class="section-content">
          <p>관리자는 도서를 직접 반납 처리할 수 있습니다.</p>
          
          <ol class="step-list">
            <li>
              <span class="step-number">1</span>
              <div class="step-content">
                <strong>도서 관리 페이지에서 대여중인 도서 찾기</strong>
                <p>반납 처리할 도서를 찾습니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">2</span>
              <div class="step-content">
                <strong>"반납 처리" 버튼 클릭</strong>
                <p>도서 카드 하단의 "반납 처리" 버튼을 클릭합니다.</p>
              </div>
            </li>
            <li>
              <span class="step-number">3</span>
              <div class="step-content">
                <strong>반납 완료</strong>
                <p>도서 상태가 "대여가능"으로 변경됩니다.</p>
              </div>
            </li>
          </ol>

          <div class="warning-box">
            <h4>⚠️ 반납 처리 전 확인사항</h4>
            <ul>
              <li><strong>실물 도서 확인:</strong> 대여자로부터 실제 도서를 반납받았는지 확인하세요.</li>
              <li><strong>반납 방법:</strong> 직접 반납 또는 센터 간 배송 등 반납 방법을 대여자와 확인하세요.</li>
            </ul>
            <p>시스템상 반납 처리는 실물 도서 반납 후에 진행해주세요.</p>
          </div>

          <div class="info-box">
            <h4>💡 활용 사례</h4>
            <ul>
              <li>사용자가 직접 반납하지 못하는 경우</li>
              <li>도서를 분실한 경우 (분실 처리)</li>
              <li>장기 연체 도서 강제 반납</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 알림 수신 -->
      <section id="notification" class="guide-section">
        <h2>🔔 알림 수신</h2>
        <div class="section-content">
          <h3>관리자 알림 종류</h3>
          <ul class="notification-list">
            <li>
              <span class="noti-icon">📕</span>
              <div>
                <strong>도서 등록 신청</strong>
                <p>사용자가 새로운 도서를 신청했을 때</p>
              </div>
            </li>
            <li>
              <span class="noti-icon">📖</span>
              <div>
                <strong>도서 대여 신청</strong>
                <p>다른 센터 사용자가 도서 대여를 신청했을 때</p>
              </div>
            </li>
            <li>
              <span class="noti-icon">⚠️</span>
              <div>
                <strong>도서 연체 알림</strong>
                <p>소속 센터 도서가 연체되었을 때 (매일 09:00)</p>
              </div>
            </li>
          </ul>

          <h3>이메일 알림 설정</h3>
          <p>알림 페이지에서 "이메일로 알림 받기"를 활성화하면 중요한 알림을 이메일로도 받을 수 있습니다.</p>
          <p>이메일 알림을 활성화하면 즉시 신청 내역을 확인할 수 있어 빠른 대응이 가능합니다.</p>
        </div>
      </section>

      <!-- 관리 팁 -->
      <section id="tips" class="guide-section">
        <h2>💡 관리 팁</h2>
        <div class="section-content">
          <div class="tip-grid">
            <div class="tip-card">
              <div class="tip-number">1</div>
              <h4>정기적인 연체 도서 확인</h4>
              <p>매일 오전에 연체 알림을 확인하고, 장기 연체 도서는 대여자에게 연락하세요.</p>
            </div>
            <div class="tip-card">
              <div class="tip-number">2</div>
              <h4>신속한 신청 처리</h4>
              <p>도서 신청은 가급적 빠르게 검토하여 사용자 만족도를 높이세요.</p>
            </div>
            <div class="tip-card">
              <div class="tip-number">3</div>
              <h4>이메일 알림 활성화</h4>
              <p>중요한 알림을 놓치지 않도록 이메일 알림을 활성화하세요.</p>
            </div>
            <div class="tip-card">
              <div class="tip-number">4</div>
              <h4>베스트셀러 등록</h4>
              <p>메인 페이지의 베스트셀러를 참고하여 인기 도서를 선제적으로 등록하세요.</p>
            </div>
            <div class="tip-card">
              <div class="tip-number">5</div>
              <h4>센터 간 협력</h4>
              <p>타 센터 대여 신청 시 배송 일정 등을 미리 조율하세요.</p>
            </div>
            <div class="tip-card">
              <div class="tip-number">6</div>
              <h4>도서 상태 관리</h4>
              <p>분실, 파손 도서는 삭제 처리하고 기록을 남겨두세요.</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="page-footer">
      <p>🔒 이 페이지는 숨겨진 페이지입니다. URL 직접 입력으로만 접근 가능합니다.</p>
      <p>추가 문의사항은 시스템 관리자에게 연락해주세요.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'page'
})

useHead({
  title: '관리자 이용안내 - CNX Library'
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
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: rem(25);
  border-radius: 12px;
  margin-bottom: rem(40);
  
  h2 {
    font-size: rem(18);
    color: #92400e;
    margin: 0 0 rem(15) 0;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
        background: #92400e;
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
    
    &.note {
      font-size: rem(13);
      color: #888;
      font-style: italic;
    }
  }
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: rem(20);
  margin: rem(25) 0;
}

.role-card {
  padding: rem(25);
  border-radius: 12px;
  border: 2px solid;
  
  &.user {
    background: #f0fdf4;
    border-color: #86efac;
  }
  
  &.manager {
    background: #eff6ff;
    border-color: #93c5fd;
  }
  
  &.admin {
    background: #fef3c7;
    border-color: #fcd34d;
  }
  
  .role-icon {
    font-size: rem(32);
    margin-bottom: rem(10);
  }
  
  h4 {
    margin: 0 0 rem(15) 0;
    font-size: rem(16);
    color: #333;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      font-size: rem(13);
      color: #555;
      padding: rem(5) 0;
      border-bottom: 1px dashed #ddd;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.note {
        color: #888;
        font-size: rem(12);
        font-style: italic;
        border-bottom: none;
        margin-top: rem(5);
      }
      
      &.highlight {
        color: #0369a1;
        font-weight: 500;
        background: #e0f2fe;
        padding: rem(8);
        border-radius: 4px;
        margin-top: rem(8);
        border-bottom: none;
      }
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
        margin: rem(3) 0;
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
    margin: rem(10) 0 0 0;
    font-size: rem(14);
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

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.tip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: rem(20);
  margin-top: rem(20);
}

.tip-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: rem(20);
  border-radius: 12px;
  position: relative;
  
  .tip-number {
    position: absolute;
    top: rem(-10);
    left: rem(-10);
    width: 32px;
    height: 32px;
    background: #92400e;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: rem(14);
  }
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(15);
    color: #78350f;
    padding-left: rem(15);
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
    grid-template-columns: 1fr;
  }
  
  .role-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .tip-grid {
    grid-template-columns: 1fr;
  }
}
</style>

