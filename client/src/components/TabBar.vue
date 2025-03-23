<template>
    <div class="tab-bar">
        <router-link v-for="item in tabItems" :key="item.path" :to="item.path" class="tab-item"
            :class="{ active: isActive(item.path) }">
            <i :class="['iconfont', item.iconClass]"></i>
            <span class="label">{{ item.label }}</span>
        </router-link>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabItems = ref([
    { path: '/home', iconClass: 'icon-shouye', label: '首页' },
    { path: '/plan', iconClass: 'icon-jihua', label: '复习计划' },
    { path: '/profile', iconClass: 'icon-wode', label: '我的' }
])

const isActive = (path) => {
    return route.path.startsWith(path)
}
</script>

<style lang="less" scoped>
.tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    // 使用视口单位适配
    height: calc(12vh - 20px); // 动态高度（范围 50px-80px）
    min-height: 50px; // 最小高度

    background: #fff;
    display: flex;
    justify-content: space-around;
    align-items: center;
    border: 1px solid #E5E7EB;
    z-index: 1000;

    .tab-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        color: #666;
        padding: 8px;
        transition: all 0.3s;

        .iconfont {
            font-size: 24px;
            margin-bottom: 4px;
        }

        .label {
            font-size: 12px;
            transform: scale(0.9);
        }

        &.active {
            color: #2196F3;

            .iconfont {
                transform: scale(1.1);
            }
        }
    }
}
</style>