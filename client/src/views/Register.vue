<template>
    <div class="login-container">
        <div class="logo-head">
            <img src="@/assets/logo.png" alt="">
            <p>AI助力高效学习</p>
        </div>
        <div class="type-select">
            <el-radio-group v-model="userType" size="large">
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
                <!-- 替换原有按钮为自定义验证码组件 -->
                <div class="captcha-container">
                    <VerifyCode ref="verifyCodeRef" />
                </div>
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
import { useRouter } from 'vue-router';
import { userRegister } from '@/api/index.js';
import { ElMessage } from 'element-plus';
import md5 from 'md5';
import VerifyCode from '@/components/verifyCode.vue'; // 导入验证码组件

// 定义响应式数据，默认用户类型为学生
const userType = ref('student');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const verifyCode = ref('');
const verifyCodeRef = ref(null); // 引用验证码组件

const router = useRouter();

// 定义注册方法
const handleRegister = async () => {
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
    
    if (!password.value) {
        ElMessage.error('密码不能为空');
        return;
    }
    
    // 验证密码长度
    if (password.value.length < 6) {
        ElMessage.error('密码长度至少为6位');
        return;
    }
    
    // 验证两次密码是否一致
    if (password.value !== confirmPassword.value) {
        ElMessage.error('两次输入的密码不一致');
        return;
    }
    
    // 验证验证码是否正确
    if (!verifyCode.value) {
        ElMessage.error('验证码不能为空');
        return;
    }

    // 正确获取验证码值 - 这里是关键
    console.log('验证码组件引用:', verifyCodeRef.value);
    const generatedCode = verifyCodeRef.value?.verifyCode;

    // 调试信息
    console.log('生成的验证码:', generatedCode);
    console.log('用户输入的验证码:', verifyCode.value);

    // 进行不区分大小写的比较
    if (!generatedCode || verifyCode.value.toLowerCase() !== generatedCode.toLowerCase()) {
        ElMessage.error(`验证码错误！正确验证码: ${generatedCode}`);
        if (verifyCodeRef.value?.changeImgCode) {
            verifyCodeRef.value.changeImgCode();
        }
        return;
    }
    
    try {
        // 修改路径匹配后端API路由
        const res = await userRegister({
            phone: phone.value,
            password: md5(password.value),
            role: userType.value,
            name: `用户${phone.value.substring(7)}`
        });

        if (res.code === 200) {
            ElMessage.success('注册成功');
            router.push('/login');
        } else {
            ElMessage.error(res.message || '注册失败');
            if (verifyCodeRef.value?.changeImgCode) {
                verifyCodeRef.value.changeImgCode();
            }
        }
    } catch (error) {
        console.error('注册错误:', error);
        ElMessage.error('注册失败，请稍后重试');
        if (verifyCodeRef.value?.changeImgCode) {
            verifyCodeRef.value.changeImgCode();
        }
    }
};

// 定义返回登录页的方法
const handleBackToLogin = () => {
    router.push('/login');
};

// 定义第三方登录方法
const handleWeChatLogin = () => {
    ElMessage.info('微信登录功能开发中');
};

const handleQQLogin = () => {
    ElMessage.info('QQ登录功能开发中');
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

    .captcha-container {
        margin-left: 10px;
        cursor: pointer;
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