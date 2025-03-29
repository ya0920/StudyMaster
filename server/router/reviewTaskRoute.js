const Router = require('koa-router');
const { addToReviewPlan, getReviewTasks, completeReviewTask, getCompletedDates, uncompleteReviewTask } = require('../controllers/reviewTaskController');

const reviewTaskRouter = new Router();

// 添加错题到复习计划
reviewTaskRouter.post('/api/reviewTask', addToReviewPlan);

// 获取复习任务
reviewTaskRouter.get('/api/reviewTasks', getReviewTasks);

// 完成复习任务
reviewTaskRouter.put('/api/reviewTask/:taskId/complete', completeReviewTask);

// 取消完成任务
reviewTaskRouter.put('/api/reviewTask/:taskId/uncomplete', uncompleteReviewTask);

// 获取已完成日期
reviewTaskRouter.get('/api/completedReviewDates', getCompletedDates);

module.exports = reviewTaskRouter;