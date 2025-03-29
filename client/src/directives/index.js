import copy from './copy';
import debounce from './debounce';
import longpress from './longpress';

// 以插件形式注册全部指令
export default {
  install(app) {
    app.directive('copy', copy);
    app.directive('debounce', debounce);
    app.directive('longpress', longpress);
  }
};

// 也可以单独导出指令，按需引入
export { copy, debounce, longpress };