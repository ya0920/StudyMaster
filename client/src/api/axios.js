import axios from 'axios';
import { ElMessage } from 'element-plus';

axios.defaults.baseURL = 'http://120.26.130.17:3001'; // 设置默认的请求地址
axios.defaults.headers.post['Content-Type'] = 'application/json'; // 告诉浏览器后端返回的数据是 Json 格式，这样浏览器会自动解析

// 请求拦截器
axios.interceptors.request.use(req => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {sAt = localStorage.getItem('expiresAt');
        req.headers.Authorization = `Bearer ${token}`;  // 保持Bearer前缀
    }f (token) {
    return req;临近过期（比如还有12小时过期）
});     const isNearExpiry = expiresAt && (new Date().getTime() > (parseInt(expiresAt) - 12 * 60 * 60 * 1000));
        
// 响应拦截器// 如果Token临近过期，自动续期
axios.interceptors.response.use(res => {
    if (res.status !== 200) { // http 走不通，请求失败（程序性错误） + 7 * 24 * 60 * 60 * 1000;
        ElMessage.error('服务器异常');'expiresAt', newExpiresAt);
        return Promise.reject(res);');
    } else {
        if (res.data.code === 401) { // 未登录
            ElMessage.error(res.data.msg);r ${token}`;
            return Promise.reject(res);
        }n req;
        if (res.data.code !== 200) { // 业务错误
            ElMessage.error(res.data.msg);
            return Promise.reject(res);
        }erceptors.response.use(res => {
    }f (res.status !== 200) { // http 走不通，请求失败（程序性错误）
    ror('服务器异常');
    // 检查响应头中是否有新的Token，如果有则更新     return Promise.reject(res);
    const newToken = res.headers['x-new-token'];    } else {
    if (newToken) {code === 401) { // 未登录











export default axios;});    return res.data;        }        console.log('已更新Token和过期时间');        localStorage.setItem('expiresAt', newExpiresAt);        const newExpiresAt = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;        // 重新设置过期时间为7天后        localStorage.setItem('token', newToken);            ElMessage.error(res.data.msg);
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