<template>
    <el-calendar v-model:value="currentDate">
        <template #date-cell="{ data }">
            <div class="date-cell" @click="handleDateClick(data.day)">
                <span>{{ formatDate(data.day) }}</span>
                <span v-if="isPlanCompleted(data.day)" class="completed-mark">✔</span>
                <span v-if="isTherePlan(data.day) && !isPlanCompleted(data.day)" class="plan-mark">.</span>
            </div>
        </template>
        <template #header="{ picker }">
            <div class="calendar-header">
                <span v-if="picker" @click="prevMonth(picker)">{{ prevMonthText }}</span>
                <span v-if="picker">{{ formatDate(picker.getDate(), true) }}</span>
                <span v-if="picker" @click="nextMonth(picker)">{{ nextMonthText }}</span>
            </div>
        </template>
    </el-calendar>
</template>

<script setup>
import { ref } from 'vue';
import { ElCalendar } from 'element-plus';

import { defineEmits } from 'vue'

// 添加props接收完成日期
const props = defineProps({
  completedDates: {
    type: Array,
    default: () => []
  }
})

// 修改判断方法
const isPlanCompleted = (date) => {
  const formattedDate = formatDate(date)
  return props.completedDates.includes(formattedDate)
}

const emit = defineEmits(['date-click']) // 声明自定义事件

// 处理日期点击
const handleDateClick = (date) => {
    emit('date-click', date) // 触发事件传递日期
}

const currentDate = ref(new Date());

// 格式化日期
const formatDate = (date, isHeader = false) => {
    const parts = date.split('-');
    if (isHeader) {
        return `${parts[0]} ${parts[1]}`;
    }
    return parts[2];
};



// 判断当天是否有计划（暂时为空方法）
const isTherePlan = (date) => {
    // 后续补充根据实际数据判断当天是否有计划的逻辑
    return false;
};

// 上一个月文本
const prevMonthText = '上一个月';
// 下一个月文本
const nextMonthText = '下一个月';

// 切换到上一个月
const prevMonth = (picker) => {
    picker.prevMonth();
};

// 切换到下一个月
const nextMonth = (picker) => {
    picker.nextMonth();
};
</script>

<style scoped>
:deep(.el-calendar-table) {
    --el-calendar-cell-width: auto !important;
}

:deep(.el-calendar-table .el-calendar-day) {
    @media (max-width: 768px) {
        min-height: 50px;
        padding: 4px;
    }

    @media (min-width: 1200px) {
        min-height: 80px;
    }
}

:deep(.el-calendar-day) {
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
        background: #f5f7fa;
    }

    &.selected {
        background-color: #e8f4ff;
        border: 2px solid #2196F3;
    }
}
:deep(.el-calendar__header ){
    padding: 16px 0 0 0;
}
:deep(.el-calendar__body) {
    padding: 12px 20px;
}
.date-cell {
    position: relative;
    text-align: center;
    line-height: 40px;
}

.completed-mark {
    position: absolute;
    top: 2px;
    right: 2px;
    color: blue;
    /* 完成计划的标记颜色改为蓝色 */
}

.plan-mark {
    position: absolute;
    top: 2px;
    right: 2px;
    color: gray;
    /* 有计划但未完成的标记颜色改为灰色 */
}

.calendar-header {
    /* display: flex; */
    justify-content: space-around;
    align-items: center;
    padding: 0;
}
</style>