<template>
    <div class="book-page">
        <!-- 头部 -->
        <van-nav-bar title="错题本" left-arrow @click-left="onClickLeft">
            <template #right>
                <van-popover v-model:show="showPopover" :actions="subjectOptions" @select="onSelectSubject"
                    placement="bottom-end">
                    <template #reference>
                        <van-button type="primary" size="small" class="subject-trigger van-button--primary">
                            {{ selectedSubject }}
                            <van-icon name="arrow-down" />
                        </van-button>
                    </template>
                </van-popover>
            </template>
        </van-nav-bar>

        <div class="content">
            <!-- 柱状图部分 -->
            <section class="chart-section">
                <h2 class="chart-title">错题分布</h2>
                <VerticalBarChart :data="chapterData" />
            </section>

            <!-- 文本部分 -->
            <section class="text-section">
                <ul>
                    <li v-for="(detail, index) in filteredChapterDetails" :key="index" class="card">
                        <div class="card-top">
                            <span class="subject" :style="{ color: getSubjectColor(detail.subject) }">
                                {{ detail.subject }}
                            </span>
                            <span class="time">{{ detail.date }}</span>
                        </div>
                        <div class="knowledge">
                            {{ detail.knowledgePoint }}
                        </div>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NavBar, Popover, Button, Icon } from 'vant';
import VerticalBarChart from '@/components/VerticalBarChart.vue';

const router = useRouter();
const showPopover = ref(false);
const selectedSubject = ref('全部');

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

const onSelectSubject = (action) => {
    selectedSubject.value = action.value;
    showPopover.value = false;
};

const chapterData = ref([
    { value: 80, name: '第一章' },
    { value: 60, name: '第二章' },
    { value: 40, name: '第三章' },
    { value: 30, name: '第四章' },
    { value: 20, name: '第五章' },
]);

// 示例数据，卡片只展示学科、知识点和时间
const chapterDetails = ref([
    {
        subject: '数学',
        knowledgePoint: '一元二次方程',
        date: '2025-02-04'
    },
    {
        subject: '语文',
        knowledgePoint: '现代诗鉴赏',
        date: '2025-02-03'
    },
    {
        subject: '英语',
        knowledgePoint: '时态用法',
        date: '2025-02-02'
    }
]);

// 根据所选学科过滤数据，如果选择“全部”，则返回所有数据
const filteredChapterDetails = computed(() => {
    if (selectedSubject.value === '全部') {
        return chapterDetails.value;
    } else {
        return chapterDetails.value.filter(detail => detail.subject === selectedSubject.value);
    }
});

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

const onClickLeft = () => {
    router.back();
};
</script>

<style lang="less" scoped>
.book-page {
    min-height: 100vh;

    .content {
        padding: 18px;
        background: #FAFAFA; // 内容区背景色为灰色
        padding-bottom: 40px;

        .chart-section {
            background: #fff; // 柱状图区域背景白色
            border-radius: 12px; // 圆角边框
            padding: 15px;
            margin-bottom: 24px;

            .chart-title {
                color: #34495e;
            }
        }

        .text-section {
            ul {
                list-style: none;
                padding: 0;
                margin: 0;

                .card {
                    background-color: #fff;
                    box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
                    border-radius: 12px 12px 12px 12px;

                    padding: 24px 15px;
                    margin-top: 24px;
                    display: flex;
                    flex-direction: column;

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
                        margin-top: 4px;
                        font-size: 14px;
                        color: #7f8c8d;
                    }
                }
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

            &[aria-expanded="true"] .van-icon {
                transform: rotate(180deg);
            }
        }

        .van-popover__action {
            font-size: 14px;
            padding: 10px 16px;

            &:active {
                background-color: #f2f3f5;
            }
        }
    }
}
:deep(.subject-trigger) {
  color: #333;
  background: #fff;
}

