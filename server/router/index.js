// 所有路由生效
const userRouter = require('./user.js');
const ocrRouter = require('./ocrRoute.js');
const aiRouter = require('./aiRoute.js');
// 移除原有的 const { saveWrongQuestion } = require('../controllers/index.js');

const errorTypeRouter = require('./errorTypeRoute.js');
// 引入新的错题路由
const wrongQuestionRouter = require('./wrongQuestionRoute.js');

const routerArr = [userRouter, ocrRouter, aiRouter, errorTypeRouter, wrongQuestionRouter];

const useRouters = (app) => {
  routerArr.forEach(router => {
    app.use(
      router.routes(), // 路由中的回调会被触发
      router.allowedMethods()
    );
  });
};

module.exports = useRouters