<template>
    <div class="login-container">
        <div class="logo-head">
            <img src="@/assets/logo.png" alt="">
            <p>AI助力高效学习</p>
        </div>
        <div class="type-select">
            <el-radio-group v-model="userType" size="large" round>
                <el-radio-button label="student">学生</el-radio-button>
                <el-radio-button label="parent">家长</el-radio-button>
            </el-radio-group>
        </div>
        <div class="input">
            <input type="text" v-model="phone" placeholder="请输入手机号" />
            <input type="password" v-model="password" placeholder="请设置密码" />
            <input type="password" v-model="confirmPassword" placeholder="请确认密码" />
            <div class="verify-code">
                <input type="text" v-model="verifyCode" placeholder="请输入验证码" />
                <button class="get-code-btn" @click="getVerifyCode">获取验证码</button>
            </div>
        </div>
        <button class="login-button" @click="handleRegister">注册</button>

        <span class="back-to-login" @click="handleBackToLogin">返回登录</span>
        <div class="login-footer">
            <div class="third-party-login">
                <span class="iconfont icon-weixin" @click="handleWeChatLogin"></span>
                <span class="iconfont icon-QQ" @click="handleQQLogin"></span>
            </div>
            <p class="agreement">
                注册即表示同意
                <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // 引入 useRouter 函数
import { userRegister } from '@/api/index.js'; // 引入注册 API
import { ElMessage } from 'element-plus'; // 引入 ElMessage

// 定义响应式数据，默认用户类型为学生
const userType = ref('student');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const verifyCode = ref('');

const router = useRouter(); // 获取路由实例

// 定义获取验证码的方法
const getVerifyCode = () => {
    console.log('点击获取验证码，手机号:', phone.value);
    // 这里可以添加实际调用获取验证码 API 的逻辑
};

// 定义注册方法
const handleRegister = async () => {
    if (password.value !== confirmPassword.value) {
        ElMessage.error('两次输入的密码不一致');
        return;
    }
    if (!phone.value || !password.value || !verifyCode.value) {
        ElMessage.error('手机号、密码或验证码不能为空');
        return;
    }
    const user_id = Date.now().toString(); // 简单生成一个用户ID
    const res = await userRegister({
        user_id,
        username: phone.value, // 使用手机号作为用户名
        password: password.value,
        phone_number: phone.value,
        user_type: userType.value,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    if (res.code === 200) {
        ElMessage.success('注册成功');
        // 跳转到 Home 页面
        router.push('/home');
    } else {
        ElMessage.error(res.msg || '注册失败');
    }
};

// 定义返回登录页的方法
const handleBackToLogin = () => {
    router.push('/login'); // 假设登录页的路由路径是 /login
};

// 定义第三方登录方法
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
        padding: 15px 24px;
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

.verify-code {
    display: flex;

    input {
        flex: 1;
    }

    .get-code-btn {
        height: 44px;
        padding: 10px 10px;
        font-size: 14px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-left: 10px;
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
    margin-top: 20px;
    margin-bottom: 10px;
}

.back-to-login {
    font-size: 14px;
    text-align: center;
    color: #2196F3;
    cursor: pointer;
    // margin-bottom: 20px;
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