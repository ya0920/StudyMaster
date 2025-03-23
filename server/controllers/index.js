const mysql = require('mysql2/promise');
const dataBase = require('../config/index.js');

// 创建连接池
const pool = mysql.createPool({
    host: dataBase.HOST,
    user: dataBase.USERNAME,
    password: dataBase.PASSWORD,
    database: dataBase.DATABASE,
    port: dataBase.PORT
});

// mysql的连接
const allServices = {
    async query(sql, values) {
        try {
            const conn = await pool.getConnection(); // 等待连接池连接
            const [rows, fields] = await conn.query(sql, values); // 执行sql语句
            pool.releaseConnection(conn); // 释放连接
            return Promise.resolve(rows);
        } catch (error) {
            return Promise.reject(error);
        }
    }
};

// 用户登录
// 修改后的用户登录函数
const userLogin = async (phone, password, role) => {
    const sql = 'SELECT * FROM users WHERE phone = ? AND password = ? AND role = ?';
    const values = [phone, password, role];
    return await allServices.query(sql, values);
};

// 用户注册
const userRegister = async (user_id, username, password, phone_number, user_type, created_at) => {
    const sql = 'INSERT INTO users (user_id, username, password, phone_number, user_type, created_at) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [user_id, username, password, phone_number, user_type, created_at];
    return await allServices.query(sql, values);
};

// 获取错误类型列表
const getErrorTypes = async (ctx) => {
    try {
        const sql = 'SELECT id, name FROM error_types';
        const values = [];
        const rows = await allServices.query(sql, values);

        // 打印返回的数据
        console.log('Error types data:', rows);

        ctx.body = {
            code: 200,
            data: rows,
            message: '获取错误类型列表成功'
        };
    } catch (error) {
        console.error('获取错误类型列表失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '获取错误类型列表失败',
            error: error.message
        };
    }
};

