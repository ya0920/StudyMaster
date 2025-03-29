/**
 * 防抖指令 v-debounce
 * 用法：<button v-debounce:300="handler">点击</button>
 * 
 * @param {Function} binding.value - 需要防抖处理的函数
 * @param {Number} binding.arg - 可选，防抖延迟时间(毫秒)，默认为 300ms
 * @param {Boolean} binding.modifiers.immediate - 可选，是否立即执行，默认为 false
 */
export default {
    mounted(el, binding) {
      // 获取防抖时间，默认300ms
      const delay = parseInt(binding.arg) || 300;
      let timer = null;
      
      // 是否立即执行
      const immediate = binding.modifiers.immediate;
      
      // 存储上次触发时间
      let lastInvokeTime = 0;
      
      el.handler = function(...args) {
        const currentTime = Date.now();
        const isFirstInvoke = immediate && lastInvokeTime === 0;
        
        // 清除现有的定时器
        if (timer) clearTimeout(timer);
        
        // 首次点击立即执行
        if (isFirstInvoke) {
          lastInvokeTime = currentTime;
          binding.value.apply(this, args);
          return;
        }
        
        // 设置新的定时器
        timer = setTimeout(() => {
          lastInvokeTime = currentTime;
          binding.value.apply(this, args);
        }, delay);
      };
      
      // 添加点击事件
      el.addEventListener('click', el.handler);
    },
    
    // 当被绑定的元素卸载时调用
    unmounted(el) {
      el.removeEventListener('click', el.handler);
    }
  };