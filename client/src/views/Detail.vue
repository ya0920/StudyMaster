<template>
  <div class="wrong-question-detail">
    <!-- 头部部分 -->
    <van-nav-bar title="错题详情" left-arrow @click-left="onClickLeft" />

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#1989fa" />
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <van-button type="primary" @click="fetchQuestionDetail">重试</van-button>
    </div>

    <template v-else>
      <!-- 问题部分 -->
      <div class="question-section card">
        <h2>题目内容 
          <span class="copy-icon" v-copy:已复制题目="questionDetail.question_content">
            <van-icon name="description" size="16" />复制
          </span>
        </h2>
        <div class="question-content" v-html="formattedQuestionContent"></div>
        <div class="answers">
          <div class="standard-answer">
            <span class="label">标准答案：</span>
            <!-- 加载状态 -->
            <template v-if="answerLoading">
              <div class="loading-inline">
                <van-loading type="spinner" size="14px" color="#1989fa" />
                <span class="loading-text">生成中...</span>
              </div>
            </template>
            <!-- 显示答案状态 -->
            <template v-else-if="standardAnswer && showStandardAnswer">
              <span class="answer-content">{{ standardAnswer }}</span>
              <van-button size="mini" plain type="primary" class="toggle-btn" @click="toggleStandardAnswer">
                隐藏答案
              </van-button>
            </template>
            <!-- 有答案但隐藏状态 -->
            <template v-else-if="standardAnswer">
              <van-button size="mini" type="primary" class="generate-btn" @click="toggleStandardAnswer">
                查看答案
              </van-button>
            </template>
            <!-- 错误状态 -->
            <template v-else-if="answerError">
              <span class="error-text">{{ answerError }}</span>
              <van-button size="mini" type="default" class="retry-btn" @click="generateAnswer">
                重试
              </van-button>
            </template>
            <!-- 无答案状态 -->
            <template v-else>
              <van-button size="mini" type="primary" class="generate-btn" @click="generateAnswer">
                生成答案
              </van-button>
            </template>
          </div>

          <div class="your-answer">
            <span class="label">你的答案：</span>
            <template v-if="showYourAnswer">
              <span class="answer-content">{{ questionDetail.wrong_answer || '暂无记录' }}</span>
              <van-button size="mini" plain type="primary" class="toggle-btn" @click="toggleYourAnswer">
                隐藏答案
              </van-button>
            </template>
            <template v-else>
              <van-button size="mini" type="primary" class="generate-btn" @click="toggleYourAnswer">
                查看答案
              </van-button>
            </template>
          </div>
        </div>
      </div>

      <!-- 标签页解释部分 -->
      <div class="explanation-section card">
        <h2>解析思路提示</h2>
        <van-tabs v-model:active="activeTab" line-width="20px" line-height="3px">
          <van-tab title="错题标签">
            <div class="tab-content">
              <!-- 错误类型 -->
              <div class="error-type-section">
                <h3>错误类型</h3>
                <div class="error-type-tag">
                  {{ questionDetail.errorType || '未分类错误' }}
                </div>
              </div>

              <!-- 分隔线 -->
              <div class="divider"></div>

              <!-- 知识点提醒部分 -->
              <div class="knowledge-points">
                <h3>知识点提醒</h3>
                <div class="knowledge-tag">
                  {{ questionDetail.knowledgePoint || '未知知识点' }}
                </div>
              </div>
            </div>
          </van-tab>
          <van-tab title="标准解答">
            <div class="tab-content">
              <!-- 加载中状态 -->
              <div v-if="analysisLoading" class="loading-content">
                <van-loading type="spinner" color="#1989fa" />
                <span>正在生成解析，请耐心等待...</span>
                <span class="timeout-hint">复杂题目可能需要2-3分钟</span>
              </div>
              <!-- Markdown 渲染内容添加复制功能 -->
              <div v-else-if="standardAnalysis" class="markdown-content-wrapper">
                <div class="copy-btn" v-copy:已复制解析内容="standardAnalysis">
                  <van-icon name="description" />复制全文
                </div>
                <div class="markdown-content" v-html="formattedAnalysis"></div>
              </div>
              <!-- 错误状态 -->
              <div v-else-if="analysisError" class="empty-content">
                <p class="error-message">{{ analysisError }}</p>
                <van-button size="small" type="primary" @click="generateAnalysis">重新生成</van-button>
              </div>
              <!-- 无内容状态 -->
              <div v-else class="empty-content">
                <p>暂无标准解答</p>
                <van-button size="small" type="primary" @click="generateAnalysis">生成解析</van-button>
              </div>
            </div>
          </van-tab>
        </van-tabs>
      </div>
    </template>

    <!-- 底部部分 -->
    <div class="footer">
      <van-button type="primary" @click="handleAddToReviewPlan">加入复习计划</van-button>
      <van-button type="default" @click="generateSimilarQuestions">生成同类题</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NavBar, Tab, Tabs, Button, Loading, showToast, showConfirmDialog } from 'vant';
