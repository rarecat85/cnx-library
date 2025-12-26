<template>
  <div class="sessions-page">
    <div class="page-header">
      <h1>📋 테스트 세션 관리</h1>
      <p class="subtitle">테스트 결과를 기록하고 관리합니다.</p>
    </div>

    <!-- 테스트 페이지 생성 버튼 -->
    <div class="create-section">
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        :loading="creating"
        class="create-btn"
        @click="handleCreateSession"
      >
        <v-icon left>
          mdi-plus
        </v-icon>
        테스트 페이지 생성
      </v-btn>
    </div>

    <!-- 세션 목록 -->
    <div class="sessions-section">
      <div
        v-if="loading"
        class="text-center py-8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="sessions.length === 0"
        class="empty-state"
      >
        <v-icon
          size="64"
          color="grey-lighten-1"
        >
          mdi-clipboard-text-outline
        </v-icon>
        <p>생성된 테스트가 없습니다.</p>
        <p class="text-caption">
          "테스트 페이지 생성" 버튼을 눌러 새 테스트를 시작하세요.
        </p>
      </div>

      <div
        v-else
        class="sessions-list"
      >
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-card"
          @click="navigateToSession(session.id)"
        >
          <div class="session-info">
            <div class="session-header">
              <span class="session-date">{{ formatDate(session.testDate) }}</span>
              <v-chip
                :color="session.status === 'completed' ? 'success' : 'warning'"
                size="small"
                class="status-chip"
              >
                {{ session.status === 'completed' ? '완료' : '진행중' }}
              </v-chip>
            </div>
            <div class="session-tester">
              <v-icon
                size="16"
                class="mr-1"
              >
                mdi-account
              </v-icon>
              {{ formatTesters(session) }}
            </div>
            
            <!-- 진행률 -->
            <div class="session-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getProgressPercent(session) + '%' }"
                />
              </div>
              <div class="progress-stats">
                <span class="stat pass">✅ {{ session.progress?.pass || 0 }}</span>
                <span class="stat fail">❌ {{ session.progress?.fail || 0 }}</span>
                <span class="stat partial">⚠️ {{ session.progress?.partial || 0 }}</span>
                <span class="stat skip">⏭️ {{ session.progress?.skip || 0 }}</span>
                <span class="stat total">
                  {{ Math.min(session.progress?.completed || 0, getTotalTestCount()) }}/{{ getTotalTestCount() }}
                </span>
                <span
                  v-if="(session.progress?.completed || 0) > getTotalTestCount()"
                  class="stat outdated"
                  title="시나리오가 변경되어 진행률이 맞지 않습니다. 세션에 진입하면 자동으로 수정됩니다."
                >
                  ⚠️
                </span>
              </div>
            </div>
          </div>
          
          <div class="session-actions">
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              @click.stop="handleDeleteSession(session)"
            >
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
            <v-icon color="grey">
              mdi-chevron-right
            </v-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <p>🔒 이 페이지는 숨겨진 페이지입니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'page'
})

useHead({
  title: '테스트 세션 관리 - CNX Library'
})

const router = useRouter()
const { confirm, alert } = useDialog()
const {
  createSession,
  getSessions,
  deleteSession,
  getTotalTestCount,
  loading
} = useTestScenario()

const creating = ref(false)
const sessions = ref([])

onMounted(async () => {
  await loadSessions()
})

const loadSessions = async () => {
  try {
    sessions.value = await getSessions()
  } catch (err) {
    console.error('세션 목록 로드 오류:', err)
    await alert('세션 목록을 불러오는데 실패했습니다.', { type: 'error' })
  }
}

const formatTesters = (session) => {
  if (session.testers && session.testers.length > 0) {
    return session.testers.join(', ')
  }
  if (session.tester) {
    return session.tester
  }
  return '(담당자 미입력)'
}

const handleCreateSession = async () => {
  try {
    creating.value = true
    // 빈 세션 생성 (담당자, 일자 등은 테스트 페이지에서 입력)
    const session = await createSession({
      testers: [],
      testDate: new Date()
    })
    
    // 생성된 세션으로 이동
    router.push(`/test-scenario/sessions/${session.id}`)
  } catch (err) {
    console.error('세션 생성 오류:', err)
    await alert('세션 생성에 실패했습니다.', { type: 'error' })
  } finally {
    creating.value = false
  }
}

