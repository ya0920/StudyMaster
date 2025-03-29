/**
 * 长按指令 v-longpress
 * 用法：<button v-longpress:800="handler">长按触发</button>
 * 
 * @param {Function} binding.value - 长按后执行的函数
 * @param {Number} binding.arg - 可选，长按触发时间(毫秒)，默认为 800ms
 * @param {Object} binding.modifiers - 可选修饰符
 * @param {Boolean} binding.modifiers.prevent - 是否阻止默认事件
 */
export default {
    mounted(el, binding) {
      // 长按时间，默认 800ms
      const longpressTime = parseInt(binding.arg) || 800;
      
      // 存储定时器
      let pressTimer = null;
      
      // 阻止默认事件
      const isPreventDefault = binding.modifiers.prevent;
      
      // 添加移动标记，避免滑动触发长按
      let moved = false;
      
      // 触摸开始事件处理函数
      const start = (e) => {
        if (isPreventDefault) {
          e.preventDefault();
        }
        
        // 如果是鼠标事件，且不是左键，则忽略
        if (e.button && e.button !== 0) return;
        
        // 防止重复触发
        if (pressTimer === null) {
          moved = false;
          pressTimer = setTimeout(() => {
            // 只有未移动时才触发
            if (!moved) {
              binding.value(e);
            }
            pressTimer = null;
          }, longpressTime);
        }
      };
      
      // 移动事件处理函数
      const move = () => {
        // 标记已经移动
        moved = true;
        cancel();
      };
      
      // 取消长按
      const cancel = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };
      
      // 绑定事件
      // 移动端触摸事件
      el.addEventListener('touchstart', start, { passive: !isPreventDefault });
      el.addEventListener('touchmove', move);
      el.addEventListener('touchend', cancel);
      el.addEventListener('touchcancel', cancel);
      
      // PC端鼠标事件
      el.addEventListener('mousedown', start);
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseup', cancel);
      el.addEventListener('mouseleave', cancel);
    },
    
    // 当指令与元素解绑时
    unmounted(el) {
      // 清除绑定的事件
      el.removeEventListener('touchstart', el.start);
      el.removeEventListener('touchmove', el.move);
      el.removeEventListener('touchend', el.cancel);
      el.removeEventListener('touchcancel', el.cancel);
      el.removeEventListener('mousedown', el.start);
      el.removeEventListener('mousemove', el.move);
      el.removeEventListener('mouseup', el.cancel);
      el.removeEventListener('mouseleave', el.cancel);
    }
  };