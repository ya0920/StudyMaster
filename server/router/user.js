const Router = require('koa-router');
const router = new Router();
const { userLogin, userRegister, resetPassword } = require('../controllers/index.js');
const { sign } = require('../utils/jwt.js');
router.prefix('/user');

// 修改登录接口参数映射
router.post('/login', async (ctx, next) => {
  const { phone, password, role } = ctx.request.body; // 修改参数名为数据库字段

  try {
    const res = await userLogin(phone, password, role); // 修改入参顺序

    if (res.length) {
      if (res[0].role === role) {  // 修改字段为role
        const data = {
          id: res[0].id,          // 使用自增主键id
          phone: res[0].phone,    // 保持与数据库字段一致
          role: res[0].role,
          name: res[0].name       // 新增姓名字段
        };
        const token = sign({
          id: res[0].id,
          phone: res[0].phone     // 使用数据库phone字段
        });

        ctx.body = {
          code: 200,
          data: data,
          token: token,
          msg: '登录成功'
        };
      } else {
        ctx.body = {
          code: 500,
          msg: '账号类型错误'
        };
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '账号或密码错误'
      };
    }
  } catch (error) {
    ctx.body = {
      code: 500,
      data: error,
      msg: '服务器异常'
    };
  }
});

// 修改重置密码接口 - 使用 controllers 中的函数
router.post('/resetPassword', async (ctx, next) => {
  try {
    const { phone, password } = ctx.request.body;
    const result = await resetPassword(phone, password);
    ctx.body = result;
  } catch (error) {
    console.error('重置密码失败:', error);
    ctx.body = {
      code: 500,
      message: '重置密码失败',
      error: error.message
    };
  }
});

// 注册接口
router.post('/register', userRegister);

module.exports = router;