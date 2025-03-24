const Router = require('koa-router');
const { saveWrongQuestion, getRecentWrongQuestions, getWeeklyWrongQuestions, getLastWeekWrongQuestions, getSubjectDistribution, deleteWrongQuestion } = require('../controllers/index.js');

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

// 添加删除错题路由
wrongQuestionRouter.delete('/api/wrongQuestion/:id', deleteWrongQuestion);

module.exports = wrongQuestionRouter;