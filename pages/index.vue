<template>
  <v-app>
    <PageLayout
      header-type="home"
      :show-header-text="true"
      :header-text="headerText"
      :show-header-actions="true"
      @toggle-drawer="drawer = !drawer"
    >
      <div>
        <h1 class="page-title mb-4">
          CNX Library
        </h1>
        <p class="page-subtitle mb-4">
          환영합니다! {{ user?.email }}
        </p>
        <v-btn 
          color="primary" 
          variant="elevated"
          :loading="loading"
          @click="handleLogout"
        >
          로그아웃
        </v-btn>
      </div>
    </PageLayout>

    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      :width="drawerWidth"
      class="side-navigation"
    >
      <div class="drawer-content">
        <SideNavigation />
      </div>
    </v-navigation-drawer>
  </v-app>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: 'auth'
})

const drawer = useState('navigationDrawer', () => false)
const { user, logout, loading } = useAuth()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

// 반응형 drawer 너비 계산
const drawerWidth = ref(280)

onMounted(() => {
  const updateWidth = () => {
    drawerWidth.value = window.innerWidth >= 769 ? 360 : 280
  }
  
  updateWidth()
  window.addEventListener('resize', updateWidth)
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWidth)
  })
})

const userData = ref(null)
const headerText = computed(() => {
  if (!userData.value) {
    return ''
  }
  const center = userData.value.center || ''
  const name = userData.value.name || ''
  return `안녕하세요,<br>${center} ${name} 님`
})

// Firestore에서 사용자 정보 가져오기
onMounted(async () => {
  if (!process.client || !user.value || !firestore) {
    return
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      userData.value = userDoc.data()
    }
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error)
  }
})

const handleLogout = async () => {
  await logout()
}

// 페이지 메타데이터
useHead({
  title: '홈 - CNX Library',
  meta: [
    { name: 'description', content: 'CNX Library 관리 시스템' }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.page-title {
  font-size: rem(32);
  font-weight: 700;
  color: #002C5B;
  line-height: 1.2;
  margin: 0;
}

.page-subtitle {
  font-size: rem(16);
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

.side-navigation {
  z-index: 1000;
}

.side-navigation :deep(.v-navigation-drawer__content) {
  background-color: #002C5B;
}

.side-navigation :deep(.v-navigation-drawer) {
  border: none;
}

.side-navigation :deep(.v-navigation-drawer__border) {
  display: none;
}

.drawer-content {
  padding: rem(16);
  color: #FFFFFF;
}

/* 768px 이하: 전체 화면 기준 우측에 붙어서 */
@media (max-width: 768px) {
  .side-navigation :deep(.v-navigation-drawer) {
    width: rem(280);
  }
}

/* 769px 이상: 768px 이너 안쪽으로 들어오도록 */
@media (min-width: 769px) {
  .side-navigation :deep(.v-navigation-drawer) {
    width: rem(360);
    left: auto;
    right: calc((100vw - #{rem(768)}) / 2);
    max-width: rem(768);
  }
  
  /* 오버레이가 768px 컨테이너 영역만 덮도록 */
  .side-navigation :deep(.v-overlay__scrim) {
    display: none;
  }
}
</style>

