<template>
  <div class="wrong-question-detail">
    <!-- 头部部分 -->
    <van-nav-bar title="错题详情" left-arrow @click-left="onClickLeft" />

    <!-- 问题部分 -->
    <div class="question-section card">
      <h2>题目内容</h2>
      <p>已知函数 f(x) = x² + bx + c (b, c 为常数)，若对任意实数 x，都 f(x) ≥ 2，且 f(1) = 2，求 b 和 c 的值。</p>
      <div class="answers">
        <div class="standard-answer">
          <span>标准答案：</span> b = -2, c = 3
        </div>
        <div class="your-answer">
          <span>你的答案：</span> b = 2, c = -1
        </div>
      </div>
    </div>

    <!-- 标签页解释部分 -->
    <div class="explanation-section card">
      <h2>解析思路提示</h2>
      <van-tabs v-model:active="activeTab" line-width="20px" line-height="3px">
        <van-tab title="错因分析">
          <div class="tab-content">
            <ol>
              <li>你在求解过程中未完全考虑抛物线 f(x) ≥ 2 这个条件的几何意义。</li>
              <li>函数图像是一个开口向上的抛物线，重点应为最小值为 2。</li>
              <li>当 x = 1 时 f(1) = 2 你两次求解抛物线的最低值点。</li>
            </ol>
            <div class="knowledge-points">
              <h3>知识点提醒</h3>
              <ol>
                <li>二次函数的最值问题</li>
                <li>二次函数图像的最值问题</li>
                <li>函数的定义域和值域</li>
              </ol>
            </div>
          </div>
        </van-tab>
        <van-tab title="标准解答">
          <div class="tab-content">
            <p>标准解答内容待补充。</p>
          </div>
        </van-tab>
        <van-tab title="拓展思路">
          <div class="tab-content">
            <p>拓展思路内容待补充。</p>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <!-- 底部部分 -->
    <div class="footer">
      <van-button type="primary" @click="addToReviewPlan">加入复习计划</van-button>
      <van-button type="default" @click="generateSimilarQuestions">生成同类题</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 添加 useRouter
import { NavBar, Tab, Tabs, Button } from 'vant';

const route = useRoute();
const router = useRouter(); // 初始化 router 对象
const questionId = route.params.id;
const activeTab = ref(0); // 添加丢失的 activeTab 变量

// 后续可以用questionId请求详细数据

const onClickLeft = () => {
  router.back();
};

const onClickRight = () => {
  console.log('点击了右侧菜单');
};

const addToReviewPlan = () => {
  console.log('加入复习计划');
};

const generateSimilarQuestions = () => {
  console.log('生成同类题');
};
</script>

<style lang="less">
.wrong-question-detail {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 60px;

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

    p {
      font-size: 16px;
      margin-bottom: 15px;
    }

    .answers {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .standard-answer {
        font-size: 14px;
        color: #000;
      }

      .your-answer {
        font-size: 14px;
        color: #ff0000;
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

      .knowledge-points {
        h3 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
        }
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
}
</style>