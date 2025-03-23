const axios = require('axios');
require('dotenv').config();

// 阿里云百炼DeepSeek-R1模型调用 - 使用OpenAI兼容模式
async function callDeepSeekModel(prompt, temperature = 0.7) {
  try {
    console.log('正在调用百炼API，prompt:', prompt.substring(0, 100) + '...');
    
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', 
      {
        // 修改模型名称
        "model": "deepseek-r1",
        "messages": [
          { "role": "user", "content": prompt }
        ],
        "temperature": temperature
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BAILIAN_API_KEY}`
        },
        timeout: 60000
      }
    );
    
    console.log('API响应状态码:', response.status);
    
    // 根据示例格式获取输出内容
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const result = response.data.choices[0].message.content;
      // 记录返回的内容以便调试
      console.log('API返回内容:', result.substring(0, 100) + '...');
      return result;
    } else {
      console.error('API响应格式异常:', response.data);
      throw new Error('API响应格式异常');
    }
  } catch (error) {
    if (error.response) {
      console.error('API错误响应:', error.response.status, error.response.data);
    } else {
      console.error('API调用错误:', error.message);
    }
    throw error;
  }
}

// 提取题目的学科和知识点 - 改进提示
async function extractSubjectAndKnowledge(question) {
  const prompt = `
分析这道题目: "${question}"

请识别题目的学科和具体的知识点。

学科应为初高中的学科，如语文、数学、英语、物理、化学、生物、地理、历史、政治等。

知识点应为学科内的具体主题，尽量用十个字以内描述，如果这个知识点你以前描述过，就用之前的描述来描述这个知识点。

例如：

- 如果问题是“解方程2x + 3 = 7”，学科为数学，知识点为代数。

- 如果问题是“法国的首都是哪里？”，学科为地理，知识点为欧洲国家。

如果无法确定知识点，请说“未知”。

请按以下格式回答：

学科：[学科名称]

知识点：[知识点名称或“未知”]
`;

  try {
    const aiResponse = await callDeepSeekModel(prompt, 0.3);
    
    // 提取学科和知识点
    const subjectMatch = aiResponse.match(/学科[：:]\s*(.+?)(?:\n|$)/);
    const knowledgeMatch = aiResponse.match(/知识点[：:]\s*(.+?)(?:\n|$)/);
    
    // 构建返回对象
    const result = {
      subject: subjectMatch ? subjectMatch[1].trim() : '未知',
      knowledgePoint: knowledgeMatch ? knowledgeMatch[1].trim() : '未知'
    };
    
    console.log('提取结果:', result);
    return result;
  } catch (error) {
    console.error('知识点提取失败:', error);
    return { subject: '未知', knowledgePoint: '未知' };
  }
}

// 生成题目解析
async function generateAnalysis(question) {
  const prompt = `
请作为一位经验丰富的教师，针对以下题目提供详细的解题思路和分析。请特别注意解释关键概念、解题方法和可能的陷阱：

题目内容：${question}

请提供结构化的解析，包括：
1. 题目考查的核心知识点
2. 解题关键思路
3. 详细解析过程
4. 常见错误及避免方法;
`;

  return await callDeepSeekModel(prompt, 0.3);
}

// 生成题目答案
async function generateAnswer(question) {
  const prompt = `
请为以下题目提供准确、详细的答案和解题步骤：

题目内容：${question}

请按照以下结构组织答案：
1. 最终答案（明确给出答案结果）
2. 详细的解题步骤
3. 解题过程中的关键公式或定理应用;
`;

  return await callDeepSeekModel(prompt, 0.3);
}

// 一次性获取完整题目信息
async function getCompleteInfo(question) {
  const prompt = `
请分析以下题目，并仅返回包含学科、知识点、详细解析和答案的JSON对象。不要包含JSON外的任何额外文字或解释。

题目内容：${question}

JSON应包含以下键：
- subject: 一般研究领域（如数学、科学）
- knowledgePoint: 学科内的具体主题或概念
- analysis: 详细的解题思路和分析
- answer: 题目的最终答案或解决方案

示例：
{
  "subject": "数学",
  "knowledgePoint": "代数",
  "analysis": "要解决这个问题，我们需要...",
  "answer": "x = 2"
}

确保JSON格式正确且有效。
`;

  const aiResponse = await callDeepSeekModel(prompt, 0.3);

  // 从AI返回中提取JSON
  try {
    // 尝试直接解析整个响应
    return JSON.parse(aiResponse);
  } catch (error) {
    // 如果直接解析失败，尝试从文本中提取JSON部分
    const jsonMatch = aiResponse.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // 如果仍无法提取，则分别调用其他函数获取各部分信息
      const subjectInfo = await extractSubjectAndKnowledge(question);
      const analysis = await generateAnalysis(question);
      const answer = await generateAnswer(question);

      return {
        subject: subjectInfo["subject"] || '未知',
        knowledgePoint: subjectInfo.knowledgePoint || '未知',
        analysis: analysis,
        answer: answer
      };
    }
  }
}

module.exports = {
  callDeepSeekModel,
  extractSubjectAndKnowledge,
  generateAnalysis,
  generateAnswer,
  getCompleteInfo
};