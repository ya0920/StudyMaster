import axios from 'axios';
import { ElMessage } from 'element-plus';

axios.defaults.baseURL = 'http://localhost:3000'; // 设置默认的请求地址
axios.defaults.headers.post['Content-Type'] = 'application/json'; // 告诉浏览器后端返回的数据是 Json 格式，这样浏览器会自动解析

// 请求拦截器
axios.interceptors.request.use(req => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;  // 保持Bearer前缀
    }
    return req;
});

// 响应拦截器
axios.interceptors.response.use(res => {
    if (res.status !== 200) { // http 走不通，请求失败（程序性错误）
        ElMessage.error('服务器异常');
        return Promise.reject(res);
    } else {
        if (res.data.code === 401) { // 未登录
            ElMessage.error(res.data.msg);
            return Promise.reject(res);
        }
        if (res.data.code !== 200) { // 业务错误
            ElMessage.error(res.data.msg);
            return Promise.reject(res);
        }
    }
    return res.data;
});

export default axios;