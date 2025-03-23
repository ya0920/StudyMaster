// ocrRoute.js
const Router = require('koa-router');
const Client = require('../services/ocrClient'); // 引入OCR客户端模块
const fs = require('fs');

const router = new Router();

router.post('/api/ocr', async (ctx) => {
  try {
    const file = ctx.request.files?.file; // 前端上传的文件需要设置 name="file"
    if (!file) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '未上传文件' };
      return;
    }

    // 此处 file.path 是临时文件存储路径（koa-body 自动保存的）
    // 从上传文件对象中获取路径，支持 file.path 或 file.filepath
    const filePath = file.path || file.filepath;
    if (!filePath) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '未能获取到上传文件路径' };
      return;
    }

    // 调用 OCR 识别
    const ocrResult = await Client.recognize(filePath);

    // 可选：删除临时文件
    fs.unlink(filePath, err => { if (err) console.error(err); });

    ctx.body = {
      code: 200,
      data: ocrResult,
    };
  } catch (err) {
    console.error('OCR 错误:', err);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: 'OCR 识别失败',
      error: err.message,
    };
  }
});

module.exports = router;
