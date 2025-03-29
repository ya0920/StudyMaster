import { showToast } from 'vant';

/**
 * 复制文本指令 v-copy
 * 用法：<div v-copy="textToCopy">点击复制</div>
 * 
 * @param {string} binding.value - 要复制的文本内容
 * @param {string} binding.arg - 可选，自定义复制成功提示文案
 */
export default {
  // 当被绑定的元素挂载到 DOM 时调用
  mounted(el, binding) {
    el.copyData = binding.value;
    el.successMessage = binding.arg || '复制成功';
    el.handler = () => handleCopy(el);
    el.addEventListener('click', el.handler);
  },
  
  // 当指令的值更新时调用
  updated(el, binding) {
    el.copyData = binding.value;
    el.successMessage = binding.arg || '复制成功';
  },
  
  // 当被绑定的元素卸载时调用
  unmounted(el) {
    el.removeEventListener('click', el.handler);
  }
}

/**
 * 处理复制逻辑
 */
function handleCopy(el) {
  // 使用 Clipboard API (现代浏览器)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(el.copyData).then(() => {
      showToast(el.successMessage);
    }).catch(() => {
      // 如果 Clipboard API 失败，回退到传统方法
      legacyCopy(el);
    });
  } else {
    // 对于不支持 Clipboard API 或非安全上下文的情况使用传统方法
    legacyCopy(el);
  }
}

/**
 * 传统复制方法
 */
function legacyCopy(el) {
  const textarea = document.createElement('textarea');
  // 设置为不可见
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  
  // 设置值并添加到 DOM
  textarea.value = el.copyData;
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    const successful = document.execCommand('copy');
    const message = successful ? el.successMessage : '复制失败';
    showToast(message);
  } catch (err) {
    showToast('复制失败');
    console.error('无法复制内容:', err);
  } finally {
    document.body.removeChild(textarea);
  }
}