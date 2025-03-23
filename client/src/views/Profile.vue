<template>
    <div class="profile-page">
        <!-- 头部 -->
        <header class="profile-header">
            <h1 class="header-title">个人中心</h1>
        </header>

        <!-- 用户信息 -->
        <section class="user-info">
            <div class="avatar">
                <img src="@/assets/vue.svg" alt="用户头像">
            </div>
            <div class="info">
                <div class="name-school">
                    <span class="name">张雨晨</span>
                    <span class="divider">|</span>
                    <span class="school">初二·北京一中</span>
                </div>
                <div class="badges">
                    <span class="badge study-days">连续学习7天</span>
                    <span class="badge honor">优秀学员</span>
                </div>
            </div>
        </section>

        <!-- 本周数据 -->
        <section class="week-data">
            <div class="data-card">
                <div class="data-content">
                    <h3>本周错题</h3>
                    <div class="data-main">
                        <span class="number">15</span>
                        <span class="unit">道</span>
                    </div>
                    <div class="data-compare">
                        <i class="iconfont icon-rise"></i>
                        <span>较上周提升5%</span>
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
import { useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()

// 点击错题本的处理函数
const goToErrorBook = () => {
    router.push('/book')
}

// 点击家长监护的处理函数
const goToParentGuard = () => {
    router.push('/parent-guard')
}

// 点击主题切换的处理函数（简单模拟，可进一步完善为弹出窗口等）
const toggleTheme = () => {
    console.log('点击了主题切换，准备进行主题切换操作')
}

const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
}
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
            color: #4CAF50;
            font-size: 12px;

            .icon-rise {
                margin-right: 4px;
            }
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
                color: @primary-color;
                margin-bottom: 12px;
            }

            .card-content {
                text-align: center;
                width: 100%;

                h4 {
                    font-size: 14px;
                    color: #666;
                    margin: 0 0 6px 0;
                    line-height: 1;
                }

                .subtitle {
                    font-size: 12px;
                    color: #2196F3;
                    min-height: 18px;
                    line-height: 1.2;
                }
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
</style>