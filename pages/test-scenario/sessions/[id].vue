<template>
  <div class="test-scenario-page">
    <!-- 로딩 상태 -->
    <div
      v-if="pageLoading"
      class="text-center py-8"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="mt-4 text-medium-emphasis">
        테스트 세션을 불러오는 중...
      </p>
    </div>

    <template v-else-if="session">
      <div class="page-header">
        <h1>CNX Library 테스트 시나리오</h1>
        <p class="subtitle">이 페이지는 개발자/QA 전용 페이지입니다.</p>
      </div>

      <!-- 테스트 개요 -->
      <div class="section">
        <h2>📋 테스트 개요</h2>
        <p>이 문서는 CNX Library의 모든 기능을 검증하기 위한 테스트 시나리오입니다.<br>테스트 수행 후 각 항목의 결과를 기록하여 시스템의 정상 동작을 확인합니다.</p>
        
        <h3>테스트 환경</h3>
        <table class="info-table">
          <tbody>
            <tr>
              <th>테스트 URL</th>
              <td>https://rarecat85.github.io/cnx-library</td>
            </tr>
            <tr>
              <th>테스트 일자</th>
              <td>
                <input
                  v-model="sessionInfo.testDate"
                  type="date"
                  class="inline-input"
                  @change="updateSessionInfo"
                >
              </td>
            </tr>
            <tr>
              <th>테스트 담당자</th>
              <td>
                <div class="tester-input-row">
                  <input
                    v-model="newTesterName"
                    type="text"
                    placeholder="담당자 이름 입력"
                    class="inline-input tester-input"
                    @keyup.enter="addTester"
                  >
                  <button
                    type="button"
                    class="add-tester-btn"
                    :disabled="!newTesterName.trim()"
                    @click="addTester"
                  >
                    추가
                  </button>
                </div>
                <div
                  v-if="testers.length > 0"
                  class="testers-list"
                >
                  <span
                    v-for="(tester, index) in testers"
                    :key="index"
                    class="tester-tag"
                  >
                    {{ tester }}
                    <button
                      type="button"
                      class="remove-tester-btn"
                      @click="removeTester(index)"
                    >
                      ×
                    </button>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <h3>결과 표기법</h3>
        <ul class="legend-list">
          <li>✅ 통과 (Pass)</li>
          <li>❌ 실패 (Fail)</li>
          <li>⚠️ 부분 통과 (Partial)</li>
          <li>⏭️ 스킵 (Skip)</li>
        </ul>
      </div>

      <!-- 진행률 요약 (상단 고정) -->
      <div class="progress-summary sticky">
        <div class="progress-header">
          <span class="progress-title">진행률</span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar-large">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <div class="progress-stats">
          <span class="stat pass">✅ {{ session.progress?.pass || 0 }}</span>
          <span class="stat fail">❌ {{ session.progress?.fail || 0 }}</span>
          <span class="stat partial">⚠️ {{ session.progress?.partial || 0 }}</span>
          <span class="stat skip">⏭️ {{ session.progress?.skip || 0 }}</span>
          <span class="stat total">{{ session.progress?.completed || 0 }}/{{ currentTotalCount }}</span>
        </div>
      </div>

      <!-- 테스트 섹션들 -->
      <div
        v-for="section in TEST_SCENARIOS"
        :key="section.section"
        class="section test-section"
      >
        <h2>{{ section.section }}</h2>
        
        <div
          v-for="subsection in section.subsections"
          :key="subsection.title"
          class="subsection"
        >
          <h3>{{ subsection.title }}</h3>
          
          <table class="test-table">
            <thead>
              <tr>
                <th class="col-id">번호</th>
                <th class="col-item">항목</th>
                <th class="col-method">테스트 방법</th>
                <th class="col-expected">예상 결과</th>
                <th class="col-result">결과</th>
                <th class="col-note">비고</th>
                <th class="col-tester">담당자</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in subsection.items"
                :key="item.id"
                :class="getResultClass(item.id)"
              >
                <td class="col-id">{{ item.id }}</td>
                <td class="col-item">{{ item.name }}</td>
                <td class="col-method">{{ item.method }}</td>
                <td class="col-expected">{{ item.expected }}</td>
                <td class="col-result">
                  <select
                    :value="getResult(item.id)"
                    class="result-select"
                    :class="getResultClass(item.id)"
                    @change="setResult(item.id, $event.target.value)"
                  >
                    <option value="">선택</option>
                    <option value="pass">✅ 통과</option>
                    <option value="fail">❌ 실패</option>
                    <option value="partial">⚠️ 부분통과</option>
                    <option value="skip">⏭️ 스킵</option>
                  </select>
                </td>
                <td class="col-note">
                  <input
                    :value="getNote(item.id)"
                    type="text"
                    placeholder="비고 입력..."
                    class="note-input"
                    @input="setNote(item.id, $event.target.value)"
                    @blur="saveNote(item.id)"
                  >
                </td>
                <td class="col-tester">
                  <select
                    :value="getTester(item.id)"
                    class="tester-select"
                    :disabled="testers.length === 0"
                    @change="setTester(item.id, $event.target.value)"
                  >
                    <option value="">-</option>
                    <option
                      v-for="tester in testers"
                      :key="tester"
                      :value="tester"
                    >
                      {{ tester }}
                    </option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 승인 섹션 -->
      <div class="section">
        <h2>✍️ 승인</h2>
        <table class="approval-table">
          <thead>
            <tr>
              <th>역할</th>
              <th>이름</th>
              <th>일자</th>
              <th class="col-action" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(approver, index) in approvers"
              :key="index"
            >
              <td>
                <select
                  v-model="approver.role"
                  class="approval-select"
                  @change="updateApprovers"
                >
                  <option value="">선택</option>
                  <option value="tester">테스터</option>
                  <option value="developer">개발자</option>
                  <option value="pm">PM</option>
                  <option value="qa">QA</option>
                  <option value="other">기타</option>
                </select>
              </td>
              <td>
                <input
                  v-model="approver.name"
                  type="text"
                  placeholder="이름"
                  class="approval-input"
                  @blur="updateApprovers"
                >
              </td>
              <td>
                <input
                  v-model="approver.date"
                  type="date"
                  class="approval-input"
                  @change="updateApprovers"
                >
              </td>
              <td class="col-action">
                <button
                  v-if="approvers.length > 1"
                  type="button"
                  class="remove-btn"
                  title="삭제"
                  @click="removeApprover(index)"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          class="add-approver-btn"
          @click="addApprover"
        >
          + 승인자 추가
        </button>
      </div>

      <!-- 참고사항 -->
      <div class="section">
        <h2>📌 참고사항</h2>
        <ol class="note-list">
          <li>테스트 전 캐시 및 쿠키를 삭제하고 시작하세요.</li>
          <li>각 테스트는 독립적으로 수행 가능해야 합니다.</li>
          <li>실패한 테스트는 즉시 이슈로 등록하세요.</li>
          <li>스크린샷이 필요한 경우 별도 폴더에 저장하세요.</li>
        </ol>
      </div>

      <!-- 하단 액션 -->
      <div class="page-actions">
        <v-btn
          variant="outlined"
          size="large"
          to="/test-scenario/sessions"
        >
          <v-icon left>
            mdi-arrow-left
          </v-icon>
          세션 목록
        </v-btn>
        <v-btn
          v-if="session.status !== 'completed'"
          color="success"
          variant="flat"
          size="large"
          :loading="completing"
          @click="handleComplete"
        >
          <v-icon left>
            mdi-check-circle
          </v-icon>
          테스트 완료
        </v-btn>
        <v-btn
          v-else
          color="warning"
          variant="flat"
          size="large"
          :loading="completing"
          @click="handleReopen"
        >
          <v-icon left>
            mdi-pencil
          </v-icon>
          다시 진행하기
        </v-btn>
      </div>

      <div class="page-footer">
        <p>🔒 이 페이지는 숨겨진 페이지입니다. URL 직접 입력으로만 접근 가능합니다.</p>
      </div>
    </template>

    <div
      v-else
      class="error-state"
    >
      <v-icon
        size="64"
        color="error"
      >
        mdi-alert-circle-outline
      </v-icon>
      <p>테스트 세션을 찾을 수 없습니다.</p>
      <v-btn
        to="/test-scenario/sessions"
        variant="outlined"
      >
        세션 목록으로 돌아가기
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { sanitizeInput } from '@/utils/sanitize.js'

