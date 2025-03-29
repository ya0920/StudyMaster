// 导入数据库服务
const mysql = require('mysql2/promise');
const dataBase = require('../config/index.js');


// 创建连接池（如果dbService不可用）
const pool = mysql.createPool({
    host: dataBase.HOST,
    user: dataBase.USERNAME,
    password: dataBase.PASSWORD,
    database: dataBase.DATABASE,
    port: dataBase.PORT
});

// 数据库查询函数（如果dbService不可用）
const query = async (sql, values) => {
    try {
        const conn = await pool.getConnection();
        const [rows, fields] = await conn.query(sql, values);
        pool.releaseConnection(conn);
        return Promise.resolve(rows);
    } catch (error) {
        return Promise.reject(error);
    }
};

// 以下从index.js复制过来的控制器函数
// 添加错题到复习计划
const addToReviewPlan = async (ctx) => {
    try {
        const { studentId, questionId, date } = ctx.request.body;
        
        // 验证必要参数
        if (!studentId || !questionId) {
            ctx.status = 400;
            ctx.body = {
                code: 400,
                message: '学生ID和错题ID不能为空'
            };
            return;
        }
        
        // 获取本地时区的今天日期
        const getLocalToday = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        // 设置任务日期，默认为本地时区的今天
        const assignmentDate = date || getLocalToday();
        
        console.log('添加复习计划, 日期:', assignmentDate);
        
        // 检查该错题是否已经在指定日期的计划中
        const checkSql = `
            SELECT id FROM daily_review_tasks 
            WHERE student_id = ? AND question_id = ? AND assignment_date = ?
        `;
        const checkResult = await query(checkSql, [studentId, questionId, assignmentDate]);
        
        if (checkResult.length > 0) {
            ctx.body = {
                code: 200,
                message: '该错题已在复习计划中',
                data: { id: checkResult[0].id }
            };
            return;
        }
        
        // 添加到复习计划
        const insertSql = `
            INSERT INTO daily_review_tasks (student_id, question_id, assignment_date)
            VALUES (?, ?, ?)
        `;
        const result = await query(insertSql, [studentId, questionId, assignmentDate]);
        
        ctx.body = {
            code: 200,
            message: '成功加入复习计划',
            data: { id: result.insertId }
        };
    } catch (error) {
        console.error('添加复习计划失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '添加复习计划失败',
            error: error.message
        };
    }
};

// 获取指定日期的复习任务
const getReviewTasks = async (ctx) => {
    try {
        const { studentId, date } = ctx.query;
        
        if (!studentId) {
            ctx.status = 400;
            ctx.body = {
                code: 400,
                message: '学生ID不能为空'
            };
            return;
        }
        
        // 默认获取今天的任务
        const taskDate = date || new Date().toISOString().split('T')[0];
        
        // 查询指定日期的复习任务
        const sql = `
            SELECT 
                drt.id as taskId,
                drt.question_id as id,
                drt.is_completed as completed,
                wq.question_content as content,
                s.name as subject,
                kp.name as knowledgePoint,
                et.name as errorType
            FROM daily_review_tasks drt
            JOIN wrong_questions wq ON drt.question_id = wq.id
            JOIN subjects s ON wq.subject_id = s.id
            JOIN knowledge_points kp ON wq.knowledge_point_id = kp.id
            JOIN error_types et ON wq.error_type_id = et.id
            WHERE drt.student_id = ? AND drt.assignment_date = ?
        `;
        
        const tasks = await query(sql, [studentId, taskDate]);
        
        ctx.body = {
            code: 200,
            data: tasks,
            message: '获取复习任务成功'
        };
    } catch (error) {
        console.error('获取复习任务失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '获取复习任务失败',
            error: error.message
        };
    }
};

// 完成复习任务 - 使用已有的query函数
const completeReviewTask = async (ctx) => {
  const taskId = ctx.params.taskId; // 修改此处，从id改为taskId
  
  try {
    // 获取任务信息
    const tasks = await query(
      'SELECT question_id FROM daily_review_tasks WHERE id = ?',
      [taskId]
    );
    
    if (tasks.length === 0) {
      ctx.body = { code: 404, message: '任务不存在' };
      return;
    }
    
    const questionId = tasks[0].question_id;
    
    // 更新任务为已完成
    await query(
      'UPDATE daily_review_tasks SET is_completed = true, completed_date = CURDATE() WHERE id = ?',
      [taskId]
    );
    
    // 更新错题表的最后复习时间和复习次数
    await query(
      'UPDATE wrong_questions SET last_review_time = NOW(), review_count = review_count + 1 WHERE id = ?',
      [questionId]
    );
    
    ctx.body = { code: 200, message: '任务已标记为完成' };
  } catch (error) {
    console.error('完成任务失败:', error);
    ctx.body = { code: 500, message: '操作失败，请重试' };
  }
};

// 取消完成复习任务 - 使用已有的query函数
const uncompleteReviewTask = async (ctx) => {
  const taskId = ctx.params.taskId; // 修改此处，从id改为taskId
  console.log('尝试取消完成任务:', taskId, '类型:', typeof taskId);
  
  try {
    // 获取任务信息
    const tasks = await query(
      'SELECT id, question_id FROM daily_review_tasks WHERE id = ?',
      [taskId]
    );
    
    console.log('查询结果:', tasks);
    
    if (tasks.length === 0) {
      console.log('未找到任务:', taskId);
      ctx.body = { code: 404, message: '任务不存在' };
      return;
    }
    
    const questionId = tasks[0].question_id;
    console.log('找到对应的问题ID:', questionId);
    
    // 更新任务为未完成
    const updateResult = await query(
      'UPDATE daily_review_tasks SET is_completed = false, completed_date = NULL WHERE id = ?',
      [taskId]
    );
    console.log('更新任务结果:', updateResult);
    
    // 更新错题表的复习次数
    const updateQuestionResult = await query(
      'UPDATE wrong_questions SET review_count = GREATEST(review_count - 1, 0) WHERE id = ?',
      [questionId]
    );
    console.log('更新错题结果:', updateQuestionResult);
    
    ctx.body = { code: 200, message: '任务已标记为未完成' };
  } catch (error) {
    console.error('取消完成任务失败:', error);
    ctx.body = { code: 500, message: '操作失败，请重试', error: error.message };
  }
};

// 获取已完成的复习日期
const getCompletedDates = async (ctx) => {
  try {
    const { studentId } = ctx.query;
    
    if (!studentId) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '学生ID不能为空'
      };
      return;
    }
    
    // 查询所有已完成的日期
    const sql = `
      SELECT DISTINCT assignment_date 
      FROM daily_review_tasks 
      WHERE student_id = ? 
      GROUP BY assignment_date 
      HAVING COUNT(*) > 0 AND SUM(is_completed) = COUNT(*)
    `;
    
    const result = await query(sql, [studentId]);
    
    // 提取日期列表
    const completedDates = result.map(item => {
      // 确保日期格式为YYYY-MM-DD
      const date = new Date(item.assignment_date);
      return date.toISOString().split('T')[0];
    });
    
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
    addToReviewPlan,
    getReviewTasks,
    completeReviewTask,
    uncompleteReviewTask,
    getCompletedDates
};