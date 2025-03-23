<template>
  <div>
    <router-view></router-view>
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const showTabBar = computed(() => route.meta.showTabBar ?? true)

</script>

<style lang="less" scoped></style>