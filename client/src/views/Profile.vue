<template>
    <div class="profile-page">
        <!-- 头部 -->
        <header class="profile-header">
            <h1 class="header-title">个人中心</h1>
        </header>

        <!-- 用户信息 -->
        <section class="user-info">
            <div class="avatar">
                <img src="@/assets/student.png" alt="用户头像">
            </div>
            <div class="info">
                <div class="name-school">
                    <span class="name">{{ userInfo.name || '未知用户' }}</span>
                </div>
                <div class="badges">
                    <span class="badge study-days">连续学习{{ studyDays }}天</span>
                    <span class="badge honor">{{ userBadge }}</span>
                </div>
            </div>
        </section>

        <!-- 本周数据 -->
        <section class="week-data">
            <div class="data-card">
                <div class="data-content">
                    <!-- 左侧数据 -->
                    <div class="data-left">
                        <h3>本周错题</h3>
                        <div class="data-main">
                            <span class="number">{{ weeklyErrorCount }}</span>
                            <span class="unit">道</span>
                        </div>
                        <div class="data-compare" :class="growthRate > 0 ? 'rise' : 'fall'">
                            <i class="iconfont" :class="growthRate > 0 ? 'icon-rise' : 'icon-fall'"></i>
                            <span>{{ compareText }}</span>
                        </div>
                    </div>

                    <!-- 右侧进度环 -->
                    <div class="data-right">
                        <van-circle :current-rate="masteryRateDisplay" :rate="100" :speed="10" :color="primaryColor"
                            layer-color="rgba(33, 150, 243, 0.1)" :text="masteryPercent + '%'" size="90"
                            :stroke-width="60" />
                        <div class="circle-label">掌握度</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 功能卡片 -->
        <section class="feature-cards">
            <div class="card-grid">
                <div class="feature-card" @click="goToErrorBook">
                    <i class="iconfont icon-cuotiben"></i>
                    <div class="card-content">
                        <h4>错题本</h4>
                        <div class="subtitle"></div>
                    </div>
                </div>

                <div class="feature-card" @click="goToParentGuard">
                    <i class="iconfont icon-jiazhang"></i>
                    <div class="card-content">
                        <h4>家长监护</h4>
                        <div class="subtitle">已绑定</div>
                    </div>
                </div>

                <div class="feature-card" @click="toggleTheme">
                    <i class="iconfont icon-moshi"></i>
                    <div class="card-content">
                        <h4>主题切换</h4>
                        <div class="subtitle"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 其他功能 -->
        <section class="other-features">
            <div class="feature-card" @click="$router.push('/help')">
                <div class="item-left">
                    <i class="iconfont icon-help"></i>
                    <span>帮助中心</span>
                </div>
                <i class="iconfont icon-youjiantou"></i>
            </div>
            <div class="feature-card" @click="logout">
                <div class="item-left">
                    <i class="iconfont icon-logout"></i>
                    <span>退出登录</span>
                </div>
                <i class="iconfont icon-youjiantou"></i>
            </div>
        </section>

        <TabBar />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import { getWeeklyWrongQuestions, getMasteryRate } from '@/api/index.js'
import { Circle, Progress } from 'vant';
import { useProgressStore } from '@/stores/progress'

const router = useRouter()
const progressStore = useProgressStore()

// 用户信息
const userInfo = ref({
    id: '',
    name: '',
    phone: ''
})

// 错题统计数据
const weeklyErrorCount = ref(0)
const growthRate = ref(0)
const studyDays = ref(3) // 默认值

// 添加掌握度数据（模拟数据）
const masteryPercent = ref(75) // 掌握度百分比
const totalQuestions = ref(100) // 总题目数

// 添加一个用于显示的变量(初始化为0以便有动画效果)
const masteryRateDisplay = ref(0);

