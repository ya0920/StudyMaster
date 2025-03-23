import { pa } from 'element-plus/es/locale/index.mjs'
import { createRouter, createWebHistory } from 'vue-router'
const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/Login.vue'),
        meta: { showTabBar: false }
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/Register.vue'),
        meta: { showTabBar: false }
    },
    {
        path: '/forget',
        name: 'forget',
        component: () => import('@/views/Forget.vue'),
        meta: { showTabBar: false }
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('@/views/Home.vue'),
        meta: { showTabBar: true }
    },
    {
        path: '/plan',
        name: 'plan',
        component: () => import('@/views/Plan.vue'),
        meta: { showTabBar: true }
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/Profile.vue'),
        meta: { showTabBar: true }
    },
    {
        path: '/upload',
        name: 'upload',
        component: () => import('@/views/Upload.vue'),
        meta: { showTabBar: false }
    },
    // 修改 detail 路由配置
    {
        path: '/detail/:id',
        name: 'detail',
        component: () => import('@/views/Detail.vue'),
        props: true, // 启用 props 接收参数
        meta: { showTabBar: false }

    },
    {
        path: '/book',
        name: 'book',
        component: () => import('@/views/Book.vue'),
        meta: { showTabBar: false }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router