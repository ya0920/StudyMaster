<template>
    <el-calendar v-model:value="currentDate">
        <template #date-cell="{ data }">
            <div class="date-cell" @click="handleDateClick(data.day)">
                <span>{{ formatDate(data.day) }}</span>
                <span v-if="isPlanCompleted(data.day)" class="completed-mark">✔</span>
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
import { ref, defineEmits } from 'vue';
import { ElCalendar } from 'element-plus';

const props = defineProps({
  completedDates: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['date-click']);

const currentDate = ref(new Date());

const formatDateToYYYYMMDD = (date) => {
  if (typeof date === 'string') {
    return date.split('T')[0];
  } else if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  } else {
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '';
    }
  }
};

const isPlanCompleted = (date) => {
  const formattedDate = formatDateToYYYYMMDD(date);
  return props.completedDates.includes(formattedDate);
};

const handleDateClick = (date) => {
    emit('date-click', date)
}

const formatDate = (date, isHeader = false) => {
  let dateStr = date;
  if (date instanceof Date) {
    dateStr = date.toISOString().split('T')[0];
  }
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    console.warn('日期格式不正确:', date);
    return '';
  }
  
  if (isHeader) {
    return `${parts[0]}年${parts[1]}月`;
  }
  return parts[2];
};

const prevMonthText = '上一个月';
const nextMonthText = '下一个月';

const prevMonth = (picker) => {
    picker.prevMonth();
};

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
}

.calendar-header {
    justify-content: space-around;
    align-items: center;
    padding: 0;
}
</style>