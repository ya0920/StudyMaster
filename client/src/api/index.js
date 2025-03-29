import axios from './axios.js';
import { ElMessage } from 'element-plus';

// 登录
export const userLogin = async (params) => {
  return await axios.post('/user/login', params);
};

// 注册
export const userRegister = async (params) => {
  return axios.post('/user/register', params); // 修改为 /user/register
};

// 调用后端的 OCR API 接口
export const ocrRecognize = async (base64Image) => {
  try {
    const { data } = await axios.post('/api/ocr/recognize', {
      image: base64Image // 参数名与后端一致
    })
    return data
  } catch (error) {
    throw new Error(error.response?.data?.message || '识别服务异常')
  }
}

// 上传图片文件获取OCR结果
export const uploadImageForOCR = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await axios.post('/api/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('完整响应数据:', res);
    
    if (res.code === 200 && res.data) {
      let dataField = res.data.Data;
      let content = '';
      
      if (typeof dataField === 'string') {
        try {
          const parsed = JSON.parse(dataField);
          content = parsed.content || '';
        } catch (e) {
          console.warn('解析 Data 字符串失败', e);
          content = dataField.content || '';
        }
      } else if (typeof dataField === 'object') {
        content = dataField.content || '';
      } else if (res.data.content) {
        content = res.data.content;
      } else {
        throw new Error('返回数据结构不符合预期');
      }
      
      return content;
    } else {
      throw new Error('返回数据结构不符合预期');
    }
  } catch (err) {
    console.error('OCR 识别失败:', err);
    throw err;
  }
};

// 使用AI分析题目，提取学科和知识点
export const extractSubjectAndKnowledge = async (questionContent) => {
  try {
    const res = await axios.post('/api/ai/extract-info', {
      question: questionContent
    });
    
    if (res.code === 200 && res.data) {
      return res.data;
    } else {
      throw new Error('AI提取信息返回数据结构不符合预期');
    }
  } catch (err) {
    console.error('AI提取信息失败:', err);
    throw err;
  }
};

// 使用AI生成题目解析(增加超时处理)
export const generateQuestionAnalysis = async (questionContent) => {
  try {
    console.log('开始请求解析，题目内容:', questionContent.substring(0, 50) + '...');
    
    const res = await axios.post('/api/ai/analysis', {
      question: questionContent
    }, { 
      timeout: 180000 // 客户端也设置3分钟超时
    });
    
    if (res.code === 200 && res.data) {
      return res.data.analysis;
    } else {
      throw new Error('AI解析返回数据结构不符合预期');
    }
  } catch (err) {
    console.error('AI解析失败详情:', err.response?.data || err.message);
    throw err;
  }
};

// 使用AI生成题目答案
export const generateQuestionAnswer = async (questionContent) => {
  try {
    const res = await axios.post('/api/ai/answer', {
      question: questionContent
    });
    
    if (res.code === 200 && res.data) {
      return res.data.answer;
    } else {
      throw new Error('AI答案返回数据结构不符合预期');
    }
  } catch (err) {
    console.error('AI生成答案失败:', err);
    throw err;
  }
};

// 一次性获取完整题目信息（学科、知识点、解析、答案）
export const getCompleteQuestionInfo = async (questionContent) => {
  try {
    const res = await axios.post('/api/ai/complete-info', {
      question: questionContent
    });
    
    if (res.code === 200 && res.data) {
      return res.data;
    } else {
      throw new Error('AI返回数据结构不符合预期');
    }
  } catch (err) {
    console.error('AI分析失败:', err);
    throw err;
  }
};

// 获取错误类型列表
export const getErrorTypes = async () => {
    try {
        const res = await axios.get('/api/error_types');
        // 修改校验逻辑，使其与实际响应结构匹配
        // console.log('完整响应数据:', res);
        
        if (res.code === 200 && res.data) {
            return res.data;
        } else {
            throw new Error('获取错误类型列表返回数据结构不符合预期');
        }
    } catch (err) {
        console.error('获取错误类型列表失败:', err);
        throw err;
    }
};

