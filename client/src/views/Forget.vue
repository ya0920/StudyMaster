<template>
    <div class="forgot-password-container">
        <div class="logo-head">
            <img src="@/assets/logo.png" alt="">
            <p>AI助力高效学习</p>
        </div>
        <div class="type-select">
            <h3>找回密码</h3>
        </div>
        <div class="input">
            <input type="text" v-model="phone" placeholder="请输入手机号" />
            <div class="verify-code">
                <input type="text" v-model="verifyCode" placeholder="请输入验证码" />
                <button class="get-code-btn" @click="getVerifyCode">获取验证码</button>
            </div>
            <input type="password" v-model="newPassword" placeholder="请设置新密码" />
            <input type="password" v-model="confirmNewPassword" placeholder="请确认新密码" />
        </div>
        <button class="reset-button" @click="handleResetPassword">修改</button>
        <span class="back-to-login" @click="handleBackToLogin">返回登录</span>
        <div class="login-footer">
            <div class="third-party-login">
                <span class="iconfont icon-weixin" @click="handleWeChatLogin"></span>
                <span class="iconfont icon-QQ" @click="handleQQLogin"></span>
            </div>
            <p class="agreement">
                操作即表示同意
                <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// 定义响应式数据
const phone = ref('');
const verifyCode = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const router = useRouter();

// 定义获取验证码的方法
const getVerifyCode = () => {
    console.log('点击获取验证码，手机号:', phone.value);
    // 这里可以添加实际调用获取验证码 API 的逻辑
};

// 定义重置密码方法
const handleResetPassword = () => {
    if (newPassword.value !== confirmNewPassword.value) {
        console.log('两次输入的新密码不一致');
        return;
    }
    console.log('重置密码信息：', {
        phone: phone.value,
        verifyCode: verifyCode.value,
        newPassword: newPassword.value,
    });
    // 这里可以添加实际调用重置密码 API 的逻辑
};

// 第三方登录方法
const handleWeChatLogin = () => {
    console.log('点击了微信登录');
};

const handleQQLogin = () => {
    console.log('点击了QQ登录');
};

// 定义返回登录页的方法
const handleBackToLogin = () => {
    router.push('/login');
};
</script>

<style lang="less" scoped>
.forgot-password-container {
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
    margin-bottom: 20px;

    h3 {
        text-align: center;
        font-size: 18px;
        color: #333;
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

.reset-button {
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