definePageMeta({
  layout: 'page'
})

const route = useRoute()
const { confirm, alert } = useDialog()
const {
  TEST_SCENARIOS,
  getTotalTestCount,
  getSession,
  subscribeToSession,
  saveTestResult,
  updateSessionStatus,
  updateSessionInfo: updateInfo
} = useTestScenario()

const sessionId = route.params.id
const pageLoading = ref(true)
const session = ref(null)
const results = ref({})
const completing = ref(false)
const noteInputs = ref({})

const sessionInfo = reactive({
  testDate: ''
})

const testers = ref([])
const newTesterName = ref('')
const testerInputs = ref({})

const approvers = ref([
  { role: '', name: '', date: '' }
])

// 실시간 구독 해제 함수
let unsubscribe = null

useHead({
  title: computed(() => session.value ? `테스트 - CNX Library` : '테스트 - CNX Library')
})

onMounted(async () => {
  await loadSession()
  
  // 실시간 구독 시작 (여러 사용자 동시 테스트 지원)
  unsubscribe = await subscribeToSession(
    sessionId,
    // 세션 업데이트 콜백
    (sessionData) => {
      session.value = sessionData
    },
    // 결과 업데이트 콜백
    (resultsData) => {
      // 기존 결과와 다른 항목만 업데이트 (내가 수정 중인 항목 제외)
      Object.keys(resultsData).forEach(testId => {
        const newData = resultsData[testId]
        const oldData = results.value[testId]
        
        // 결과값 업데이트
        if (!results.value[testId]) {
          results.value[testId] = {}
        }
        results.value[testId].result = newData.result || ''
        
        // 비고 - 현재 입력 중이 아닌 경우만 업데이트
        if (noteInputs.value[testId] === undefined || noteInputs.value[testId] === (oldData?.note || '')) {
          noteInputs.value[testId] = newData.note || ''
          results.value[testId].note = newData.note || ''
        }
        
        // 담당자 - 현재 입력 중이 아닌 경우만 업데이트
        if (testerInputs.value[testId] === undefined || testerInputs.value[testId] === (oldData?.tester || '')) {
          testerInputs.value[testId] = newData.tester || ''
          results.value[testId].tester = newData.tester || ''
        }
      })
    }
  )
})