import MarkdownIt from 'markdown-it';
import katex from 'katex';  // 添加这一行
import 'katex/dist/katex.min.css';  // 添加这一行
import {
  getWrongQuestionDetail,
  generateQuestionAnswer,
  generateQuestionAnalysis,
  addToReviewPlan,
  updateWrongQuestionAI
} from '@/api/index.js';

// 检测文本是否包含数学公式
function containsMath(text) {
  return /\$.*?\$/g.test(text) || /\$\$.*?\$\$/g.test(text) || /\\begin{array}/.test(text);
}

// 使用KaTeX渲染数学公式
function renderMath(text) {
  try {
    return katex.renderToString(text, {
      throwOnError: false,
      displayMode: text.includes('\\begin{array}') || (text.startsWith('$$') && text.endsWith('$$'))
    });
  } catch (err) {
    console.error('公式渲染失败:', err);
    return text;
  }
}

// 配置 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

const route = useRoute();
const router = useRouter();
const questionId = route.params.id;
const activeTab = ref(0);

// 数据状态
const questionDetail = ref({});
const loading = ref(true);
const error = ref('');
const standardAnswer = ref('');
const standardAnalysis = ref('');
const answerLoading = ref(false);
const analysisLoading = ref(false);
const answerError = ref('');
const analysisError = ref('');

// 控制答案显示状态
const showYourAnswer = ref(false);
const showStandardAnswer = ref(false); // 添加此变量控制标准答案显示

const toggleYourAnswer = () => {
  showYourAnswer.value = !showYourAnswer.value;
};

// 修改后的函数
const toggleStandardAnswer = async () => {
  // 如果已经有答案，直接切换显示/隐藏状态
  if (standardAnswer.value) {
    showStandardAnswer.value = !showStandardAnswer.value;
    return;
  }

  // 如果没有答案，生成答案
  if (!standardAnswer.value) {
    try {
      // 设置加载状态
      answerLoading.value = true;
      // 清除之前的错误
      answerError.value = '';

      // 生成答案
      const response = await generateQuestionAnswer(questionDetail.value.question_content);
      standardAnswer.value = response;

      // 保存到数据库
      await saveAIContentToDatabase();

      // 生成成功后显示答案
      showStandardAnswer.value = true;
    } catch (err) {
      console.error('生成标准答案失败:', err);

      // 根据错误类型提供不同的错误信息
      answerError.value = err.message?.includes('timeout')
        ? '生成超时，请重试'
        : '生成答案失败，请重试';
    } finally {
      // 无论成功失败，都关闭加载状态
      answerLoading.value = false;
    }
  }
};

// 预处理题目内容函数
function preprocessContent(content) {
  if (!content) return '';
  let modified = content;
  modified = modified.replace(/([A-D]\.)/g, '<br>$1');
  modified = modified.replace(/(\(\d+\))/g, '<br>$1');
  modified = modified.replace(/(\d+\.(?!\d))/g, '<br>$1');
  modified = modified.replace(/\n/g, '<br>');
  if (modified.startsWith('<br>')) {
    modified = modified.substring(4);
  }
  return modified;
}

// 格式化题目内容
const formattedQuestionContent = computed(() => {
  if (!questionDetail.value.question_content) return '';
  
  // 使用预处理函数处理内容
  let content = preprocessContent(questionDetail.value.question_content);
  
  // 检查是否包含数学公式
  if (containsMath(content)) {
    // 将<br>替换回换行符以便处理
    content = content.replace(/<br>/g, '\n');
    
    // 按行分割，处理每行内容
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
      if (containsMath(line)) {
        return renderMath(line);
      }
      return line;
    });
    
    // 重新组合并再次添加<br>标签
    return processedLines.join('<br>');
  }
  
  return content;
});

// 格式化解析内容，支持数学公式渲染
const formattedAnalysis = computed(() => {
  if (!standardAnalysis.value) return '';
  
  // 清理可能的代码块标记
  let content = standardAnalysis.value;
  content = content.replace(/^```(markdown)?\n/, '').replace(/\n```$/, '');
  
  // 处理markdown中的数学公式
  // 首先使用markdown-it渲染内容
  let renderedContent = md.render(content);
  
  // 查找所有可能包含数学公式的段落
  const mathRegex = /<p>.*?(\$.*?\$|\$\$.*?\$\$|\\begin{array}).*?<\/p>/g;
  renderedContent = renderedContent.replace(mathRegex, (match) => {
    // 提取<p>标签中的内容
    const innerContent = match.replace(/<p>(.*?)<\/p>/, '$1');
    if (containsMath(innerContent)) {
      try {
        // 将HTML实体转换回原始字符
        const decodedContent = innerContent
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&');
        
        // 尝试渲染数学公式
        const renderedMath = renderMath(decodedContent);
        return `<p>${renderedMath}</p>`;
      } catch (err) {
        console.error('解析中的公式渲染失败:', err);
        return match; // 如果渲染失败则返回原始内容
      }
    }
    return match;
  });
  
  return renderedContent;
});

