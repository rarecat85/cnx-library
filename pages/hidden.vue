<template>
  <div class="hidden-page">
    <div class="page-header">
      <h1>🔐 숨겨진 페이지 목록</h1>
      <p class="subtitle">URL 직접 입력으로만 접근 가능한 페이지들입니다.</p>
    </div>
    
    <div class="page-list">
      <div class="page-card" @click="navigateTo('/user-guide')">
        <div class="card-icon">📚</div>
        <div class="card-content">
          <h3>사용자 이용안내</h3>
          <p>일반 사용자를 위한 서비스 이용 가이드</p>
          <span class="card-url">/user-guide</span>
        </div>
        <v-icon class="card-arrow">mdi-chevron-right</v-icon>
      </div>

      <div class="page-card" @click="navigateTo('/admin-guide')">
        <div class="card-icon">🔧</div>
        <div class="card-content">
          <h3>관리자 이용안내</h3>
          <p>관리자/매니저를 위한 기능 사용 가이드</p>
          <span class="card-url">/admin-guide</span>
        </div>
        <v-icon class="card-arrow">mdi-chevron-right</v-icon>
      </div>

      <div class="page-card" @click="navigateTo('/dev-guide')">
        <div class="card-icon">💻</div>
        <div class="card-content">
          <h3>개발자 가이드</h3>
          <p>프로젝트 개발 및 유지보수 가이드</p>
          <span class="card-url">/dev-guide</span>
        </div>
        <v-icon class="card-arrow">mdi-chevron-right</v-icon>
      </div>

      <div class="page-card" @click="navigateTo('/test-scenario')">
        <div class="card-icon">✅</div>
        <div class="card-content">
          <h3>테스트 시나리오</h3>
          <p>QA 및 기능 검증을 위한 테스트 케이스</p>
          <span class="card-url">/test-scenario</span>
        </div>
        <v-icon class="card-arrow">mdi-chevron-right</v-icon>
      </div>
    </div>

    <div class="page-info">
      <div class="info-box">
        <h4>💡 알림</h4>
        <ul>
          <li>이 페이지들은 사이드 메뉴에 표시되지 않습니다.</li>
          <li>URL을 직접 입력하거나 이 페이지에서 접근할 수 있습니다.</li>
          <li>모든 페이지는 로그인이 필요합니다.</li>
        </ul>
      </div>
    </div>

    <div class="page-footer">
      <p>🔒 이 페이지 URL: <code>/hidden</code></p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'page'
})

useHead({
  title: '숨겨진 페이지 - CNX Library'
})

const router = useRouter()

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/functions' as *;

.hidden-page {
  max-width: 600px;
  margin: 0 auto;
  padding: rem(20);
  background-color: #fff;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: rem(40);
  padding-bottom: rem(20);
  border-bottom: 3px solid #6366f1;
  
  h1 {
    font-size: rem(28);
    font-weight: 700;
    color: #4338ca;
    margin: 0 0 rem(10) 0;
  }
  
  .subtitle {
    font-size: rem(14);
    color: #666;
    margin: 0;
  }
}

.page-list {
  display: flex;
  flex-direction: column;
  gap: rem(15);
}

.page-card {
  display: flex;
  align-items: center;
  gap: rem(15);
  padding: rem(20);
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #eef2ff;
    border-color: #6366f1;
    transform: translateX(5px);
  }
  
  .card-icon {
    font-size: rem(32);
    flex-shrink: 0;
  }
  
  .card-content {
    flex: 1;
    
    h3 {
      margin: 0 0 rem(5) 0;
      font-size: rem(17);
      font-weight: 600;
      color: #333;
    }
    
    p {
      margin: 0 0 rem(8) 0;
      font-size: rem(13);
      color: #666;
    }
    
    .card-url {
      display: inline-block;
      padding: rem(3) rem(8);
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 4px;
      font-size: rem(12);
      font-family: 'Monaco', 'Menlo', monospace;
    }
  }
  
  .card-arrow {
    color: #6366f1;
    font-size: rem(24);
  }
}

.page-info {
  margin-top: rem(40);
}

.info-box {
  background: #eef2ff;
  border-left: 4px solid #6366f1;
  padding: rem(20);
  border-radius: 0 8px 8px 0;
  
  h4 {
    margin: 0 0 rem(10) 0;
    font-size: rem(15);
    color: #4338ca;
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
}

.page-footer {
  margin-top: rem(40);
  padding-top: rem(20);
  border-top: 1px solid #e0e0e0;
  text-align: center;
  
  p {
    font-size: rem(13);
    color: #888;
    margin: 0;
    
    code {
      background: #f1f5f9;
      padding: rem(2) rem(8);
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      color: #4338ca;
    }
  }
}

@media (max-width: 768px) {
  .hidden-page {
    padding: rem(15);
  }
  
  .page-header h1 {
    font-size: rem(24);
  }
  
  .page-card {
    padding: rem(15);
    
    .card-icon {
      font-size: rem(28);
    }
    
    .card-content h3 {
      font-size: rem(15);
    }
  }
}
</style>

