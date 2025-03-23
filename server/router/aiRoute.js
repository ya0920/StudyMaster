const Router = require('koa-router');
const router = new Router();
const aiController = require('../controllers/aiController');

// AI路由
router.post('/api/ai/extract-info', aiController.extractInfo);
router.post('/api/ai/analysis', aiController.generateAnalysis);
router.post('/api/ai/answer', aiController.generateAnswer);
router.post('/api/ai/complete-info', aiController.getCompleteInfo);

module.exports = router; 