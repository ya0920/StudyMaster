<template>
    <div class="home-page">
        <!-- 顶部标题区域 -->
        <header class="app-header">
            <img src="@/assets/logo.png" class="logo" alt="logo" />
            <span class="title">学习报告</span>
        </header>
        <!-- 内容容器，用于包裹主要内容区域 -->
        <div class="content-container">
            <!-- 统计卡片 -->
            <section class="stats-cards">
                <!-- 修改统计卡片中的本周错题显示 -->
                <div class="stat-card">
                    <div class="stat-title">本周错题</div>
                    <div class="stat-content">
                        <span class="main-value">{{ todayWrongCount }}</span>
                        <!-- 可以保留或移除增长率显示 -->
                        <span class="sub-value">↑{{growthRate}}%</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">复习进度</div>
                    <div class="stat-content">
                        <span class="main-value">{{ todayReviewProgress }}%</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">掌握度</div>
                    <div class="main-value">{{ masteryRate }}%</div>
                </div>
            </section>

            <!-- 章节分布 -->
            <section class="chart-section">
                <h3 class="section-title">各学科错误分布</h3>
                <VerticalBarChart :data="chapterData" />
                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <button class="btn" @click="handleCapture">
                        <i class="iconfont icon-paizhao"></i>
                        <p>抽题录入</p>
                    </button>
                    <button class="btn" @click="handleGenerate">
                        <i class="iconfont icon-shijuanguanli"></i>
                        <pp>生成试卷</pp>
                    </button>
                </div>
            </section>

            <!-- 最近错题 -->
            <section class="recent-errors">
                <h3 class="section-title">最近错题</h3>
                <div class="error-list">
                    <div v-for="(error, index) in recentErrors" :key="index" class="error-item"
                        @click="handleErrorClick(error)">
                        <div class="subject">{{ error.subject }}</div>
                        <div class="topic">{{ error.topic }}</div>
                        <div class="time">{{ error.time }}</div>
                    </div>
                </div>
            </section>

        </div>
        <!-- 底部导航 -->
        <TabBar />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import VerticalBarChart from '@/components/VerticalBarChart.vue'
import { useProgressStore } from '@/stores/progress'
import { getRecentWrongQuestions, getWeeklyWrongQuestions, getSubjectDistribution, getReviewTasks } from '@/api/index.js'

const router = useRouter()
const progressStore = useProgressStore()

// 首页统计数据显示当日进度
const todayProgress = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    const tasks = progressStore.dailyTasks[today] || []
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    return total ? Math.round((completed / total) * 100) : 0
})

// 当日复习进度（修改此处）
const todayReviewProgress = computed(() => {
  // 使用 reviewTasksByDate，而不是 dailyTasks
  const today = new Date().toISOString().split('T')[0];
  const tasks = progressStore.reviewTasksByDate[today] || [];
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  
  console.log(`当日复习进度计算: 完成${completed}/${total}`);
  return total ? Math.round((completed / total) * 100) : 0;
});

// 全局复习进度
const reviewProgress = computed(() => progressStore.reviewProgress)

// 章节掌握率
const chapterData = ref([])

// 替换原有的recentErrors定义
const recentErrors = ref([]);

// 在setup函数中添加本周错题统计
const todayWrongCount = ref(0); // 替换原有的硬编码值
const growthRate = ref(0); // 新增增长率变量

