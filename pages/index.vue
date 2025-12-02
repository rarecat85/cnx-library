<template>
  <PageLayout
    header-type="home"
    :show-header-text="true"
    :header-text="headerText"
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
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: 'auth'
})

const { user, logout, loading } = useAuth()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

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
</style>

