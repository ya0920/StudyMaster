const Router = require('koa-router');
const { getErrorTypes } = require('../controllers/index.js');

const errorTypeRouter = new Router();

// 定义 /api/error_types 接口
errorTypeRouter.get('/api/error_types', getErrorTypes);

module.exports = errorTypeRouter;