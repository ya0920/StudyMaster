<template>
  <div class="plan-container">
    <!-- 添加页面级加载状态 -->
    <div v-if="pageLoading" class="page-loading">
      <van-loading size="24px" type="spinner" vertical>初始化中...</van-loading>
    </div>
    
    <template v-else>
      <header class="page-header">
        <p class="title">复习日历</p>
      </header>
      
      <!-- 传递计划日期给日历组件 -->
      <Calendar 
        :completed-dates="completedDates" 
        @date-click="handleDateClick"
        v-longpress-prop:date-click="800" 
      />
      
      <!-- 任务列表部分 -->
      <div class="review-tasks">
        <p class="task">{{ formatDate(selectedDate) }} 复习任务</p>
        
        <!-- 加载中状态 -->
        <div v-if="loading" class="loading-state">
          <van-loading type="spinner" color="#1989fa" />
          <span>加载任务中...</span>
        </div>
        
        <!-- 任务列表 -->
        <template v-else>
          <TaskTable 
            v-if="tasks.length > 0" 
            :tasks="tasks" 
            :current-date="selectedDate"
            @select="handleTaskSelect" 
            @click="handleTaskClick(task.id)" 
            v-debounce-prop:click="300"
          />
          <div v-else class="empty-task">
            <van-empty description="当天没有复习任务" />
          </div>
        </template>
      </div>
      
      <!-- 进度信息 -->
      <div class="progress-info" v-if="tasks.length > 0">
        <p>已完成 {{ completedTaskCount }} / {{ totalTaskCount }} 任务</p>
        <el-progress :percentage="completedRate" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Calendar from '@/components/Calendar.vue'
import TaskTable from '@/components/TaskTable.vue'
import { getReviewTasks, completeReviewTask, getCompletedDates, uncompleteReviewTask } from '@/api/index.js';
import { showToast, Empty, Loading } from 'vant';
import { debounce } from 'lodash-es'; // 或使用自己的debounce实现
import { useProgressStore } from '@/stores/progress'

const router = useRouter()

const progressStore = useProgressStore()

// 获取本地时区的今天日期（YYYY-MM-DD格式）
const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 初始化选中的日期为今天（本地时区）
const selectedDate = ref(getLocalToday());

// 状态定义
const tasks = ref([])                                            // 当前日期的任务
const completedDates = ref([])                                   // 已完成任务的日期
const loading = ref(false)                                       // 加载状态
// 明确初始化为空对象
const dailyTasksCache = ref({})                                  // 缓存每日任务

// 计算属性：已完成任务数
const completedTaskCount = computed(() => 
  tasks.value.filter(task => task.completed).length
)

// 计算属性：总任务数
const totalTaskCount = computed(() => tasks.value.length)

// 计算属性：完成率
const completedRate = computed(() => 
  totalTaskCount.value ? Math.round((completedTaskCount.value / totalTaskCount.value) * 100) : 0
)

// 格式化日期显示
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