// 컴포넌트 언마운트 시 구독 해제
onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})

const loadSession = async () => {
  try {
    pageLoading.value = true
    const data = await getSession(sessionId)
    session.value = data.session
    results.value = data.results
    
    // 세션 정보 초기화
    const testDate = data.session.testDate?.toDate?.() || new Date(data.session.testDate)
    sessionInfo.testDate = testDate.toISOString().split('T')[0]
    
    // 담당자 배열 초기화
    if (Array.isArray(data.session.testers)) {
      testers.value = data.session.testers
    } else if (data.session.tester) {
      // 기존 단일 담당자 데이터 호환
      testers.value = [data.session.tester]
    }
    
    // 항목별 담당자 초기화
    Object.keys(data.results).forEach(testId => {
      if (data.results[testId].tester) {
        testerInputs.value[testId] = data.results[testId].tester
      }
    })
    
    // 승인자 정보 초기화
    if (data.session.approvers && data.session.approvers.length > 0) {
      approvers.value = data.session.approvers
    }
    
    // 비고 입력값 초기화
    Object.keys(data.results).forEach(testId => {
      noteInputs.value[testId] = data.results[testId].note || ''
    })
  } catch (err) {
    console.error('세션 로드 오류:', err)
    session.value = null
  } finally {
    pageLoading.value = false
  }
}

// 현재 테스트 시나리오 총 개수 (동적으로 계산)
const currentTotalCount = computed(() => getTotalTestCount())

const progressPercent = computed(() => {
  const total = currentTotalCount.value
  if (!total) return 0
  const completed = session.value?.progress?.completed || 0
  return Math.min(100, Math.round((completed / total) * 100))
})

const getResult = (testId) => {
  return results.value[testId]?.result || ''
}

const getNote = (testId) => {
  return noteInputs.value[testId] ?? results.value[testId]?.note ?? ''
}

