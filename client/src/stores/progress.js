// stores/progress.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

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
    }
  }
})