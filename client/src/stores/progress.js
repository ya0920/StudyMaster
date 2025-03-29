// stores/progress.js
import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  // 数据加载方法（带验证）
  const loadValidatedTasks = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('daily_tasks')) || {}
      return Object.entries(saved).reduce((acc, [date, tasks]) => {
        acc[date] = Array.isArray(tasks) ? tasks : []
        return acc
      }, {})
    } catch (error) {
      console.error('数据加载失败，初始化空数据', error)
      return {}
    }
  }

  // 状态定义
  const dailyTasks = ref(loadValidatedTasks())
  const selectedDate = ref(
    localStorage.getItem('selected_date') || 
    new Date().toISOString().split('T')[0]
  )

  // 强制初始化当前日期数据
  if (!dailyTasks.value[selectedDate.value]) {
    dailyTasks.value[selectedDate.value] = []
  }

  // 数据持久化方法
  const persistTasks = () => {
    const validated = Object.entries(dailyTasks.value).reduce((acc, [date, tasks]) => {
      acc[date] = Array.isArray(tasks) ? tasks : []
      return acc
    }, {})
    localStorage.setItem('daily_tasks', JSON.stringify(validated))
    localStorage.setItem('selected_date', selectedDate.value)
  }

  // 自动保存（可选）
  watch([dailyTasks, selectedDate], () => {
    persistTasks()
  }, { deep: true })

  // 复习任务数据 - 按日期存储
  const reviewTasksByDate = ref({})
  
  // 计算复习进度百分比
  const reviewProgress = computed(() => {
    // 收集所有任务
    let totalTasks = 0;
    let completedTasks = 0;
    
    Object.values(reviewTasksByDate.value).forEach(tasks => {
      if (Array.isArray(tasks)) {
        totalTasks += tasks.length;
        completedTasks += tasks.filter(task => task.completed).length;
      }
    });
    
    console.log(`计算进度: ${completedTasks}/${totalTasks}`);
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  })
  
  // 更新复习任务
  const updateReviewTasks = (date, tasks) => {
    reviewTasksByDate.value[date] = [...tasks];
  }

  // 添加掌握度相关状态和方法
  const masteryRate = ref(0);

  const updateMasteryRate = (rate) => {
    masteryRate.value = rate;
  };

  return {
    dailyTasks,
    selectedDate,
    persistTasks,
    
    // 新增工具方法
    getTasksByDate: (date) => {
      return Array.isArray(dailyTasks.value[date]) ? 
        dailyTasks.value[date] : 
        []
    },
    
    safeUpdateDate: (date) => {
      if (!dailyTasks.value[date]) {
        dailyTasks.value[date] = []
      }
    },
    reviewTasksByDate,
    reviewProgress,
    updateReviewTasks,
    masteryRate,
    updateMasteryRate
  }
}, {
  persist: true // 持久化存储
})