// 保存错题
// 修改保存错题逻辑（续接原代码）
const saveWrongQuestion = async (ctx) => {
  try {
    // 直接从请求体获取客户端传递的用户ID
    const { studentId } = ctx.request.body;
    
    // 添加用户存在性验证
    const userCheck = await allServices.query(
      'SELECT id FROM users WHERE id = ?', 
      [studentId]
    );
    if (userCheck.length === 0) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '用户不存在' };
      return;
    }
    
    const { subject, chapter, content, errorType, yourAnswer } = ctx.request.body;
    
    // 查询学科 ID
    const subjectSql = 'SELECT id FROM subjects WHERE name = ?';
    const subjectResult = await allServices.query(subjectSql, [subject]);
    if (subjectResult.length === 0) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '学科不存在'
      };
      return;
    }
    const subjectId = subjectResult[0].id;

    // 查询知识点 ID
    const knowledgePointSql = 'SELECT id FROM knowledge_points WHERE subject_id = ? AND name = ?';
    const knowledgePointResult = await allServices.query(knowledgePointSql, [subjectId, chapter]);
    let knowledgePointId;
    if (knowledgePointResult.length === 0) {
      // 知识点不存在，创建新的知识点记录
      const insertKnowledgePointSql = 'INSERT INTO knowledge_points (subject_id, name) VALUES (?, ?)';
      const insertResult = await allServices.query(insertKnowledgePointSql, [subjectId, chapter]);
      knowledgePointId = insertResult.insertId;
    } else {
      knowledgePointId = knowledgePointResult[0].id;
    }

    // 插入错题数据
    const insertSql = `
      INSERT INTO wrong_questions (
        student_id, subject_id, knowledge_point_id, error_type_id, 
        question_content, correct_answer, wrong_answer
      ) VALUES (?,?,?,?,?,?,?)
    `;
    // 插入错题数据时使用认证后的用户ID
    await allServices.query(insertSql, [
      studentId,  // 使用真实用户ID
      subjectId, 
      knowledgePointId, 
      errorType,
      content, 
      '', 
      yourAnswer
    ]);

    // 修改为直接获取查询结果（移除数组解构）
    const insertResult = await allServices.query(
      `INSERT INTO wrong_questions 
      (student_id, subject_id, knowledge_point_id, error_type_id, question_content, correct_answer, wrong_answer) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [studentId, subjectId, knowledgePointId, errorType, content, '', yourAnswer]
    );

    ctx.body = { 
      code: 200, 
      data: {
        id: insertResult.insertId || insertResult[0]?.insertId, // ✅ 兼容不同数据库驱动
        message: '保存成功'
      }
    };
  } catch (error) {
    console.error('数据库操作失败:', error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '数据库操作失败: ' + error.message
    };
  }
};

// 获取最近错题（新增方法）
const getRecentWrongQuestions = async (ctx) => {
    try {
        const { studentId } = ctx.query;
        const sql = `
            SELECT 
                wq.id,
                wq.question_content AS content,
                s.name AS subject,
                kp.name AS chapter,
                DATE_FORMAT(wq.created_at, '%Y-%m-%d %H:%i:%s') AS time,
                wq.wrong_answer AS yourAnswer
            FROM wrong_questions wq
            LEFT JOIN subjects s ON wq.subject_id = s.id
            LEFT JOIN knowledge_points kp ON wq.knowledge_point_id = kp.id
            WHERE wq.student_id = ?
            ORDER BY wq.created_at DESC
            LIMIT 5
        `;
        const rows = await allServices.query(sql, [studentId]);
        
        ctx.body = {
            code: 200,
            data: rows, // 直接使用数据库返回的格式化时间
            message: '获取最近错题成功'
        };
    } catch (error) {
        console.error('获取最近错题失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '获取最近错题失败',
            error: error.message
        };
    }
};

// 新增本周错题统计方法
// 新增获取上周错题统计方法
const getLastWeekWrongQuestions = async (ctx) => {
    try {
        const { studentId } = ctx.query;
        const sql = `
            SELECT COUNT(*) AS count 
            FROM wrong_questions 
            WHERE student_id = ?
            AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1)
        `;
        const rows = await allServices.query(sql, [studentId]);
        
        ctx.body = {
            code: 200,
            data: { count: rows[0].count },
            message: '获取上周错题成功'
        };
    } catch (error) {
        console.error('获取上周错题失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '获取上周错题失败',
            error: error.message
        };
    }
};

// 修改获取本周错题统计方法，使其返回增长率
const getWeeklyWrongQuestions = async (ctx) => {
    try {
        const { studentId } = ctx.query;
        // 获取本周错题数量
        const thisWeekSql = `
            SELECT COUNT(*) AS count 
            FROM wrong_questions 
            WHERE student_id = ?
            AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        `;
        const thisWeekRows = await allServices.query(thisWeekSql, [studentId]);
        const thisWeekCount = thisWeekRows[0].count;

        // 获取上周错题数量
        const lastWeekSql = `
            SELECT COUNT(*) AS count 
            FROM wrong_questions 
            WHERE student_id = ?
            AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1)
        `;
        const lastWeekRows = await allServices.query(lastWeekSql, [studentId]);
        const lastWeekCount = lastWeekRows[0].count;
        
        // 计算增长率
        let growthRate = 0;
        if (lastWeekCount > 0) {
            growthRate = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
        }

        ctx.body = {
            code: 200,
            data: { 
                count: thisWeekCount,
                growthRate: growthRate.toFixed(1) 
            },
            message: '获取本周错题成功'
        };
    } catch (error) {
        console.error('获取本周错题失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '获取本周错题失败',
            error: error.message
        };
    }
};

// 各学科错题数量统计
const getSubjectDistribution = async (ctx) => {
  try {
      const { studentId } = ctx.query;
      const sql = `
          SELECT 
              s.name AS subject,
              COUNT(wq.id) AS count
          FROM wrong_questions wq
          JOIN subjects s ON wq.subject_id = s.id
          WHERE wq.student_id = ?
          GROUP BY s.name
          ORDER BY count DESC
      `;
      const rows = await allServices.query(sql, [studentId]);
      
      // 格式化为图表需要的数据结构
      const formattedData = rows.map(item => ({
          name: item.subject,
          value: item.count
      }));

      ctx.body = {
          code: 200,
          data: formattedData,
          message: '获取学科分布成功'
      };
  } catch (error) {
      console.error('获取学科分布失败:', error);
      ctx.status = 500;
      ctx.body = {
          code: 500,
          message: '获取学科分布失败',
          error: error.message
      };
  }
};

module.exports = {
    userLogin,
    userRegister,
    getErrorTypes, // 导出新的控制器函数
    saveWrongQuestion,
    getRecentWrongQuestions, // ✅ 确保导出新增方法
    getLastWeekWrongQuestions,
    getWeeklyWrongQuestions,
    getSubjectDistribution
};