// 添加 watch 以便在真实值变化时更新显示值
watch(masteryPercent, (newVal, oldVal) => {
    // 清除可能存在的旧定时器
    if (window.progressAnimTimer) {
        clearInterval(window.progressAnimTimer);
    }

    // 记录动画起点
    const startVal = masteryRateDisplay.value;
    const endVal = newVal;

    // 如果是首次或差异很小，直接设置
    if (oldVal === undefined || Math.abs(endVal - startVal) < 5) {
        masteryRateDisplay.value = endVal;
        return;
    }

    // 优化动画参数
    const duration = 1200; // 稍微缩短动画时间
    const interval = 16; // 使用更流畅的帧率 (~60fps)
    const steps = Math.max(duration / interval, 1);
    const increment = (endVal - startVal) / steps;

    let count = 0;
    window.progressAnimTimer = setInterval(() => {
        count++;
        // 使用精确计算而不是累加，避免误差
        masteryRateDisplay.value = startVal + increment * count;

        if (count >= steps) {
            masteryRateDisplay.value = endVal; // 确保最终值正确
            clearInterval(window.progressAnimTimer);
        }
    }, interval);
});

// 圆环颜色计算
const circleColor = computed(() => {
    if (masteryPercent.value < 60) return '#ff4d4f' // 红色
    if (masteryPercent.value < 80) return '#faad14' // 黄色
    return '#52c41a' // 绿色
})

// 计算用户徽章
const userBadge = computed(() => {
    if (weeklyErrorCount.value > 20) return '学习达人'
    if (weeklyErrorCount.value > 10) return '勤奋学员'
    return '优秀学员'
})

// 比较文本
const compareText = computed(() => {
    const rate = Math.abs(parseFloat(growthRate.value))
    return growthRate.value > 0
        ? `较上周增长${rate}%`
        : `较上周下降${rate}%`
})

// 获取用户信息
const getUserInfo = () => {
    try {
        const storedInfo = localStorage.getItem('userInfo')
        if (storedInfo) {
            userInfo.value = JSON.parse(storedInfo)
            console.log('获取到用户信息:', userInfo.value)
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
    }
}

// 获取错题统计数据
const fetchWrongQuestionStats = async () => {
    try {
        if (!userInfo.value.id) return

        const res = await getWeeklyWrongQuestions({ studentId: userInfo.value.id })
        console.log('获取到错题统计:', res)

        if (res.code === 200 && res.data) {
            weeklyErrorCount.value = res.data.count || 0
            growthRate.value = res.data.growthRate || 0
        }
    } catch (error) {
        console.error('获取错题统计失败:', error)

        // 获取失败时使用模拟数据
        weeklyErrorCount.value = 15
        growthRate.value = 5.2
    }
}

// 简化获取掌握度的函数
const fetchMasteryRate = async () => {
    try {
        if (!userInfo.value.id) return;

        // 设置初始显示值为0，准备动画
        masteryRateDisplay.value = 0;

        // 获取API数据
        const res = await getMasteryRate(userInfo.value.id);
        let finalRate = 75; // 默认值

        if (res.code === 200) {
            finalRate = res.data.masteryRate;
            console.log('API返回掌握度:', finalRate);

            // 如果缓存值差异不大，优先使用缓存避免跳变
            const cachedRate = progressStore.masteryRate;
            if (cachedRate > 0 && Math.abs(cachedRate - finalRate) < 10) {
                console.log('使用缓存掌握度:', cachedRate);
                finalRate = cachedRate;
            }

            // 更新存储
            progressStore.updateMasteryRate(finalRate);
        }

        // 最后一次性设置值，触发一次动画
        masteryPercent.value = finalRate;

    } catch (error) {
        console.error('获取掌握度失败:', error);
        masteryPercent.value = 75;
    }
}

// 组件挂载时获取数据
onMounted(() => {
    getUserInfo();
    // 先获取掌握度，再获取错题统计
    fetchMasteryRate().then(() => {
        fetchWrongQuestionStats();
    });
})

// 点击错题本的处理函数
const goToErrorBook = () => {
    router.push('/book')
}

// 点击家长监护的处理函数
const goToParentGuard = () => {
    router.push('/parent-guard')
}

// 点击主题切换的处理函数
const toggleTheme = () => {
    console.log('点击了主题切换')
}

// 退出登录
const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
}

// 定义 JS 变量 primaryColor
const primaryColor = '#2196F3';
</script>


<style lang="less" scoped>
@primary-color: #2196F3;
@card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

.profile-page {
    background: #F8F9FA;
    min-height: 100vh;
    padding-bottom: 80px;
}

