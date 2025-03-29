// 所有路由生效
const userRouter = require('./user.js')
const ocrRouter = require('./ocrRoute.js')
const wrongQuestionRouter = require('./wrongQuestionRoute.js') 
const aiRouter = require('./aiRoute.js') 
const errorTypeRouter = require('./errorTypeRoute.js')
const reviewTaskRouter = require('./reviewTaskRoute.js') // 直接在主路由文件中导入

const routerArr = [userRouter, ocrRouter, wrongQuestionRouter, aiRouter, errorTypeRouter, reviewTaskRouter] // 添加到数组中

const useRouters = (app) => {
  routerArr.forEach(router => {
    app.use(
      router.routes(),
      router.allowedMethods()
    )
  })
}

module.exports = useRouters