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
        <h2>题目内容</h2>
        <div class="question-content" v-html="formattedQuestionContent"></div>
        <div class="answers">
          <div class="standard-answer">
            <span>标准答案：</span> 
            <div v-if="answerLoading" class="loading-inline">
              <van-loading type="spinner" size="14px" />
              <span class="loading-text">生成中...</span>
            </div>
            <template v-else-if="standardAnswer">
              {{ standardAnswer }}
            </template>
            <template v-else-if="answerError">
              <span class="error-text">{{ answerError }}</span>
              <van-button size="mini" type="default" class="retry-btn" @click="generateAnswer">
                重试
              </van-button>
            </template>
            <template v-else>
              <span>暂无标准答案</span>
              <van-button size="mini" type="default" class="retry-btn" @click="generateAnswer">
                生成答案
              </van-button>
            </template>
          </div>
          <div class="your-answer">
            <span>你的答案：</span> {{ questionDetail.wrong_answer || '暂无记录' }}
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
              <div v-if="analysisLoading" class="loading-content">
                <van-loading type="spinner" color="#1989fa" />
                <span>正在生成解析，请耐心等待...</span>
                <span class="timeout-hint">复杂题目可能需要30-60秒</span>
              </div>
              <div v-else-if="standardAnalysis" v-html="formattedAnalysis"></div>
              <div v-else-if="analysisError" class="empty-content">
                <p class="error-message">{{ analysisError }}</p>
                <van-button size="small" type="primary" @click="generateAnalysis">
                  重新生成
                </van-button>
              </div>
              <div v-else class="empty-content">
                <p>暂无标准解答</p>
                <van-button size="small" type="primary" @click="generateAnalysis">
                  生成解析
                </van-button>
              </div>
            </div>
          </van-tab>
        </van-tabs>
      </div>
    </template>

    <!-- 底部部分 -->
    <div class="footer">
      <van-button type="primary" @click="addToReviewPlan">加入复习计划</van-button>
      <van-button type="default" @click="generateSimilarQuestions">生成同类题</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NavBar, Tab, Tabs, Button, Loading, showToast, showConfirmDialog } from 'vant';
import { 
  getWrongQuestionDetail,
  generateQuestionAnswer,
  generateQuestionAnalysis 
} from '@/api/index.js';

const route = useRoute();
const router = useRouter();
const questionId = route.params.id;
const activeTab = ref(0);

// 数据状态
const questionDetail = ref({});
const loading = ref(true);
const error = ref('');

// AI生成的内容
const standardAnswer = ref('');
const standardAnalysis = ref('');
const answerLoading = ref(false);
const analysisLoading = ref(false);

// 添加错误状态
const answerError = ref('');
const analysisError = ref('');

// 预处理题目内容函数
function preprocessContent(content) {
  if (!content) return '';
  
  let modified = content;
  
  // 匹配选项A.B.C.D.前添加换行
  modified = modified.replace(/([A-D]\.)/g, '<br>$1');
  
  // 匹配序号(1)(2)(3)前添加换行
  modified = modified.replace(/(\(\d+\))/g, '<br>$1');
  
  // 匹配序号1.2.3.前添加换行
  modified = modified.replace(/(\d+\.(?!\d))/g, '<br>$1');
  
  // 将换行符替换为HTML的换行标签
  modified = modified.replace(/\n/g, '<br>');
  
  // 避免开头的换行
  if (modified.startsWith('<br>')) {
    modified = modified.substring(4);
  }
  
  return modified;
}

// 格式化题目内容
const formattedQuestionContent = computed(() => {
  return preprocessContent(questionDetail.value.question_content);
});

// 格式化AI解析
const formattedAnalysis = computed(() => {
  if (!standardAnalysis.value) return '';
  return standardAnalysis.value.replace(/\n/g, '<br>');
});

// 获取错题详情
const fetchQuestionDetail = async () => {
  loading.value = true;
  error.value = '';

  try {
    const res = await getWrongQuestionDetail(questionId);

    if (res.code === 200) {
      questionDetail.value = res.data;
      
      // 获取题目内容后，自动生成标准答案
      generateAnswer();
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

// 修改生成标准答案方法
const generateAnswer = async () => {
  if (!questionDetail.value.question_content || answerLoading.value) return;
  
  answerLoading.value = true;
  answerError.value = ''; // 清除之前的错误
  
  try {
    const response = await generateQuestionAnswer(questionDetail.value.question_content);
    standardAnswer.value = response;
    console.log('生成答案成功:', response);
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

// 修改生成解析方法
const generateAnalysis = async () => {
  if (!questionDetail.value.question_content || analysisLoading.value) return;
  
  analysisLoading.value = true;
  analysisError.value = ''; // 清除之前的错误
  
  try {
    const response = await generateQuestionAnalysis(questionDetail.value.question_content);
    standardAnalysis.value = response;
    console.log('生成解析成功:', response);
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

// 页面加载时获取数据
onMounted(() => {
  fetchQuestionDetail();
});

const onClickLeft = () => {
  router.back();
};

// 添加到复习计划
const addToReviewPlan = async () => {
  showConfirmDialog({
    title: '加入复习计划',
    message: '是否将该错题加入复习计划？',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
  .then(async () => {
    try {
      // 这里可以调用API将错题加入复习计划
      // const res = await addToReviewPlanApi(questionId);
      showToast('已加入复习计划');
    } catch (error) {
      console.error('加入复习计划失败:', error);
      showToast('操作失败，请重试');
    }
  })
  .catch(() => {
    // 取消操作，不做任何处理
  });
};

const generateSimilarQuestions = () => {
  showToast('同类题生成功能开发中');
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
        
        span {
          font-weight: bold;
        }
      }

      .your-answer {
        font-size: 14px;
        color: #ff0000;
        
        span {
          font-weight: bold;
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
      
      .error-type-section, .knowledge-points {
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
  
  // 添加错误提示和重试按钮样式
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