const Router = require('koa-router');
const { saveWrongQuestion, getRecentWrongQuestions, getWeeklyWrongQuestions, getLastWeekWrongQuestions, getSubjectDistribution } = require('../controllers/index.js');

const wrongQuestionRouter = new Router();

// 保存错题路由
wrongQuestionRouter.post('/api/saveWrongQuestion', saveWrongQuestion);
// 获取最近错题路由
wrongQuestionRouter.get('/api/recentWrongQuestions', getRecentWrongQuestions);
// 获取错题统计路由
wrongQuestionRouter.get('/api/getWeeklyWrongQuestions', getWeeklyWrongQuestions);
// 新增获取上周错题路由
wrongQuestionRouter.get('/api/getLastWeekWrongQuestions', getLastWeekWrongQuestions);
// 获取各学科错题数量统计路由
wrongQuestionRouter.get('/api/getSubjectDistribution', getSubjectDistribution);


module.exports = wrongQuestionRouter;