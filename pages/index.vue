<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h4 pa-6">
            Nuxt 3 + Vuetify 3 + TypeScript
          </v-card-title>
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4">
              프로젝트가 성공적으로 설정되었습니다!
            </p>
            <v-btn color="primary" variant="elevated">
              시작하기
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// 페이지 메타데이터
useHead({
  title: '홈',
  meta: [
    { name: 'description', content: 'Nuxt 3 + Vuetify 3 프로젝트' }
  ]
})
</script>

