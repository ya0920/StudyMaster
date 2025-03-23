const jwt = require('jsonwebtoken');

// 在文件顶部添加环境变量配置（需先安装dotenv）
require('dotenv').config();

function sign(option) {
    return jwt.sign(option, process.env.JWT_SECRET || 'your_fallback_secret_here', { expiresIn: 604800 }); // 7天 = 7*24*60*60
}

// 在verify中间件中添加
console.log('[JWT] 当前使用的密钥:', process.env.JWT_SECRET || '使用备用密钥');

// 解析token
// 修改后的verify中间件
function verify() {
    return async (ctx, next) => {
        const token = ctx.headers.authorization?.split(' ')[1];
        try {
            // 添加详细的调试日志
            console.log('[JWT] 原始Token:', token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[JWT] 解码结果:', decoded);
            
            ctx.state.user = { 
                id: decoded.id // 必须与数据库字段完全一致
            };
            await next();
        } catch (err) {
            console.error('[JWT] 验证失败:', err.message); // 输出具体错误类型
            ctx.status = 401;
            ctx.body = { code: 401, message: '无效的访问令牌' };
        }
    }
}

module.exports = {
    sign,
    verify
}