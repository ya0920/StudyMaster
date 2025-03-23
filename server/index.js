const Koa = require('koa');
const app = new Koa();
const cors = require('@koa/cors');
const { koaBody } = require('koa-body');
const useRouters = require('./router/index.js');

app.use(cors())

// 使用koaBody中间件处理请求体和文件上传
app.use(koaBody({
  multipart: true, // 开启文件上传
  formidable: {
    maxFileSize: 200*1024*1024, // 设置上传文件大小限制，默认2M
    keepExtensions: true // 保持文件扩展名
  }
}));

// 注册所有路由
useRouters(app);

app.listen(3000, () => {
  console.log('server is running at port 3000');
});