// 获取错题详情
const fetchQuestionDetail = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getWrongQuestionDetail(questionId);
    if (res.code === 200) {
      questionDetail.value = res.data;
      if (res.data.ai_solution) standardAnswer.value = res.data.ai_solution;
      if (res.data.ai_analysis) standardAnalysis.value = res.data.ai_analysis;
    } else {
      error.value = res.message || '获取错题详情失败';
    }
  } catch (err) {
    console.error('获取错题详情出错:', err);
    error.value = '获取错题详情失败，请重试';
  } finally {
    loading.value = false;
  }
};

// 简化的生成标准答案方法
// 改进后的生成标准答案方法
const generateAnswer = async () => {
  if (!questionDetail.value.question_content || answerLoading.value) return;

  // 重置状态
  answerLoading.value = true;
  answerError.value = '';

  try {
    // 直接使用题目内容获取答案，简化请求
    const response = await generateQuestionAnswer(questionDetail.value.question_content);
    standardAnswer.value = response;
    console.log('生成答案成功:', response);

    // 异步保存数据库，不阻塞用户操作
    setTimeout(() => {
      saveAIContentToDatabase().catch(err => {
        console.error('保存答案到数据库失败:', err);
      });
    }, 100);

    // 生成成功后显示答案
    showStandardAnswer.value = true;
  } catch (err) {
    console.error('生成标准答案失败:', err);

    // 根据错误类型提供不同的错误信息
    if (err.message && err.message.includes('timeout')) {
      answerError.value = '生成超时，请重试';
    } else if (err.response && err.response.data) {
      answerError.value = err.response.data.message || '生成失败';
    } else {
      answerError.value = '生成答案失败，请重试';
    }
  } finally {
    answerLoading.value = false;
  }
};

// 生成解析
// 改进后的生成解析方法
const generateAnalysis = async () => {
  if (!questionDetail.value.question_content || analysisLoading.value) return;

  analysisLoading.value = true;
  analysisError.value = '';

  try {
    // 直接使用题目内容获取解析，简化请求
    const response = await generateQuestionAnalysis(questionDetail.value.question_content);
    standardAnalysis.value = response;
    console.log('生成解析成功:', response);

    // 异步保存数据库，不阻塞用户操作
    setTimeout(() => {
      saveAIContentToDatabase().catch(err => {
        console.error('保存解析到数据库失败:', err);
      });
    }, 100);
  } catch (err) {
    console.error('生成解析失败:', err);

    // 根据错误类型提供不同的错误信息
    if (err.message && err.message.includes('timeout')) {
      analysisError.value = '解析生成超时，这可能是因为题目较复杂。您可以稍后重试。';
    } else if (err.response && err.response.data) {
      analysisError.value = err.response.data.message || '生成失败';
    } else {
      analysisError.value = '生成解析失败，请重试';
    }
  } finally {
    analysisLoading.value = false;
  }
};

// 保存 AI 内容到数据库
const saveAIContentToDatabase = async () => {
  if (!standardAnswer.value && !standardAnalysis.value) return;
  try {
    await updateWrongQuestionAI(
      questionId,
      standardAnswer.value || null,
      standardAnalysis.value || null
    );
    console.log('AI解析和答案已保存到数据库');
  } catch (error) {
    console.error('保存AI内容失败:', error);
  }
};

const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 加入复习计划
const handleAddToReviewPlan = async () => {
  showConfirmDialog({
    title: '加入复习计划',
    message: '是否将该错题加入今天的复习计划？',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo?.id) {
          showToast('用户信息异常，请重新登录');
          router.push('/login');
          return;
        }
        loading.value = true;
        const today = getLocalToday();
        const res = await addToReviewPlan({
          studentId: userInfo.id,
          questionId: questionId,
          date: today
        });
        if (res && res.code === 200) {
          showToast({
            message: res.message || '已加入复习计划',
            type: 'success'
          });
        } else {
          showToast(res?.message || '操作失败');
        }
      } catch (error) {
        console.error('加入复习计划失败:', error);
        showToast(error.message || '操作失败，请重试');
      } finally {
        loading.value = false;
      }
    })
    .catch(() => { });
};

