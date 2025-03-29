const aiService = require('../services/aiService');

// 提取题目的学科和知识点
async function extractInfo(ctx) {
  try {
    const { question } = ctx.request.body;
    if (!question) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '缺少题目内容' };
      return;
    }

    const result = await aiService.extractSubjectAndKnowledge(question);
    
    ctx.body = {
      code: 200,
      data: result
    };
  } catch (err) {
    console.error('AI提取信息错误:', err);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: 'AI提取信息失败',
      error: err.message
    };
  }
}

// 生成题目解析
async function generateAnalysis(ctx) {
  try {
    const { question } = ctx.request.body;
    if (!question) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '缺少题目内容' };
      return;
    }

    const analysis = await aiService.generateAnalysis(question);
    
    ctx.body = {
      code: 200,
      data: {
        analysis
      }
    };
  } catch (err) {
    console.error('AI解析错误:', err);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: 'AI解析失败',
      error: err.message
    };
  }
}

// 生成题目答案
async function generateAnswer(ctx) {
  try {
    const { question } = ctx.request.body;
    if (!question) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '缺少题目内容' };
      return;
    }

    const answer = await aiService.generateAnswer(question);
    
    ctx.body = {
      code: 200,
      data: {
        answer
      }
    };
  } catch (err) {
    console.error('AI生成答案错误:', err);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: 'AI生成答案失败',
      error: err.message
    };
  }
}

// 一次性获取完整题目信息
async function getCompleteInfo(ctx) {
  try {
    const { question } = ctx.request.body;
    if (!question) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '缺少题目内容' };
      return;
    }

    const completeInfo = await aiService.getCompleteInfo(question);
    
    ctx.body = {
      code: 200,
      data: completeInfo
    };
  } catch (err) {
    console.error('AI分析错误:', err);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: 'AI分析失败',
      error: err.message
    };
  }
}

// 获取已完成的复习日期
const getCompletedDates = async (ctx) => {
  try {
    const { studentId } = ctx.query;
    
    // 验证参数
    if (!studentId) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '学生ID不能为空'
      };
      return;
    }
    
    // 查询所有任务日期及其完成状态
    const sql = `
      SELECT 
        assignment_date,
        COUNT(*) AS total_tasks,
        SUM(is_completed = 1) AS completed_tasks
      FROM daily_review_tasks 
      WHERE student_id = ? 
      GROUP BY assignment_date
    `;
    
    const result = await query(sql, [studentId]);
    
    // 提取完全完成的日期
    const completedDates = result
      .filter(day => day.total_tasks > 0 && day.total_tasks === day.completed_tasks)
      .map(day => {
        // 确保日期格式为YYYY-MM-DD
        const date = new Date(day.assignment_date);
        return date.toISOString().split('T')[0];
      });
    
    console.log('找到已完成日期:', completedDates);
    
    ctx.body = {
      code: 200,
      data: completedDates,
      message: '获取已完成日期成功'
    };
  } catch (error) {
    console.error('获取已完成日期失败:', error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '获取已完成日期失败',
      error: error.message
    };
  }
};

module.exports = {
  extractInfo,
  generateAnalysis,
  generateAnswer,
  getCompleteInfo,
  getCompletedDates
};