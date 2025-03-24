// 所有路由生效
const userRouter = require('./user.js')
const ocrRouter = require('./ocrRoute.js')
const wrongQuestionRouter = require('./wrongQuestionRoute.js') 
const aiRouter = require('./aiRoute.js') 
const errorTypeRouter = require('./errorTypeRoute.js') // 添加错误类型路由

const routerArr = [userRouter, ocrRouter, wrongQuestionRouter, aiRouter, errorTypeRouter] // 添加到数组中

const useRouters = (app) => {
  routerArr.forEach(router => {
    app.use(
      router.routes(),
      router.allowedMethods()
    )
  })
}

module.exports = useRouters