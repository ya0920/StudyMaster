<template>
    <div class="progress-demo">
      <!-- 圆形进度条，添加 :key 强制重渲染 -->
      <van-circle
        :key="circleKey"
        v-model:current="animatedPercent"
        :rate="100"
        :speed="30"
        :color="circleColor"
        layer-color="#ebedf0"
        :text="masteryPercent + '%'"
        size="85"
        :stroke-width="10"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, nextTick } from 'vue';
  
  const masteryPercent = ref(75);      // 目标百分比（可以从 API 获取）
  const animatedPercent = ref(0);        // 动画初始值设为0
  const circleKey = ref(0);              // 动态 key，用于强制重渲染
  
  // 根据目标百分比动态计算圆环颜色
  const circleColor = computed(() => {
    if (masteryPercent.value < 60) return '#ff4d4f';  // 红色
    if (masteryPercent.value < 80) return '#faad14';  // 黄色
    return '#52c41a';                                // 绿色
  });
  
  onMounted(() => {
    // 模拟延迟获取目标值
    setTimeout(() => {
      // 这里可以从 API 获取最新的 masteryPercent
      masteryPercent.value = 75; 
      // 下一帧更新动画值，并强制重渲染组件触发动画
      nextTick(() => {
        animatedPercent.value = masteryPercent.value;
        circleKey.value++;  // key变化强制重渲染
      });
    }, 100);
  });
  </script>
  
  <style scoped>
  .progress-demo {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }
  </style>
  