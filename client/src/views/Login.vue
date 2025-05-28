<template>
    <div class="login-container">
        <div class="logo-head">
            <img src="@/assets/logo.png" alt="">
            <p>AI助力高效学习123456</p>
        </div>
        <div class="type-select">
            <el-radio-group v-model="userType" size="large" round>
                <el-radio-button label="student">学生</el-radio-button>
                <el-radio-button label="parent">家长</el-radio-button>
            </el-radio-group>
        </div>
        <div class="input">
            <input type="text" v-model="phone" placeholder="请输入手机号" />
            <input type="password" v-model="password" placeholder="请输入密码" />
        </div>
        <div class="forgot-register">
            <span @click="handleForgotPassword">忘记密码？</span>
            <span @click="handleRegister">注册账号</span>
        </div>
        <button class="login-button" @click="login">登录</button>
        <div class="login-footer">
            <div class="third-party-login">
                <span class="iconfont icon-weixin" @click="handleWeChatLogin"></span>
                <span class="iconfont icon-QQ" @click="handleQQLogin"></span>
            </div>
            <p class="agreement">
                登录即表示同意
                <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import md5 from 'md5';
import { userLogin } from '@/api/index.js';
import { ElMessage } from 'element-plus';

const router = useRouter();
// 定义响应式数据，默认用户类型为学生
const userType = ref('student');
const phone = ref('');
const password = ref('');

// 定义方法
const login = async () => {
    if (!phone.value || !password.value) {
        ElMessage.error('手机号或密码不能为空');
        return;
    }
    // 调用登录接口
    const res = await userLogin({
        phone: phone.value,         // 原 phone_number → phone
        password: md5(password.value),
        role: userType.value       // 原 user_type → role
    });

    if (res.code === 200) {
        // 存储用户信息需要对应新字段
        localStorage.setItem('userInfo', JSON.stringify({
            id: res.data.id,
            name: res.data.name,
            phone: res.data.phone,
            role: res.data.role
        }));
        // 设置 token 及过期时间（7 天）
        const token = res.token;
        const expiresAt = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 天后过期
        localStorage.setItem('token', token);
        localStorage.setItem('expiresAt', expiresAt);

        // 存储用户信息
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        ElMessage.success('登录成功');
        console.log('登录成功:', res);


        // 跳转到 Home 页面
        router.push('/home');
    } else {
        ElMessage.error(res.msg || '登录失败');
    }
}

const handleForgotPassword = () => {
    console.log('点击了忘记密码');
    router.push('/forget');
};

const handleRegister = () => {
    console.log('点击了注册账号');
    router.push('/register');
};

const handleWeChatLogin = () => {
    console.log('点击了微信登录');
};

const handleQQLogin = () => {
    console.log('点击了QQ登录');
};
</script>

<style lang="less" scoped>
.login-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    max-width: calc(300px + 24px * 2);
    margin: 0 auto;
    padding: 24px;
    box-sizing: border-box;
}

.logo-head {
    text-align: center;
    margin-bottom: 20px;

    img {
        width: 80px;
        height: 80px;
    }

    p {
        font-size: 14px;
        color: #333;
        margin-top: 5px;
    }
}

.type-select {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    .el-radio-group {
        display: flex;
        justify-content: center;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner) {
        border-radius: 15px 0 0 15px;
    }

    :deep(.el-radio-button:last-child .el-radio-button__inner) {
        border-radius: 0 15px 15px 0;
    }
}

.input {
    input {
        width: 100%;
        padding: 12px 24px;
        margin-bottom: 15px;
        background-color: #F9FAFB;
        border: none;
        border-radius: 5px;
        font-size: 14px;
        line-height: normal;
        box-sizing: border-box;
        outline: none;

        &::placeholder {
            color: #9CA3AF;
        }
    }
}

.forgot-register {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    margin-bottom: 20px;
    font-size: 14px;
    cursor: pointer;

    span:nth-child(1) {
        color: #6B7280;
    }

    span:nth-child(2) {
        color: #2196F3;
    }
}

.login-button {
    width: 100%;
    padding: 12px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 20px;
}

.login-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: auto;
}

.third-party-login {
    display: flex;
    margin-bottom: 15px;

    .iconfont {
        display: inline-block;
        width: 48px;
        height: 48px;
        line-height: 48px;
        border-radius: 50%;
        font-size: 30px;
        margin: 0 10px;
        text-align: center;
        color: white;
        cursor: pointer;
    }

    .icon-weixin {
        background-color: #07C160;
    }

    .icon-QQ {
        background-color: #12B7F5;
    }
}

.agreement {
    text-align: center;
    font-size: 12px;

    a {
        color: #007bff;
        text-decoration: none;
    }
}
</style>