// 将此修改添加到 Plan.vue 中
const handleDateClick = (date) => {
  // 确保日期格式严格一致
  let formattedDate;
  try {
    if (typeof date === 'string') {
      // 如果是字符串，确保格式为YYYY-MM-DD
      formattedDate = date.split('T')[0];
    } else if (date instanceof Date) {
      // 如果是Date对象，转换为YYYY-MM-DD
      formattedDate = date.toISOString().split('T')[0];
    } else {
      // 其他情况(如Element Calendar传入的特殊对象)
      const d = new Date(date);
      formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('日期格式化错误:', error, date);
    formattedDate = getLocalToday(); // 出错时使用今天日期
  }
  
  console.log('选择日期:', date, '格式化后:', formattedDate);
  selectedDate.value = formattedDate;
  
  // 从服务器获取任务数据
  fetchReviewTasks(formattedDate);
}

// 添加请求状态跟踪
const pendingRequests = ref(new Set());

const fetchReviewTasks = async (date = selectedDate.value, updateUI = true, silent = false, forceRefresh = false) => {
  // 标准化日期格式
  const formattedDate = formatDateToYYYYMMDD(date);
  console.log(`加载日期 ${formattedDate} 的任务`);
  
  // 使用格式化后的日期检查缓存
  if (dailyTasksCache.value[formattedDate] && !forceRefresh) {
    console.log(`使用缓存数据: ${formattedDate}`);
    if (updateUI) {
      tasks.value = JSON.parse(JSON.stringify(dailyTasksCache.value[formattedDate]));
    }
    return;
  }

  if (updateUI && !silent) loading.value = true;
  
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo?.id) {
      showToast('用户信息异常，请重新登录');
      router.push('/login');
      return;
    }
    
    // 使用格式化的日期发送API请求
    const res = await getReviewTasks(userInfo.id, formattedDate);
    
    // 修改 fetchReviewTasks 函数中的响应处理
    if (res && res.code === 200) {  // 添加对res的检查
      // 将任务数据转换为组件需要的格式
      const fetchedTasks = res.data.map(task => ({
        id: task.taskId,
        questionId: task.id,
        subject: task.subject,
        knowledgePoint: task.knowledgePoint,
        completed: Boolean(task.completed),
        errorType: task.errorType
      }));
      
      console.log(`获取到${date}的任务数量:`, fetchedTasks.length);
      
      // 更新当前显示的任务和缓存
      if (updateUI) {
        tasks.value = fetchedTasks;
      }
      // 使用格式化的日期作为缓存键
      dailyTasksCache.value[formattedDate] = fetchedTasks;
      
      // 在 Plan.vue 的 updateReviewTasks 调用之前添加调试代码
      console.log('更新前store中的数据:', progressStore.reviewTasksByDate);
      // 更新到store
      progressStore.updateReviewTasks(formattedDate, fetchedTasks);
      console.log('更新后store中的数据:', progressStore.reviewTasksByDate);
      console.log('更新后计算的进度:', progressStore.reviewProgress);
      
      // 日志输出加载到的任务状态
      console.log(`${formattedDate} 日期任务加载完成:`, 
        fetchedTasks.map(t => `${t.id}:${t.completed?'已完成':'未完成'}`).join(', '));
      
      // 更新已完成日期列表
      if (updateUI && !silent) {
        updateCompletedDates();
      }
    } else {
      console.warn(`获取任务响应异常:`, res);
      if (!silent && res) showToast(res.message || '获取任务失败');
    }
  } catch (error) {
    console.error('获取复习任务失败:', error);
    if (!silent) showToast('获取任务失败，请重试');
  } finally {
    if (updateUI && !silent) loading.value = false;
  }
}

// 使用防抖版本的请求函数
const debouncedFetchReviewTasks = debounce(fetchReviewTasks, 300);

const fetchCompletedDates = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo?.id) {
      showToast('用户信息异常，请重新登录');
      router.push('/login');
      return;
    }
    
    const res = await getCompletedDates(userInfo.id);
    
    if (res && res.code === 200) {
      // 确保所有日期都格式化为YYYY-MM-DD
      completedDates.value = res.data.map(date => formatDateToYYYYMMDD(date));
      console.log('已完成日期:', completedDates.value);
    }
  } catch (error) {
    console.error('获取已完成日期失败:', error);
  }
};

// 修改为接收单个任务的状态变化
const handleTaskSelect = async (taskId, checked) => {
  console.log(`任务 ${taskId} 状态变为: ${checked ? '已完成' : '未完成'}`);
  
  try {
    // 获取本地今天日期，用于比较
    const today = getLocalToday();
    
    // 如果不是今天的任务，静默拒绝修改
    if (selectedDate.value !== today) {
      console.log('不是今天的任务，拒绝修改');
      showToast('历史任务不能修改');
      return;
    }
    
    // 直接更新本地状态，不等待API响应
    tasks.value = tasks.value.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: checked }
      }
      return task
    });
    
    // 更新缓存
    dailyTasksCache.value[selectedDate.value] = [...tasks.value];
    
    // 异步发送API请求
    try {
      const result = checked ? 
        await completeReviewTask(taskId) : 
        await uncompleteReviewTask(taskId);
      
      console.log(`API响应:`, result);
      
      if (result.code !== 200) {
        console.error('更新任务状态失败:', result);
        showToast('操作失败，请重试');
        
        // API失败时恢复之前的状态
        await fetchReviewTasks(selectedDate.value, true, false, true);
      } else {
        // 成功后更新已完成日期列表
        updateCompletedDates();
      }
    } catch (error) {
      console.error('API调用失败:', error);
      showToast('网络错误，请重试');
      
      // 出错时恢复原状态
      await fetchReviewTasks(selectedDate.value, true, false, true);
    }
  } catch (error) {
    console.error('处理任务状态出错:', error);
    showToast('操作失败，请重试');
  }
};

// 处理任务点击 - 跳转到错题详情页
const handleTaskClick = (taskId) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task && task.questionId) {
    router.push({
      name: 'detail',
      params: { id: task.questionId }
    })
  } else {
    showToast('无法获取题目信息')
  }
}