const getResultClass = (testId) => {
  const result = getResult(testId)
  return result ? `result-${result}` : ''
}

const setResult = async (testId, result) => {
  try {
    await saveTestResult(sessionId, testId, {
      result: result || '',
      note: getNote(testId),
      tester: getTester(testId)
    })
    
    if (!results.value[testId]) {
      results.value[testId] = {}
    }
    results.value[testId].result = result || ''
    
    // 실시간 구독으로 진행률 자동 업데이트됨
  } catch (err) {
    console.error('결과 저장 오류:', err)
    await alert('결과 저장에 실패했습니다.', { type: 'error' })
  }
}

const setNote = (testId, note) => {
  noteInputs.value[testId] = note
}

const saveNote = async (testId) => {
  try {
    // XSS 방지를 위한 입력값 sanitize
    const note = sanitizeInput(noteInputs.value[testId] || '')
    const currentNote = results.value[testId]?.note || ''
    
    if (note !== currentNote) {
      await saveTestResult(sessionId, testId, {
        result: getResult(testId),
        note,
        tester: getTester(testId)
      })
      
      if (!results.value[testId]) {
        results.value[testId] = {}
      }
      results.value[testId].note = note
    }
  } catch (err) {
    console.error('비고 저장 오류:', err)
  }
}

// 담당자 관련 함수들
const getTester = (testId) => {
  return testerInputs.value[testId] ?? results.value[testId]?.tester ?? ''
}

const setTester = async (testId, tester) => {
  try {
    testerInputs.value[testId] = tester
    
    await saveTestResult(sessionId, testId, {
      result: getResult(testId),
      note: getNote(testId),
      tester: tester || ''
    })
    
    if (!results.value[testId]) {
      results.value[testId] = {}
    }
    results.value[testId].tester = tester || ''
  } catch (err) {
    console.error('담당자 저장 오류:', err)
  }
}

const addTester = () => {
  // XSS 방지를 위한 입력값 sanitize
  const name = sanitizeInput(newTesterName.value.trim())
  if (name && !testers.value.includes(name)) {
    testers.value.push(name)
    newTesterName.value = ''
    updateSessionInfo()
  }
}

const removeTester = (index) => {
  testers.value.splice(index, 1)
  updateSessionInfo()
}

const updateSessionInfo = async () => {
  try {
    await updateInfo(sessionId, {
      testDate: new Date(sessionInfo.testDate),
      testers: testers.value,
      approvers: approvers.value
    })
    
    // 로컬 세션 정보 업데이트
    if (session.value) {
      session.value.testDate = new Date(sessionInfo.testDate)
      session.value.testers = testers.value
      session.value.approvers = approvers.value
    }
  } catch (err) {
    console.error('세션 정보 업데이트 오류:', err)
  }
}

const addApprover = () => {
  approvers.value.push({ role: '', name: '', date: '' })
}

const removeApprover = (index) => {
  approvers.value.splice(index, 1)
  updateApprovers()
}

const updateApprovers = () => {
  updateSessionInfo()
}

const handleComplete = async () => {
  const confirmed = await confirm(
    '테스트를 완료 처리하시겠습니까?\n\n완료 후에도 결과를 수정할 수 있습니다.',
    { type: 'confirm' }
  )
  
  if (!confirmed) return
  
  try {
    completing.value = true
    await updateSessionStatus(sessionId, 'completed')
    session.value.status = 'completed'
    await alert('테스트가 완료되었습니다!', { type: 'success' })
  } catch (err) {
    console.error('완료 처리 오류:', err)
    await alert('완료 처리에 실패했습니다.', { type: 'error' })
  } finally {
    completing.value = false
  }
}

