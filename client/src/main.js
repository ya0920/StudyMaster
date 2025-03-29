import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from '@/router/index';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia'; // 状态管理
import { ElMessage } from 'element-plus';
import Vant from 'vant'
import 'vant/lib/index.css'
import directives from './directives';

const app = createApp(App);
app.use(ElementPlus);
app.use(Vant)

// 全局导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const expiresAt = localStorage.getItem('expiresAt');

  if (token && expiresAt && new Date().getTime() < expiresAt) {
    // token 存在且未过期
    if (to.path === '/login') {
      next('/home'); // 已登录，跳转到 Home 页面
    } else {
      next(); // 继续导航
    }
  } else {
    // token 不存在或已过期
    if (to.path !== '/login' && to.path !== '/register' && to.path !== '/forget') {
      ElMessage.error('请先登录');
      next('/login'); // 跳转到登录页面
    } else {
      next(); // 继续导航
    }
  }
});
app.use(directives);
app.use(router);
app.use(createPinia());
app.mount('#app');
