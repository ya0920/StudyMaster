<template>
  <div class="plan-container">
    <header class="page-header">
      <p class="title">复习日历</p>
    </header>
    <Calendar :plans="reviewPlans" :completed-dates="completedDates" @date-click="handleDateClick" />
    <div class="review-tasks">
      <p class="task">任务</p>
      <TaskTable :tasks="filteredTasks" @select="handleTaskSelect" @click="handleTaskClick" />
    </div>
    <div class="progress-info">
      <p>已完成 {{ completedTaskCount }} / {{ totalTaskCount }} 任务</p>
      <el-progress :percentage="completedRate" />
    </div>
  </div>
</template>

<!-- Plan.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import Calendar from '@/components/Calendar.vue'
import TaskTable from '@/components/TaskTable.vue'

const router = useRouter()
const progressStore = useProgressStore()

// 默认显示当日任务
const selectedDate = ref(new Date().toISOString().split('T')[0])
const completedDates = ref([])

// 初始化三月数据
const initMarchTasks = () => {
  const start = new Date('2024-03-01')
  const end = new Date('2024-03-31')

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    if (!progressStore.dailyTasks[dateStr]) {
      progressStore.dailyTasks[dateStr] = []
    }
  }
  progressStore.persistTasks()
}

// 获取当前显示的任务
const filteredTasks = computed(() => {
  return progressStore.dailyTasks[selectedDate.value] || []
})

// 进度计算
const completedTaskCount = computed(() =>
  filteredTasks.value.filter(task => task.completed).length
)

const totalTaskCount = computed(() => filteredTasks.value.length)

const completedRate = computed(() =>
  totalTaskCount.value ? Math.round((completedTaskCount.value / totalTaskCount.value) * 100) : 0
)

// 处理日期选择
const handleDateClick = (date) => {
  selectedDate.value = date
  loadYesterdayTasks(date)
}

// 加载前一天未完成任务
const loadYesterdayTasks = (currentDate) => {
  const date = new Date(currentDate)
  date.setDate(date.getDate() - 1)
  const yesterday = date.toISOString().split('T')[0]

  const unfinished = progressStore.dailyTasks[yesterday]?.filter(t => !t.completed) || []
  progressStore.dailyTasks[currentDate] = [
    ...progressStore.dailyTasks[currentDate],
    ...unfinished.map(t => ({
      ...t,
      id: Date.now() + Math.random(),
      date: currentDate
    }))
  ]
}

// 处理任务勾选
// 修改任务勾选处理逻辑
const handleTaskSelect = (selectedIds) => {
  progressStore.dailyTasks[selectedDate.value] =
    progressStore.dailyTasks[selectedDate.value].map(task => ({
      ...task,
      completed: selectedIds.includes(task.id)
    }))

  // ✅ 正确调用持久化方法
  progressStore.persistTasks()
}

// 初始化
onMounted(() => {
  initMarchTasks()
  loadYesterdayTasks(selectedDate.value)
})

watch(selectedDate, (newVal) => {
  progressStore.selectedDate = newVal
})
</script>


<style lang="less" scoped>
.plan-container {
  padding-bottom: 60px;
  background-color: white; // 设置页面背景色为白色
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0 0;

  .title {
    font-weight: 600;
    font-size: 18px;

    margin: 12px 0 12px 30px;
    text-align: left;
  }
}

.view-mode {
  display: flex;
}

.review-tasks {
  padding: 16px;

  .task {
    text-align: left;
    font-size: 16px;
    font-weight: 500;
    margin-left: 14px;
    margin-bottom: 16px;
  }
}

.progress-info {
  padding: 16px;
  margin-bottom: 12px;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: white;
  padding: 12px 0;
  position: fixed;
  bottom: 0;
  width: 100%;
}

.router-link {
  text-decoration: none;
  color: #666;
}
</style>