const generateSimilarQuestions = () => {
  showToast('同类题生成功能开发中');
};

onMounted(() => {
  console.log('Detail组件已挂载，获取错题ID:', questionId);
  fetchQuestionDetail();
});

const onClickLeft = () => {
  router.back();
};
</script>

<style lang="less">
.wrong-question-detail {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 60px;

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 70vh;
    gap: 20px;
  }

  .loading-inline {
    display: inline-flex;
    align-items: center;
    margin-left: 5px;

    .loading-text {
      margin-left: 5px;
      font-size: 14px;
      color: #999;
    }
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 0;
    gap: 10px;

    span {
      color: #666;
      font-size: 14px;
    }
  }

  .card {
    background-color: #fff;
    margin: 10px;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .question-section {
    h2 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;

      .copy-icon {
        display: inline-flex;
        align-items: center;
        margin-left: 10px;
        font-size: 14px;
        color: #1989fa;
        cursor: pointer;

        .van-icon {
          margin-right: 5px;
        }
      }
    }

    .question-content {
      font-size: 16px;
      margin-bottom: 15px;
      line-height: 1.6;

      br {
        display: block;
        content: "";
        margin-top: 8px;
      }

      .katex {
        font-size: 1.1em;
      }
      
      .katex-display {
        margin: 1em 0;
        overflow-x: auto;
        overflow-y: hidden;
        text-align: center;
      }
    }

    .answers {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;

      .standard-answer {
        font-size: 14px;
        color: #000;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .label {
          font-weight: bold;
          white-space: nowrap;
        }
      }

      .your-answer {
        font-size: 14px;
        color: #ff0000;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .label {
          font-weight: bold;
          white-space: nowrap;
        }

        .answer-content {
          color: #ff0000;
        }
      }
    }
  }

  .explanation-section {
    h2 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .van-tabs {
      .van-tab {
        font-size: 14px;
      }

      .van-tabs__line {
        background-color: #1989fa;
      }
    }

    .tab-content {
      font-size: 14px;
      color: #000;
      padding-top: 10px;
      max-width: 100%;
      overflow-x: hidden;

      ol {
        padding-left: 20px;
        margin-bottom: 15px;

        li {
          margin-bottom: 5px;
        }
      }

      .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px 0;
        gap: 15px;
        color: #999;
      }

      .error-type-section,
      .knowledge-points {
        margin-bottom: 15px;

        h3 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
      }

      .error-type-tag {
        display: inline-block;
        background-color: #ff7676;
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .knowledge-tag {
        display: inline-block;
        background-color: #4dabf7;
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 14px;
      }

      .divider {
        height: 1px;
        background-color: #e8e8e8;
        margin: 15px 0;
      }
    }

    .markdown-container {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .markdown-content-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .copy-btn {
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        color: #1989fa;
        cursor: pointer;

        .van-icon {
          margin-right: 5px;
        }
      }
    }

    .markdown-content {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      white-space: pre-wrap;

      p,
      li {
        margin-bottom: 1em;
        line-height: 1.6;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        max-width: 100%;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      pre {
        max-width: 100%;
        white-space: pre-wrap;
        overflow-x: auto;
        background-color: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        margin: 16px 0;
      }

      code:not(pre code) {
        padding: 2px 4px;
        background-color: #f0f0f0;
        border-radius: 3px;
        color: #d63384;
      }

      table {
        display: block;
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        border-collapse: collapse;
        margin: 16px 0;
      }

      th,
      td {
        border: 1px solid #ddd;
        padding: 8px;
        max-width: 300px;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      ul,
      ol {
        padding-left: 20px;
        margin-bottom: 1em;
      }

      blockquote {
        border-left: 4px solid #ddd;
        padding-left: 16px;
        color: #666;
        margin: 16px 0;
      }

      a {
        color: #1989fa;
        word-break: break-all;
      }

      .katex {
        font-size: 1.1em;
      }
      
      .katex-display {
        margin: 1em 0;
        overflow-x: auto;
        overflow-y: hidden;
        text-align: center;
      }
    }
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    padding: 10px;
    background-color: #fff;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);

    .van-button {
      width: 45%;
      border-radius: 8px;

      &--primary {
        background-color: #1989fa;
        border-color: #1989fa;
      }

      &--default {
        background-color: #fff;
        border: 1px solid #1989fa;
        color: #1989fa;
      }
    }
  }

  .error-text {
    color: #ff5252;
    font-size: 14px;
  }

  .retry-btn {
    margin-left: 8px;
    padding: 0 8px;
  }

  .error-message {
    color: #ff5252;
    margin-bottom: 10px;
  }

  .timeout-hint {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
  }
}
</style>
