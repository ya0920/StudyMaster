<template>
    <el-table
      ref="tableRef"
      :data="tasks"
      @selection-change="handleSelectionChange"
      :row-key="row => row.id"
      :header-cell-style="{ display: 'none' }"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" :reserve-selection="true" />
      <el-table-column prop="subject" label="学科">
        <template #default="{ row }">
          <div class="clickable-cell" @click="handleClick(row.id)">
            {{ row.subject }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="knowledgePoint" label="知识点">
        <template #default="{ row }">
          <div class="clickable-cell" @click="handleClick(row.id)">
            {{ row.knowledgePoint }}
          </div>
        </template>
      </el-table-column>
    </el-table>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, nextTick } from 'vue'
  import { useProgressStore } from '@/stores/progress'
  
  const props = defineProps({
    tasks: {
      type: Array,
      required: true
    }
  })
  
  const emit = defineEmits(['select', 'click'])
  const progressStore = useProgressStore()
  const tableRef = ref(null)
  
  // 初始化选中状态
  const initSelection = () => {
    nextTick(() => {
      const selectedRows = props.tasks.filter(t => t.completed)
      selectedRows.forEach(row => {
        tableRef.value?.toggleRowSelection(row, true)
      })
    })
  }
  
  // 监听任务数据变化
  watch(() => props.tasks, (newVal, oldVal) => {
    if (newVal !== oldVal) initSelection()
  }, { deep: true })
  
  onMounted(initSelection)
  
  const handleSelectionChange = (selection) => {
    const selectedIds = selection.map(item => item.id)
    emit('select', selectedIds)
    
    // 更新全局状态并持久化
    progressStore.tasks = props.tasks.map(task => ({
      ...task,
      completed: selectedIds.includes(task.id)
    }))
    progressStore.persistTasks()
  }
  
  const handleClick = (taskId) => {
    emit('click', taskId)
  }
  </script>
  
  <style scoped>
  .clickable-cell {
    cursor: pointer;
    padding: 12px 0;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
  
  :deep(.el-table__header-wrapper) {
    display: none;
  }
  
  :deep(.el-table) {
    --el-table-border-color: transparent;
  }
  
  :deep(.el-table td) {
    border-bottom: none !important;
  }
  
  :deep(.el-table::before) {
    height: 0 !important;
  }
  </style>