const handleReopen = async () => {
  const confirmed = await confirm('테스트를 다시 진행 상태로 변경하시겠습니까?')
  
  if (!confirmed) return
  
  try {
    completing.value = true
    await updateSessionStatus(sessionId, 'in_progress')
    session.value.status = 'in_progress'
  } catch (err) {
    console.error('상태 변경 오류:', err)
    await alert('상태 변경에 실패했습니다.', { type: 'error' })
  } finally {
    completing.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/functions' as *;

.test-scenario-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: rem(20);
  background-color: #fff;
}

.page-header {
  text-align: center;
  margin-bottom: rem(40);
  padding-bottom: rem(20);
  border-bottom: 2px solid #002C5B;
  
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

.section {
  margin-bottom: rem(40);
  
  h2 {
    font-size: rem(20);
    font-weight: 700;
    color: #002C5B;
    margin: 0 0 rem(16) 0;
    padding-bottom: rem(8);
    border-bottom: 2px solid #002C5B;
  }
  
  h3 {
    font-size: rem(16);
    font-weight: 600;
    color: #444;
    margin: rem(20) 0 rem(12) 0;
  }
  
  p {
    color: #555;
    line-height: 1.6;
    margin: 0 0 rem(16) 0;
  }
}

.info-table {
  width: 100%;
  max-width: rem(700);
  border-collapse: collapse;
  margin-bottom: rem(16);
  
  th, td {
    padding: rem(10) rem(12);
    border: 1px solid #ddd;
    text-align: left;
    vertical-align: top;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
    width: rem(140);
    color: #333;
  }
  
  td {
    background: #fff;
  }
}

.inline-input,
.inline-select {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: rem(6) rem(10);
  font-size: rem(14);
  width: 100%;
  max-width: rem(250);
  
  &:focus {
    outline: none;
    border-color: #002C5B;
    box-shadow: 0 0 0 2px rgba(0, 44, 91, 0.1);
  }
}

.legend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    padding: rem(4) 0;
    color: #555;
  }
}

// 진행률 요약 (고정)
.progress-summary {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: rem(16) rem(20);
  border-radius: 12px;
  margin-bottom: rem(32);
  
  &.sticky {
    position: sticky;
    top: rem(60);
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: rem(8);
    
    .progress-title {
      font-weight: 600;
      color: #333;
    }
    
    .progress-percent {
      font-size: rem(18);
      font-weight: 700;
      color: #002C5B;
    }
  }
  
  .progress-bar-large {
    height: rem(10);
    background: #e0e0e0;
    border-radius: rem(5);
    overflow: hidden;
    margin-bottom: rem(12);
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      border-radius: rem(5);
      transition: width 0.3s ease;
    }
  }
  
  .progress-stats {
    display: flex;
    flex-wrap: wrap;
    gap: rem(16);
    font-size: rem(13);
    
    .stat {
      &.pass { color: #4caf50; }
      &.fail { color: #f44336; }
      &.partial { color: #ff9800; }
      &.skip { color: #9e9e9e; }
      &.total { 
        color: #333;
        font-weight: 600;
        margin-left: auto;
      }
    }
  }
}

// 테스트 섹션
.test-section {
  .subsection {
    margin-bottom: rem(24);
    
    h3 {
      padding-left: rem(12);
      border-left: 3px solid #6366f1;
    }
  }
}

// 테스트 테이블
.test-table {
  width: 100%;
  border-collapse: collapse;
  font-size: rem(13);
  margin-bottom: rem(16);
  
  th, td {
    padding: rem(10) rem(8);
    border: 1px solid #ddd;
    text-align: left;
    vertical-align: middle;
  }
  
  thead {
    th {
      background: #002C5B;
      color: #fff;
      font-weight: 600;
      white-space: nowrap;
    }
  }
  
  tbody {
    tr {
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #f8f9fa;
      }
      
      &.result-pass {
        background-color: #f0fdf4;
      }
      
      &.result-fail {
        background-color: #fef2f2;
      }
      
      &.result-partial {
        background-color: #fffbeb;
      }
      
      &.result-skip {
        background-color: #f5f5f5;
      }
    }
    
    td {
      background: inherit;
    }
  }
  
  .col-id {
    width: rem(60);
    text-align: center;
    font-weight: 600;
    color: #002C5B;
  }
  
  .col-item {
    width: rem(150);
    font-weight: 500;
  }
  
  .col-method,
  .col-expected {
    min-width: rem(150);
  }
  
  .col-result {
    width: rem(130);
    text-align: center;
  }
  
  .col-note {
    width: rem(150);
  }
  
  .col-tester {
    width: rem(100);
  }
}

// 담당자 입력 영역
.tester-input-row {
  display: flex;
  gap: rem(8);
  align-items: center;
  margin-bottom: rem(8);
  
  .tester-input {
    flex: 1;
  }
}

.add-tester-btn {
  padding: rem(6) rem(12);
  background: #002C5B;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: rem(13);
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: #003d7a;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.testers-list {
  display: flex;
  flex-wrap: wrap;
  gap: rem(6);
}

.tester-tag {
  display: inline-flex;
  align-items: center;
  gap: rem(4);
  padding: rem(4) rem(8);
  background: #e8f0fe;
  color: #002C5B;
  border-radius: rem(12);
  font-size: rem(13);
  
  .remove-tester-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: rem(16);
    height: rem(16);
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: #666;
    font-size: rem(14);
    line-height: 1;
    cursor: pointer;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #333;
    }
  }
}