// 保存错题
export const saveWrongQuestion = async (params) => {
  try {
    const res = await axios.post('/api/saveWrongQuestion', params);
    return res; // ✅ 直接返回完整响应（axios拦截器已处理结构）
  } catch (err) {
    console.error('保存请求失败:', err.response?.data);
    throw new Error(err.response?.data?.message || '保存失败');
  }
};

// 获取最近错题API
export const getRecentWrongQuestions = (params) => {
    return axios.get('/api/recentWrongQuestions', { params });
};


// 获取本周错题统计（包括增长率）
export const getWeeklyWrongQuestions = async (params) => {
  try {
    const res = await axios.get('/api/getWeeklyWrongQuestions', { params }); // 修改路径
    return res;
  } catch (error) {
    console.error('获取本周错题统计失败:', error);
    return { code: 500, message: '获取数据失败' };
  }
};

// 获取上周错题统计
export const getLastWeekWrongQuestions = async (params) => {
  try {
    const res = await axios.get('/api/getLastWeekWrongQuestions', { params }); // 修改路径
    return res;
  } catch (error) {
    console.error('获取上周错题统计失败:', error);
    return { code: 500, message: '获取数据失败' };
  }
};

// 获取学科分布API
export const getSubjectDistribution = (params) => {
    return axios.get('/api/getSubjectDistribution', { params });
};

// 删除错题
export const deleteWrongQuestion = async (id) => {
  try {
    const res = await axios.delete(`/api/wrongQuestion/${id}`);
    return res;
  } catch (error) {
    console.error('删除错题失败:', error);
    throw error;
  }
};

// 获取错题详情
export const getWrongQuestionDetail = async (id) => {
  try {
    const res = await axios.get(`/api/wrongQuestion/${id}`);
    return res;
  } catch (error) {
    console.error('获取错题详情失败:', error);
    throw error;
  }
};

// 修改为清晰的参数结构
export const addToReviewPlan = async (params) => {
  try {
    const res = await axios.post('/api/reviewTask', params);
    return res;
  } catch (error) {
    console.error('添加复习计划失败:', error);
    throw error;
  }
};

// 获取复习任务
export const getReviewTasks = async (studentId, date) => {
  try {
    console.log('API调用getReviewTasks ->', {studentId, date});
    const res = await axios.get('/api/reviewTasks', {
      params: {
        studentId,
        date
      }
    });
    console.log('获取任务响应:', res);
    return res;
  } catch (error) {
    console.error('获取任务失败:', error);
    throw error;
  }
};

// 完成复习任务
export const completeReviewTask = async (taskId) => {
  try {
    const res = await axios.put(`/api/reviewTask/${taskId}/complete`);
    return res;
  } catch (error) {
    console.error('更新任务状态失败:', error);
    throw error;
  }
};

// 取消完成复习任务
export const uncompleteReviewTask = async (taskId) => {
  try {
    const res = await axios.put(`/api/reviewTask/${taskId}/uncomplete`);
    return res;
  } catch (error) {
    console.error('取消任务完成状态失败:', error);
    throw error;
  }
};

// 获取所有已完成日期
export const getCompletedDates = async (studentId) => {
  try {
    const res = await axios.get('/api/completedReviewDates', {
      params: { studentId }
    });
    return res; // 返回完整响应对象，而不是res.data
  } catch (error) {
    console.error('获取已完成日期失败:', error);
    throw error;
  }
};

// 重置密码
export const resetPassword = async (params) => {
  try {
    const res = await axios.post('/user/resetPassword', params);
    return res;
  } catch (error) {
    console.error('重置密码请求失败:', error);
    throw error;
  }
};

// 更新错题的AI解析和答案
export const updateWrongQuestionAI = async (questionId, aiSolution, aiAnalysis) => {
  try {
    const res = await axios.put(`/api/wrongQuestion/${questionId}/ai-content`, {
      aiSolution,
      aiAnalysis
    });
    return res;
  } catch (error) {
    console.error('更新错题AI内容失败:', error);
    throw error;
  }
};

// 获取学生掌握度
export const getMasteryRate = async (studentId) => {
  try {
    const res = await axios.get(`/api/masteryRate?studentId=${studentId}`);
    return res;
  } catch (err) {
    console.error('获取掌握度失败:', err);
    throw err;
  }
};