const handleDeleteSession = async (session) => {
  const testerInfo = formatTesters(session) !== '(담당자 미입력)' ? `"${formatTesters(session)}"의 ` : ''
  const confirmed = await confirm(
    `${testerInfo}${formatDate(session.testDate)} 테스트 세션을 삭제하시겠습니까?\n\n모든 테스트 결과가 함께 삭제됩니다.`,
    { type: 'warning' }
  )
  
  if (!confirmed) return

  try {
    await deleteSession(session.id)
    await loadSessions()
    await alert('테스트 세션이 삭제되었습니다.', { type: 'success' })
  } catch (err) {
    console.error('세션 삭제 오류:', err)
    await alert('세션 삭제에 실패했습니다.', { type: 'error' })
  }
}

const navigateToSession = (sessionId) => {
  router.push(`/test-scenario/sessions/${sessionId}`)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date?.toDate?.() || new Date(date)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getProgressPercent = (session) => {
  const total = getTotalTestCount()
  if (!total) return 0
  const completed = session.progress?.completed || 0
  return Math.min(100, Math.round((completed / total) * 100))
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/functions' as *;

.sessions-page {
  max-width: 800px;
  margin: 0 auto;
  padding: rem(20);
  background-color: #fff;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: rem(24);
  padding-bottom: rem(20);
  border-bottom: 3px solid #002C5B;
  
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: rem(4);
    color: #666;
    text-decoration: none;
    font-size: rem(14);
    margin-bottom: rem(16);
    
    &:hover {
      color: #002C5B;
    }
  }
  
  h1 {
    font-size: rem(28);
    font-weight: 700;
    color: #002C5B;
    margin: 0 0 rem(10) 0;
  }
  
  .subtitle {
    font-size: rem(14);
    color: #666;
    margin: 0;
  }
}

.create-section {
  display: flex;
  justify-content: center;
  margin-bottom: rem(32);
  
  .create-btn {
    min-width: rem(200);
  }
}

.sessions-section {
  h2 {
    font-size: rem(20);
    font-weight: 600;
    color: #333;
    margin: 0 0 rem(20) 0;
  }
}

.empty-state {
  text-align: center;
  padding: rem(48) rem(20);
  color: #888;
  
  p {
    margin: rem(16) 0 rem(8) 0;
  }
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: rem(12);
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: rem(20);
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #eef2ff;
    border-color: #002C5B;
    transform: translateX(4px);
  }
}

.session-info {
  flex: 1;
}

.session-header {
  display: flex;
  align-items: center;
  gap: rem(12);
  margin-bottom: rem(8);
}

.session-date {
  font-size: rem(16);
  font-weight: 600;
  color: #333;
}

.status-chip {
  font-size: rem(11);
}

.session-tester {
  display: flex;
  align-items: center;
  font-size: rem(14);
  color: #666;
  margin-bottom: rem(4);
}

.session-progress {
  margin-top: rem(12);
}

.progress-bar {
  height: rem(6);
  background: #e0e0e0;
  border-radius: rem(3);
  overflow: hidden;
  margin-bottom: rem(8);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: rem(3);
  transition: width 0.3s ease;
}

.progress-stats {
  display: flex;
  flex-wrap: wrap;
  gap: rem(12);
  font-size: rem(12);
  
  .stat {
    color: #666;
    
    &.pass { color: #4caf50; }
    &.fail { color: #f44336; }
    &.partial { color: #ff9800; }
    &.skip { color: #9e9e9e; }
    &.total { 
      color: #333;
      font-weight: 600;
    }
  }
}

.session-actions {
  display: flex;
  align-items: center;
  gap: rem(8);
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
  }
}

@media (max-width: 768px) {
  .sessions-page {
    padding: rem(15);
  }
  
  .page-header h1 {
    font-size: rem(24);
  }
  
  .session-card {
    padding: rem(16);
  }
  
  .progress-stats {
    gap: rem(8);
  }
}
</style>