.profile-header {
    background: @primary-color;
    padding: 16px 0;

    .header-title {
        color: white;
        margin: 12px 0 12px 30px;
        font-size: 18px;
        font-weight: 600;
    }
}

.user-info {
    display: flex;
    align-items: center;
    padding: 20px 16px;

    .avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 16px;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .name-school {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .name,
        .school {
            font-weight: 600;
            font-size: 18px;
        }

        .divider {
            color: #666;
            font-weight: 400;
        }
    }

    .badges {
        display: flex;
        gap: 8px;

        .badge {
            padding: 4px 12px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 500;

            &.study-days {
                background: rgba(@primary-color, 0.1);
                color: @primary-color;
            }

            &.honor {
                background: rgba(#4CAF50, 0.1);
                color: #4CAF50;
            }
        }
    }
}

.week-data {
    padding: 0 16px;
    margin-bottom: 24px;

    .data-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: @card-shadow;

        .data-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .data-left {
            flex: 1;
        }

        .data-right {
            display: flex;
            flex-direction: column;
            align-items: center;

            .circle-label {
                margin-top: 8px;
                font-size: 14px;
                color: #666;
            }
        }

        .data-main {
            display: flex;
            align-items: baseline;
            margin: 8px 0;

            .number {
                font-size: 28px;
                font-weight: 700;
                color: #333;
                margin-right: 4px;
            }

            .unit {
                color: #666;
                font-size: 14px;
            }
        }

        .data-compare {
            display: flex;
            align-items: center;
            font-size: 12px;

            .icon-rise {
                margin-right: 4px;
                color: #4CAF50 !important;
            }

            .icon-fall {
                margin-right: 4px;
                color: #F44336;
            }
        }
    }
}

.data-compare {
    display: flex;
    align-items: center;
    font-size: 12px;

    &.rise {
        color: #4CAF50;

        .icon-rise {
            margin-right: 4px;
        }
    }

    &.fall {
        color: #F44336;

        .icon-fall {
            margin-right: 4px;
        }
    }
}

.feature-cards {
    padding: 0 16px;
    margin-bottom: 24px;

    .card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;

        .feature-card {
            background: white;
            border-radius: 12px;
            padding: 20px 12px;
            box-shadow: @card-shadow;
            display: flex;
            flex-direction: column;
            align-items: center;

            .iconfont {
                font-size: 28px;
                color: #666;
                margin: 0 0 6px 0;
                line-height: 1;
            }

            .subtitle {
                margin-top: 4px;
                text-align: center;
                font-size: 12px;
                color: #2196F3;
                min-height: 18px;
                line-height: 1.2;
            }
        }
    }
}

.other-features {
    padding: 0 16px;
    margin-bottom: 24px;
    display: grid;
    gap: 16px;

    .feature-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: @card-shadow;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;

        .item-left {
            display: flex;
            align-items: center;
            gap: 12px;

            .iconfont {
                font-size: 20px;
                color: @primary-color;
            }
        }

        .icon-youjiantou {
            color: #999;
            font-size: 14px;
        }
    }
}

/* 添加动画样式 */
.fade-zoom-enter-active {
    transition: all 0.5s ease;
}

.fade-zoom-enter-from {
    opacity: 0;
    transform: scale(0.8);
}

/* 进度条文字样式 */
:deep(.van-circle__text) {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

/* 调整圆环位置 */
.data-right {
    display: flex;
    flex-direction: column;
    align-items: center;

    .circle-label {
        margin-top: 8px;
        font-size: 14px;
        color: #666;
    }
}
</style>
封装了 Axios，后端利用 JWT 来实现登录鉴权
封装 v-copy、v-debounce、v-longpress 等指令提升交互体验
基于 Token 实现七天免登录，本地 localStorage 加密存储，拦截器中自动续期Token
使用媒体查询+ Flex 弹性布局，实现了响应式布局
接入阿里云 OCR API 实现拍照/截图一键识别题目内容，支持数学公式识别
使用了 Pinia 来实现用户的复习进度数据共享
基于 ECharts 实现错题分布、掌握度趋势等可视化图表，直观展示学习状态