// 담당자 셀렉트박스
.tester-select {
  width: 100%;
  padding: rem(6) rem(8);
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: rem(13);
  cursor: pointer;
  background: #fff;
  
  &:focus {
    outline: none;
    border-color: #002C5B;
  }
  
  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    color: #999;
  }
}

// 결과 셀렉트박스
.result-select {
  width: 100%;
  padding: rem(6) rem(8);
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: rem(13);
  cursor: pointer;
  background: #fff;
  
  &:focus {
    outline: none;
    border-color: #002C5B;
  }
  
  &.result-pass {
    background-color: #f0fdf4;
    border-color: #86efac;
  }
  
  &.result-fail {
    background-color: #fef2f2;
    border-color: #fca5a5;
  }
  
  &.result-partial {
    background-color: #fffbeb;
    border-color: #fcd34d;
  }
  
  &.result-skip {
    background-color: #f5f5f5;
    border-color: #d4d4d4;
  }
}

.note-input {
  width: 100%;
  padding: rem(6) rem(8);
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: rem(12);
  
  &:focus {
    outline: none;
    border-color: #002C5B;
  }
  
  &::placeholder {
    color: #bbb;
  }
}

// 승인 테이블
.approval-table {
  width: 100%;
  max-width: rem(600);
  border-collapse: collapse;
  margin-bottom: rem(12);
  
  th, td {
    padding: rem(10);
    border: 1px solid #ddd;
    text-align: left;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
    font-size: rem(13);
  }
  
  .col-action {
    width: rem(40);
    text-align: center;
  }
  
  .approval-select,
  .approval-input {
    width: 100%;
    padding: rem(6) rem(8);
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: rem(13);
    
    &:focus {
      outline: none;
      border-color: #002C5B;
    }
  }
  
  .remove-btn {
    width: rem(24);
    height: rem(24);
    padding: 0;
    border: none;
    border-radius: 4px;
    background: #fee2e2;
    color: #dc2626;
    cursor: pointer;
    font-size: rem(12);
    
    &:hover {
      background: #fecaca;
    }
  }
}

.add-approver-btn {
  padding: rem(8) rem(16);
  border: 1px dashed #93c5fd;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: rem(13);
  cursor: pointer;
  
  &:hover {
    background: #dbeafe;
    border-color: #60a5fa;
  }
}

.note-list {
  color: #555;
  line-height: 1.8;
  padding-left: rem(20);
  
  li {
    margin-bottom: rem(4);
  }
}

.page-actions {
  display: flex;
  justify-content: center;
  gap: rem(16);
  padding: rem(24) 0;
  margin-top: rem(20);
  border-top: 2px solid #e0e0e0;
}

.page-footer {
  margin-top: rem(40);
  padding-top: rem(20);
  border-top: 2px dashed #ccc;
  text-align: center;
  
  p {
    font-size: rem(13);
    color: #888;
    margin: 0;
  }
}

.error-state {
  text-align: center;
  padding: rem(48) rem(20);
  
  p {
    margin: rem(16) 0;
    color: #666;
  }
}

// 반응형
@media (max-width: 768px) {
  .test-scenario-page {
    padding: rem(15);
  }
  
  .page-header h1 {
    font-size: rem(22);
  }
  
  .progress-summary {
    &.sticky {
      position: relative;
      top: 0;
    }
  }
  
  .test-table {
    display: block;
    overflow-x: auto;
    
    .col-method,
    .col-expected {
      min-width: rem(120);
    }
  }
  
  .info-table {
    th {
      width: rem(100);
    }
  }
}
</style>
