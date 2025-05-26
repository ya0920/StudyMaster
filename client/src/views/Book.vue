<template>
    <div class="book-page">
        <!-- 头部 -->
        <van-nav-bar title="错题本" left-arrow @click-left="onClickLeft">
            <template #right>
                <van-popover v-model:show="showPopover" :actions="subjectOptions" @select="onSelectSubject"
                    placement="bottom-end">
                    <template #reference>
                        <van-button size="small" class="subject-trigger">
                            {{ selectedSubject }}
                            <van-icon name="arrow-down" :class="{ 'arrow-rotate': showPopover }" />
                        </van-button>
                    </template>
                </van-popover>
            </template>
        </van-nav-bar>

        <!-- 下拉刷新包装器 -->
        <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
            <div class="content">
                <!-- 柱状图部分 -->
                <section class="chart-section">
                    <h2 class="chart-title">错题分布</h2>
                    <VerticalBarChart :data="chapterData" />
                </section>

                <!-- 文本部分 - 简化为类似示例的结构 -->
                <section class="text-section">
                    <van-swipe-cell 
                        v-for="(detail, index) in chapterDetails" 
                        :key="index"
                        v-longpress:800="() => handleLongPress(detail)"
                    >
                        <!-- 使用卡片组件简化结构 -->
                        <van-cell class="error-card" :clickable="true" @click="goToDetail(detail.id)">
                            <template #title>
                                <div class="card-top">
                                    <span class="subject" :style="{ color: getSubjectColor(detail.subject) }">
                                        {{ detail.subject }}
                                    </span>
                                    <span class="time">{{ detail.date }}</span>
                                </div>
                            </template>
                            <template #label>
                                <div class="knowledge">
                                    {{ detail.knowledgePoint }}
                                </div>
                            </template>
                        </van-cell>
                        
                        <!-- 右侧删除按钮 -->
                        <template #right>
                            <van-button 
                                square 
                                text="删除" 
                                type="danger" 
                                class="delete-button"
                                :loading="deletingIds.has(detail.id)"
                                @click.stop="confirmDelete(detail)"
                            />
                        </template>
                    </van-swipe-cell>
                </section>

                <!-- 上拉加载更多 -->
                <van-list
                    v-model:loading="loading"
                    :finished="finished"
                    finished-text="没有更多了"
                    @load="onLoad"
                >
                </van-list>
            </div>
        </van-pull-refresh>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  NavBar, 
  Popover, 
  Button, 
  Icon, 
  PullRefresh, 
  List, 
  showToast, 
  showConfirmDialog, 
  SwipeCell, 
  Cell 
} from 'vant';
import VerticalBarChart from '@/components/VerticalBarChart.vue';
import { getRecentWrongQuestions, deleteWrongQuestion as deleteWrongQuestionApi, addToReviewPlan } from '@/api/index.js';

const router = useRouter();
const showPopover = ref(false);
const selectedSubject = ref('全部');

// 移除togglePopover方法，让Popover组件自行处理显示逻辑

// 长按处理函数
const handleLongPress = (detail) => {
  showConfirmDialog({
    title: '错题复习提醒',
    message: `是否将"${detail.knowledgePoint}"添加到复习计划？`,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo?.id) {
          showToast('用户信息异常，请重新登录');
          router.push('/login');
          return;
        }
        
        const res = await addToReviewPlan({
          studentId: userInfo.id, 
          questionId: detail.id
        });
        
        if (res.code === 200) {
          showToast({
            message: res.message || '已添加到复习计划',
            type: 'success'
          });
        } else {
          showToast(res.message || '操作失败');
        }
      } catch (error) {
        console.error('添加到复习计划失败:', error);
        showToast('操作失败，请重试');
      }
    })
    .catch(() => {
      // 取消操作，不做任何处理
    });
};

// 下拉刷新和加载更多状态
const isRefreshing = ref(false);
const loading = ref(false);
const finished = ref(false);
const currentPage = ref(1);
const pageSize = 5; // 每页显示5条

// 删除错题确认
const confirmDelete = (detail) => {
  showConfirmDialog({
    title: '删除确认',
    message: `确定要删除"${detail.subject}-${detail.knowledgePoint}"的错题吗？`,
    confirmButtonText: '删除',
    confirmButtonColor: '#ee0a24',
    cancelButtonText: '取消'
  })
    .then(() => {
      deleteWrongQuestion(detail.id);
    })
    .catch(() => {
      // 取消操作，不做任何处理
    });
};

// 添加删除中状态管理
const deletingIds = ref(new Set());

// 删除错题
const deleteWrongQuestion = async (id) => {
    try {
        // 设置删除中状态
        deletingIds.value.add(id);
        
        // 调用实际的API删除错题
        const res = await deleteWrongQuestionApi(id);
        
        if (res.code === 200) {
            // 删除成功，从列表中移除该错题
            chapterDetails.value = chapterDetails.value.filter(item => item.id !== id);
            
            // 更新柱状图数据
            updateChartData();
            
            showToast('删除成功');
        } else {
            showToast('删除失败：' + (res.message || '未知错误'));
        }
    } catch (error) {
        console.error('删除错题失败:', error);
        showToast('删除失败，请稍后重试');
    } finally {
        // 无论成功失败，都移除删除中状态
        deletingIds.value.delete(id);
    }
};

// 学科筛选选项
const subjectOptions = [
    { text: '全部', value: '全部' },
    { text: '语文', value: '语文' },
    { text: '数学', value: '数学' },
    { text: '英语', value: '英语' },
    { text: '物理', value: '物理' },
    { text: '化学', value: '化学' },
    { text: '生物', value: '生物' },
    { text: '历史', value: '历史' },
    { text: '地理', value: '地理' },
    { text: '政治', value: '政治' }
];

