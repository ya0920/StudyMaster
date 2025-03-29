<template>
  <!-- 添加提示，如果是过去日期 -->
  <div v-if="isPastDate" class="past-date-notice">
    历史任务仅可查看，不可修改状态
  </div>
  
  <div class="task-table">
    <el-table
      :data="tasksCopy" 
      :show-header="false"
      row-key="id"
      style="width: 100%"
    >
      <!-- 复选框列 -->
      <el-table-column width="55">
        <template #default="{ row }">
          <el-checkbox 
            v-model="row.completed"
            :disabled="isPastDate"
            @change="(val) => handleCheckboxChange(row.id, val)"
            class="task-checkbox"
          />
        </template>
      </el-table-column>
      
      <!-- 学科列 -->
      <el-table-column prop="subject">
        <template #default="{ row }">
          <div 
            class="clickable-cell" 
            @click="handleClick(row.id)"
            :class="{'past-cell': isPastDate}"
          >
            {{ row.subject }}
          </div>
        </template>
      </el-table-column>
      
      <!-- 知识点列 -->
      <el-table-column prop="knowledgePoint">
        <template #default="{ row }">
          <div 
            class="clickable-cell" 
            @click="handleClick(row.id)"
            :class="{'past-cell': isPastDate}"
          >
            {{ row.knowledgePoint }}
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  currentDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select', 'click'])

// 创建本地任务副本，确保独立性
const tasksCopy = ref([]);

// TaskTable.vue - 修改计算逻辑
watch(() => props.tasks, (newTasks) => {
  if (newTasks) {
    console.log('任务数据更新:', 
      newTasks.map(t => `${t.id}:${t.completed?'已完成':'未完成'}`).join(', '));
    tasksCopy.value = JSON.parse(JSON.stringify(newTasks));
  }
}, { deep: true, immediate: true });

// 计算属性：判断是否为过去日期
const isPastDate = computed(() => {
  if (!props.currentDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateToCheck = new Date(props.currentDate);
  return dateToCheck < today;
});

// 处理复选框状态变化
const handleCheckboxChange = (taskId, checked) => {
  console.log(`任务 ${taskId} 复选框状态变为: ${checked ? '选中' : '未选中'}`);
  
  // 不处理历史任务的变更
  if (isPastDate.value) return;
  
  // 发送到父组件 - 不需要重新收集，因为已经通过v-model更新了本地状态
  emit('select', taskId, checked);
};

const handleClick = (taskId) => {
  emit('click', taskId);
};
</script>

<style scoped>
.task-table {
  margin: 8px 0;
}

.past-date-notice {
  color: #ff9800;
  font-size: 12px;
  margin-bottom: 10px;
  padding: 5px;
  background-color: #fff8e1;
  border-radius: 4px;
}

.clickable-cell {
  cursor: pointer;
  padding: 6px 0;
}

.past-cell {
  color: #606266;
}

/* 确保高对比度选中状态 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}

/* 禁用状态下的选中复选框 - 灰色已勾选 */
:deep(.el-checkbox__input.is-disabled.is-checked .el-checkbox__inner) {
  background-color: #909399;
  border-color: #909399;
}

:deep(.el-checkbox__input.is-disabled.is-checked .el-checkbox__inner::after) {
  border-color: #fff;
}

/* 禁用状态下的未选中复选框 - 灰色空白 */
:deep(.el-checkbox__input.is-disabled .el-checkbox__inner) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
}

/* 简化表格样式 */
:deep(.el-table td) {
  padding: 8px 0;
}
</style>