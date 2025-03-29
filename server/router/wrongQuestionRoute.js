const Router = require('koa-router');
const { saveWrongQuestion, getRecentWrongQuestions, getWeeklyWrongQuestions, getLastWeekWrongQuestions, getSubjectDistribution, deleteWrongQuestion,getWrongQuestionDetail, updateQuestionAI, getMasteryRate} = require('../controllers/index.js');

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
// 获取错题详情路由
wrongQuestionRouter.get('/api/wrongQuestion/:id', getWrongQuestionDetail);
// 更新错题的AI解析和解答
wrongQuestionRouter.put('/api/wrongQuestion/:id/ai-content', updateQuestionAI);
// 获取学生掌握度
wrongQuestionRouter.get('/api/masteryRate', getMasteryRate);

module.exports = wrongQuestionRouter;