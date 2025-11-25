<template>
  <v-container>
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
      >
        <v-card>
          <v-card-title class="text-h4 pa-6">
            CNX Library
          </v-card-title>
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4">
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
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const { user, logout, loading } = useAuth()

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

