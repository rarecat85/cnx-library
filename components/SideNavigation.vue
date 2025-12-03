<template>
  <div class="side-navigation-menu">
    <div class="menu-header">
      <ConcentrixLogo />
    </div>

    <nav class="menu-list">
      <!-- 일반 사용자 메뉴 -->
      <div class="menu-section">
        <NuxtLink
          to="/"
          class="menu-item"
          @click="closeDrawer"
        >
          <v-icon>mdi-home</v-icon>
          <span>홈</span>
        </NuxtLink>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-magnify</v-icon>
          <span>도서 검색</span>
        </div>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-book-open-variant</v-icon>
          <span>도서 목록</span>
        </div>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-book-account</v-icon>
          <span>대여 관리</span>
        </div>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-cart-plus</v-icon>
          <span>구매요청</span>
        </div>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-account</v-icon>
          <span>마이페이지</span>
        </div>
      </div>

      <!-- 관리자 메뉴 (관리자 권한이 있는 경우에만 표시) -->
      <div
        v-if="isAdmin"
        class="menu-section admin-section"
      >
        <div class="menu-section-title">
          관리자
        </div>

        <NuxtLink
          to="/admin/books"
          class="menu-item"
          @click="closeDrawer"
        >
          <v-icon>mdi-book-edit</v-icon>
          <span>도서 관리</span>
        </NuxtLink>

        <NuxtLink
          to="/admin/books/register"
          class="menu-item"
          @click="closeDrawer"
        >
          <v-icon>mdi-book-plus</v-icon>
          <span>도서 등록</span>
        </NuxtLink>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-book-check</v-icon>
          <span>대여 관리</span>
        </div>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-cart-check</v-icon>
          <span>구매요청 관리</span>
        </div>

        <div class="menu-item menu-item-disabled">
          <v-icon>mdi-chart-bar</v-icon>
          <span>통계</span>
        </div>
      </div>

      <!-- 공통 메뉴 -->
      <div class="menu-section">
        <div
          class="menu-item logout-item"
          @click="handleLogout"
        >
          <v-icon>mdi-logout</v-icon>
          <span>로그아웃</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
const drawer = useState('navigationDrawer', () => false)
const { logout, user } = useAuth()
const { $firebaseFirestore } = useNuxtApp()
const firestore = $firebaseFirestore

const isAdmin = ref(false)

// 사용자 권한 확인
const checkUserRole = async () => {
  if (!process.client || !user.value || !firestore) {
    isAdmin.value = false
    return
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const userRef = doc(firestore, 'users', user.value.uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      // role이 'admin'이거나 'manager'인 경우 관리자로 판단
      isAdmin.value = userData.role === 'admin' || userData.role === 'manager'
    } else {
      isAdmin.value = false
    }
  } catch (error) {
    console.error('사용자 권한 확인 실패:', error)
    isAdmin.value = false
  }
}

// 사용자 정보가 변경될 때마다 권한 확인
watch(() => user.value, async (newUser) => {
  if (newUser) {
    await checkUserRole()
  } else {
    isAdmin.value = false
  }
}, { immediate: true })

const closeDrawer = () => {
  drawer.value = false
}

const handleLogout = async () => {
  await logout()
  closeDrawer()
}
</script>

<style lang="scss" scoped>
@use '@/assets/scss/functions' as *;

.side-navigation-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.menu-header {
  padding: rem(20) rem(16);
  border-bottom: rem(1) solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-header :deep(.logo-svg) {
  height: rem(24);
  width: auto;
  color: #FFFFFF;
}

.menu-list {
  flex: 1;
  overflow-y: auto;
  padding: rem(8) 0;
}

.menu-section {
  padding: rem(8) 0;
}

.menu-section-title {
  padding: rem(12) rem(16) rem(8);
  font-size: rem(12);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: rem(0.5);
}

.admin-section {
  border-top: rem(1) solid rgba(255, 255, 255, 0.1);
  margin-top: rem(8);
  padding-top: rem(16);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: rem(12);
  padding: rem(12) rem(16);
  color: #FFFFFF;
  text-decoration: none;
  font-size: rem(15);
  transition: background-color 0.2s;
  cursor: pointer;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.router-link-active {
  background-color: rgba(255, 255, 255, 0.15);
  font-weight: 500;
}

.menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.menu-item .v-icon {
  font-size: rem(20);
  color: #FFFFFF;
}

.logout-item {
  border-top: rem(1) solid rgba(255, 255, 255, 0.1);
  margin-top: rem(8);
  padding-top: rem(12);
}

.logout-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>