// 更新已完成日期列表
const updateCompletedDates = () => {
  let hasChanges = false;
  
  // 检查是否有实际变化
  Object.keys(dailyTasksCache.value).forEach(date => {
    const formattedDate = formatDateToYYYYMMDD(date);
    const dateTasks = dailyTasksCache.value[date];
    
    if (dateTasks && dateTasks.length > 0 && dateTasks.every(task => task.completed)) {
      console.log(`${formattedDate}日期所有任务已完成`);
      // 标准化日期格式后再比较
      const exists = completedDates.value.some(d => formatDateToYYYYMMDD(d) === formattedDate);
      if (!exists) {
        console.log(`将${formattedDate}添加到已完成日期列表`);
        completedDates.value.push(formattedDate);
        hasChanges = true;
      }
    } else {
      // 如果不是全部完成，确保此日期不在completedDates中
      console.log(`${formattedDate}任务未全部完成，从已完成列表移除`);
      const initialLength = completedDates.value.length;
      completedDates.value = completedDates.value.filter(d => 
        formatDateToYYYYMMDD(d) !== formattedDate
      );
      if (completedDates.value.length !== initialLength) {
        hasChanges = true;
      }
    }
  });
  
  // 只有在有实际变化时才更新
  if (hasChanges) {
    completedDates.value = [...completedDates.value];
  }
};

// 添加此函数到Plan.vue <script setup>部分
const formatDateToYYYYMMDD = (date) => {
  if (!date) return '';
  
  if (typeof date === 'string') {
    return date.split('T')[0];
  } else if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  } else {
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '';
    }
  }
};

// 确保任何时候比较日期都使用格式化后的字符串
const isSameDate = (date1, date2) => {
  return formatDateToYYYYMMDD(date1) === formatDateToYYYYMMDD(date2);
};

// 添加页面级别的加载状态
const pageLoading = ref(true);

onMounted(async () => {
  try {
    console.log('Plan组件挂载，开始加载数据...');
    pageLoading.value = true;
    
    // 一次性获取所有必要数据，避免多次更新
    await Promise.all([
      fetchCompletedDates(),
      fetchReviewTasks()
    ]);
    
    console.log('Plan页面数据加载完成');
    
    // 使用setTimeout而不是立即预加载，给UI时间稳定下来
    setTimeout(() => {
      // 低优先级加载其他日期的任务
      preloadRecentTasks();
    }, 500);

    // 添加：主动加载最近7天的任务数据
    await fetchRecentDaysTasksData();
  } catch (error) {
    console.error('初始化数据加载失败:', error);
  } finally {
    pageLoading.value = false;
  }
});

// 替换现有的preloadRecentTasks函数
const preloadRecentTasks = () => {
  // 只预加载最近3天的数据，而不是7天
  const queue = [];
  const today = new Date();
  
  for (let i = 1; i <= 3; i++) { // 减少天数范围
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = formatDateToYYYYMMDD(date);
    
    if (!dailyTasksCache.value[dateStr]) {
      queue.push(dateStr);
    }
  }
  
  // 更长的间隔时间，减少视觉干扰
  let index = 0;
  const processNext = () => {
    if (index < queue.length) {
      const dateStr = queue[index++];
      fetchReviewTasks(dateStr, false, true).then(() => {
        setTimeout(processNext, 500); // 增加间隔时间
      });
    }
  };
  
  if (queue.length > 0) {
    setTimeout(processNext, 1000); // 延迟开始预加载
  }
};

// 添加新函数：获取最近7天的任务数据
const fetchRecentDaysTasksData = async () => {
  try {
    // 获取最近7天的日期
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(formatDateToYYYYMMDD(date));
    }
    
    console.log('预加载最近7天任务数据:', dates);
    
    // 并行加载所有日期的任务
    await Promise.all(dates.map(date => 
      fetchReviewTasks(date, false, true, false)
    ));
    
    console.log('所有历史任务预加载完成');
  } catch (error) {
    console.error('预加载任务数据失败:', error);
  }
};

// 检查当前的API调用
const uncompleteTask = async (taskId) => {
  try {
    console.log('发送取消完成请求，taskID:', taskId);
    // 确保使用的是正确的ID字段 - 应该是taskId而不是id
    const response = await uncompleteReviewTask(taskId);
    console.log('取消完成响应:', response);
    return response;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}
</script>

<style lang="less" scoped>
.plan-container {
  padding-bottom: 60px;
  background-color: white;
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

.review-tasks {
  padding: 16px;

  .task {
    text-align: left;
    font-size: 16px;
    font-weight: 500;
    margin-left: 14px;
    margin-bottom: 16px;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 0;
    
    span {
      margin-top: 10px;
      color: #999;
    }
  }
  
  .empty-task {
    padding: 30px 0;
  }
}

.progress-info {
  padding: 16px;
  margin-bottom: 12px;
  
  p {
    margin-bottom: 8px;
    color: #666;
  }
}

.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>