onMounted(async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo?.id) {
        try {
            // 获取本周错题数量和增长率
            const weeklyRes = await getWeeklyWrongQuestions({ studentId: userInfo.id });
            if (weeklyRes.code === 200) {
                todayWrongCount.value = weeklyRes.data.count;
                growthRate.value = weeklyRes.data.growthRate;
            }

            // 获取最近错题数据
            const res = await getRecentWrongQuestions({ studentId: userInfo.id });
            console.log('最近错题数据:', res);
            
            if (res.code === 200) {
                recentErrors.value = res.data.map(item => ({
                    subject: item.subject,
                    topic: item.chapter,
                    time: formatTime(item.time),
                    questionId: item.id
                }));
            }

            //获取章节分布数据
            const subjectRes = await getSubjectDistribution({ studentId: userInfo.id });
            if (subjectRes.code === 200) {
                chapterData.value = subjectRes.data.map(item => ({
                    value: item.value,
                    name: item.name
                }));
            }

            // 获取今天日期
            const today = new Date().toISOString().split('T')[0]
            
            // 如果store中还没有数据，则主动加载一次
            if (!Object.keys(progressStore.reviewTasksByDate).length) {
                console.log('Home页面主动加载复习任务数据')
                const res = await getReviewTasks(userInfo.id, today)
                
                if (res.code === 200) {
                    const formattedTasks = res.data.map(task => ({
                        id: task.taskId,
                        questionId: task.id,
                        subject: task.subject,
                        knowledgePoint: task.knowledgePoint,
                        completed: Boolean(task.completed)
                    }))
                    
                    // 更新到store中
                    progressStore.updateReviewTasks(today, formattedTasks)
                }
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        }
    }
});

// 辅助方法
const formatTime = (dateString) => {
    const diffDays = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24))
    return diffDays === 0 ? '今天' : `${diffDays}天前`
}

// 修改掌握率计算属性
const masteryRate = computed(() => {
  return progressStore.masteryRate || 0;
});

// 处理按钮点击
const handleCapture = () => {
    // 跳转到抽题录入页面
    router.push('/upload')
}

const handleGenerate = () => {
    // 跳转到生成试卷页面
    router.push('/generate-paper')
}

// 处理错题点击
const handleErrorClick = (error) => {
    // 跳转到错题详情页
    router.push({
        name: 'detail',
        params: {
            id: error.questionId // ✅ 使用传入的error对象中的questionId
        }
    })
}
</script>

<style lang="less" scoped>
@primary-color: #2196F3;
@secondary-color: #4CAF50;
@text-color: #333;
@border-color: #E5E7EB;

.app-header {
    background: white;
    height: 54px;
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 2px solid @border-color;

    .logo {
        width: 32px;
        height: 32px;
        margin-right: 12px;
    }

    .title {
        font-size: 18px;
        font-weight: 600;
        color: @text-color;
    }
}

.content-container {
    background-color: #F9FAFB;
    padding: 16px 16px 90px 16px;

}

.stats-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    .stat-card {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;

        .stat-title {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .main-value {
            font-size: 24px;
            font-weight: 600;
            color: @text-color;
        }

        .sub-value {
            font-size: 12px;
            color: @secondary-color;
            margin-left: 8px;
        }
    }
}

.chart-section {
    background: white;
    border-radius: 8px;
    padding: 30px 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .section-title {
        font-size: 16px;
        color: @text-color;
        text-align: center;
    }

    .bar-chart {
        display: flex;
        height: 200px;
        align-items: flex-end;
        justify-content: space-between;
        margin: 20px 0 50px 0;

        .bar-item {
            width: 12%;
            background: @primary-color;
            border-radius: 4px 4px 0 0;
            position: relative;

            .percentage {
                position: absolute;
                top: -24px;
                width: 100%;
                text-align: center;
                font-size: 12px;
                color: @text-color;
            }

            .chapter-name {
                position: absolute;
                bottom: -24px;
                width: 100%;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
        }
    }
}

.recent-errors {

    .error-item {
        display: flex;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;

        background-color: #fff;
        align-items: center;
        margin: 16px 0;
        padding: 16px 16px;
        border-bottom: 1px solid @border-color;

        &:last-child {
            border-bottom: none;
        }

        .subject {
            margin-right: 16px;
            font-size: 14px;
            color: @primary-color;
            font-weight: 500;
        }

        .topic {
            flex: 1;
            font-weight: 400;
            font-size: 14px;
            color: @text-color;
        }

        .time {
            color: #999;
            font-size: 12px;
        }
    }
}

.action-buttons {
    display: flex;
    gap: 12px;
    // padding: 0 16px;

    .btn {
        flex: 1;
        padding: 24px 0;
        border-radius: 8px;
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background-color: #F9FAFB;

        .iconfont {
            font-size: 24px;
            color: @primary-color;
        }

        .p {
            font-size: 12px;
        }
    }
}
</style>