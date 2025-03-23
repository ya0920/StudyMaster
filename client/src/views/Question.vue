<template>
  <div class="wrong-question-container">
    <h2>{{ task.subject }} - {{ task.detail }}</h2>
    <p>复习内容展示区域，可在此添加具体错题和复习材料</p>
    <button @click="completeReview">完成复习</button>
  </div>
</template>

<script setup>
import { ref, defineProps, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  updateTasks: {
    type: Function,
    required: true
  }
});

const router = useRouter();

const completeReview = () => {
  // 更新任务状态为已完成
  props.updateTasks(props.task, true);
  // 跳转回复习计划页面
  router.push('/review-plan');
};

watch(() => props.task, (newTask) => {
  // 可以在这里添加当任务变化时的其他逻辑，比如重新加载相关错题数据
}, { deep: true });
</script>

<style lang="less" scoped>
.wrong-question-container {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>