// 当前学科筛选
const onSelectSubject = (action) => {
    selectedSubject.value = action.value;
    showPopover.value = false;
    // 重新加载数据
    resetData();
    fetchWrongQuestions();
};

// 柱状图数据
const chapterData = ref([]);

// 错题详情数据
const chapterDetails = ref([]);

// 定义各学科对应的颜色
const subjectColors = {
    '数学': '#4F46E5',   // 深蓝
    '语文': '#DC2626',   // 红色
    '英语': '#16A34A',   // 绿色
    '物理': '#F59E0B',   // 橙色
    '化学': '#10B981',   // 绿色
    '生物': '#3B82F6',   // 蓝色
    '历史': '#8B5CF6',   // 紫色
    '地理': '#EC4899',   // 粉色
    '政治': '#F97316'    // 橙红
};

const getSubjectColor = (subject) => {
    return subjectColors[subject] || '#333';
};

// 返回上一页
const onClickLeft = () => {
    router.back();
};

// 重置数据
const resetData = () => {
    currentPage.value = 1;
    chapterDetails.value = [];
    finished.value = false;
};

// 下拉刷新处理
const onRefresh = async () => {
    try {
        resetData();
        await fetchWrongQuestions();
        isRefreshing.value = false;
        showToast('刷新成功');
    } catch (error) {
        console.error('刷新数据失败:', error);
        isRefreshing.value = false;
        showToast('刷新失败');
    }
};

// 上拉加载更多
const onLoad = async () => {
    currentPage.value++;
    await fetchWrongQuestions(false); // 不清空数据，追加
    loading.value = false;
};

// 获取错题数据
const fetchWrongQuestions = async (clearData = true) => {
    try {
        // 获取用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo?.id) {
            console.error('无法获取用户ID');
            return;
        }

        // 构建请求参数，包含学科筛选
        const params = { 
            studentId: userInfo.id,
            page: currentPage.value,
            pageSize: pageSize
        };
        
        // 如果选择了特定学科，添加到请求参数
        if (selectedSubject.value !== '全部') {
            params.subject = selectedSubject.value;
        }

        // 传递参数到后端
        const res = await getRecentWrongQuestions(params);
        
        console.log('获取错题数据:', res);
        
        if (res.code === 200) {
            const newData = res.data.map(item => ({
                subject: item.subject,
                knowledgePoint: item.knowledgePoint || item.chapter,
                date: item.time ? formatTime(item.time) : '未知时间',
                id: item.id // 保存ID用于详情页
            }));

            // 如果需要清空数据（下拉刷新时）
            if (clearData) {
                chapterDetails.value = newData;
            } else {
                // 否则追加数据（上拉加载更多时）
                chapterDetails.value = [...chapterDetails.value, ...newData];
            }

            // 如果返回的数据少于pageSize，说明已经没有更多数据了
            if (res.data.length < pageSize) {
                finished.value = true;
            }

            // 更新柱状图数据
            updateChartData();
        } else {
            finished.value = true;
        }
    } catch (error) {
        console.error('获取错题数据失败:', error);
        finished.value = true;
    }
};

// 更新柱状图数据
const updateChartData = () => {
    const chapterCount = {};
    chapterDetails.value.forEach(item => {
        chapterCount[item.knowledgePoint] = (chapterCount[item.knowledgePoint] || 0) + 1;
    });

    chapterData.value = Object.entries(chapterCount).map(([name, value]) => ({
        name,
        value
    }));
};

// 时间格式化函数 - 改为年-月-日格式
const formatTime = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份从0开始，需要+1
    const day = date.getDate();
    return `${year}-${month}-${day}`;
}

// 页面加载时获取数据
onMounted(() => {
    fetchWrongQuestions();
});

// 跳转到详情页
const goToDetail = (id) => {
    if (!id) {
        showToast('无法获取题目ID');
        return;
    }
    router.push({
        name: 'detail',
        params: { id }
    });
};
</script>

<style lang="less" scoped>
.book-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 60px;

  .content {
    padding: 16px;
  }

  .chart-section {
    background-color: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .chart-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      color: #323233;
    }
  }

  .text-section {
    // 移除原来的ul样式，改为直接管理swipe-cell
    
    .error-card {
      margin: 0;
      background-color: #fff;
      border-radius: 12px;
      
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .subject {
          font-size: 16px;
          font-weight: 500;
        }

        .time {
          font-size: 12px;
          color: #7f8c8d;
        }
      }

      .knowledge {
        font-size: 14px;
        color: #7f8c8d;
        margin-top: 4px;
      }
    }
    
    // SwipeCell 样式调整
    :deep(.van-swipe-cell) {
      margin-top: 12px;
      border-radius: 12px;
      overflow: hidden;
    }
    
    // 删除按钮样式
    .delete-button {
      height: 100%;
      width: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14px;
    }
  }

  .subject-trigger {
    padding: 0 12px;
    background: #f5f6f7;
    border: none;
    color: #323233;

    .van-icon {
      margin-left: 4px;
      transition: transform 0.2s;
    }
  }

  // 使用新的样式控制箭头旋转
  .arrow-rotate {
    transform: rotate(180deg);
  }

  // 在book-page范围内使用deep选择器覆盖组件内部样式
  :deep(.van-button--default) {
    background: #fff;
    border: 1px solid #ebedf0;
  }
}
</style>
