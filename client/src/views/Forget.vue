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
                <!-- 替换为图形验证码组件 -->
                <div class="captcha-container">
                    <VerifyCode ref="verifyCodeRef" />
                </div>
            </div>
            <input type="password" v-model="newPassword" placeholder="请设置新密码" />
            <input type="password" v-model="confirmNewPassword" placeholder="请确认新密码" />
        </div>
        <!-- 重置密码按钮防抖 -->
        <button class="reset-button" v-debounce:800="handleResetPassword">修改</button>
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
import { ElMessage } from 'element-plus';
import md5 from 'md5';
import VerifyCode from '@/components/verifyCode.vue'; // 导入验证码组件
import { resetPassword } from '@/api/index.js'; // 假设此API存在，需要添加

// 定义响应式数据
const phone = ref('');
const verifyCode = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const verifyCodeRef = ref(null); // 引用验证码组件
const loading = ref(false); // 加载状态

const router = useRouter();

// 定义重置密码方法
const handleResetPassword = async () => {
    // 表单验证
    if (!phone.value) {
        ElMessage.error('手机号不能为空');
        return;
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone.value)) {
        ElMessage.error('请输入正确的手机号');
        return;
    }
    
    if (!verifyCode.value) {
        ElMessage.error('验证码不能为空');
        return;
    }
    
    // 正确获取验证码值
    const generatedCode = verifyCodeRef.value?.verifyCode;
    
    // 验证码不区分大小写比较
    if (!generatedCode || verifyCode.value.toLowerCase() !== generatedCode.toLowerCase()) {
        ElMessage.error('验证码错误');
        // 刷新验证码
        if (verifyCodeRef.value?.changeImgCode) {
            verifyCodeRef.value.changeImgCode();
        }
        return;
    }
    
    if (!newPassword.value) {
        ElMessage.error('新密码不能为空');
        return;
    }
    
    // 验证密码长度
    if (newPassword.value.length < 6) {
        ElMessage.error('密码长度至少为6位');
        return;
    }
    
    // 验证两次密码是否一致
    if (newPassword.value !== confirmNewPassword.value) {
        ElMessage.error('两次输入的密码不一致');
        return;
    }
    
    // 显示加载状态
    loading.value = true;
    
    try {
        // 调用重置密码API
        // 注意：您需要在API中添加此函数
        const res = await resetPassword({
            phone: phone.value,
            password: md5(newPassword.value)
        });
        
        if (res.code === 200) {
            ElMessage.success('密码重置成功');
            // 延迟跳转，给用户看提示信息的时间
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } else {
            ElMessage.error(res.message || '密码重置失败');
            // 刷新验证码
            if (verifyCodeRef.value?.changeImgCode) {
                verifyCodeRef.value.changeImgCode();
            }
        }
    } catch (error) {
        console.error('重置密码错误:', error);
        ElMessage.error('重置密码失败，请稍后重试');
        // 刷新验证码
        if (verifyCodeRef.value?.changeImgCode) {
            verifyCodeRef.value.changeImgCode();
        }
    } finally {
        // 恢复加载状态
        loading.value = false;
    }
};

// 定义第三方登录方法
const handleWeChatLogin = () => {
    ElMessage.info('微信登录功能开发中');
};

const handleQQLogin = () => {
    ElMessage.info('QQ登录功能开发中');
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

    .captcha-container {
        margin-left: 10px;
        cursor: pointer;
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
    position: relative;
    
    &:disabled {
        background-color: #a0cfff;
        cursor: not-allowed;
    }
}

.back-to-login {
    font-size: 14px;
    text-align: center;
    color: #2196F3;
    cursor: pointer;
    display: block;
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