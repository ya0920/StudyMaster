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
const userRegister = async (ctx) => {
    try {
        const { phone, password, role, name } = ctx.request.body;

        // 检查手机号是否已注册
        const checkUser = await allServices.query('SELECT * FROM users WHERE phone = ?', [phone]);
        if (checkUser.length > 0) {
            ctx.status = 400;
            ctx.body = {
                code: 400,
                message: '该手机号已注册'
            };
            return;
        }

        // 插入新用户
        const sql = 'INSERT INTO users (phone, password, role, name) VALUES (?, ?, ?, ?)';
        const result = await allServices.query(sql, [phone, password, role, name]);

        ctx.body = {
            code: 200,
            data: {
                id: result.insertId
            },
            message: '注册成功'
        };
    } catch (error) {
        console.error('注册失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '注册失败',
            error: error.message
        };
    }
};

// 重置密码
const resetPassword = async (phone, password) => {
    // 检查手机号是否存在
    const checkSql = 'SELECT id FROM users WHERE phone = ?';
    const user = await allServices.query(checkSql, [phone]);

    if (user.length === 0) {
        return {
            code: 400,
            message: '手机号未注册'
        };
    }

    // 更新密码
    const updateSql = 'UPDATE users SET password = ? WHERE phone = ?';
    await allServices.query(updateSql, [password, phone]);

    return {
        code: 200,
        message: '密码重置成功'
    };
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

// 获取最近错题（支持分页和学科筛选）
const getRecentWrongQuestions = async (ctx) => {
    try {
        const { studentId, page = 1, pageSize = 5, subject } = ctx.query;

        // 计算偏移量
        const offset = (page - 1) * pageSize;

        // SQL查询基础部分
        let sql = `
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
        `;

        const params = [studentId];

        // 如果指定了学科，添加过滤条件
        if (subject && subject !== '全部') {
            sql += ` AND s.name = ?`;
            params.push(subject);
        }

        // 添加排序和分页
        sql += ` ORDER BY wq.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), parseInt(offset));

        const rows = await allServices.query(sql, params);

        ctx.body = {
            code: 200,
            data: rows,
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

// 获取上周错题统计方法
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


// 删除错题
const deleteWrongQuestion = async (ctx) => {
    try {
        const { id } = ctx.params;

        // 验证ID是否存在
        if (!id) {
            ctx.status = 400;
            ctx.body = {
                code: 400,
                message: '错题ID不能为空'
            };
            return;
        }

        // 查询该错题是否存在
        const checkSql = 'SELECT id FROM wrong_questions WHERE id = ?';
        const checkResult = await allServices.query(checkSql, [id]);

        if (checkResult.length === 0) {
            ctx.status = 404;
            ctx.body = {
                code: 404,
                message: '错题不存在'
            };
            return;
        }

        // 执行删除操作
        const deleteSql = 'DELETE FROM wrong_questions WHERE id = ?';
        await allServices.query(deleteSql, [id]);

        ctx.body = {
            code: 200,
            message: '删除成功'
        };
    } catch (error) {
        console.error('删除错题失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '删除错题失败',
            error: error.message
        };
    }
};

// 获取错题详情
const getWrongQuestionDetail = async (ctx) => {
    const { id } = ctx.params;

    try {
        const sql = `
        SELECT 
          wq.*,
          s.name as subject,
          kp.name as knowledgePoint,
          et.name as errorType
        FROM 
          wrong_questions wq
        JOIN subjects s ON wq.subject_id = s.id
        JOIN knowledge_points kp ON wq.knowledge_point_id = kp.id
        JOIN error_types et ON wq.error_type_id = et.id
        WHERE wq.id = ?
      `;

        const questions = await allServices.query(sql, [id]); // 修复这里

        if (questions.length > 0) {
            ctx.body = {
                code: 200,
                data: questions[0],
                message: '获取错题详情成功'
            };
        } else {
            ctx.body = {
                code: 404,
                message: '错题不存在'
            };
        }
    } catch (error) {
        console.error('获取错题详情失败:', error);
        ctx.body = {
            code: 500,
            message: '获取错题详情失败',
            error: error.message
        };
    }
};

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

        // 设置任务日期，默认为今天
        const assignmentDate = date || new Date().toISOString().split('T')[0];

        // 检查该错题是否已经在指定日期的计划中
        const checkSql = `
            SELECT id FROM daily_review_tasks 
            WHERE student_id = ? AND question_id = ? AND assignment_date = ?
        `;
        const checkResult = await allServices.query(checkSql, [studentId, questionId, assignmentDate]);

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
        const result = await allServices.query(insertSql, [studentId, questionId, assignmentDate]);

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

        // 自动处理：如果是今天，将昨天录入的且未添加到计划中的错题自动添加到今天的计划
        const today = new Date().toISOString().split('T')[0];
        if (taskDate === today) {
            await addYesterdayQuestionsToToday(studentId);
        }

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

        const tasks = await allServices.query(sql, [studentId, taskDate]);

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

// 完成复习任务
const completeReviewTask = async (ctx) => {
    try {
        const { taskId } = ctx.params;

        if (!taskId) {
            ctx.status = 400;
            ctx.body = {
                code: 400,
                message: '任务ID不能为空'
            };
            return;
        }

        // 更新任务状态为已完成
        const sql = `
            UPDATE daily_review_tasks
            SET is_completed = true, completed_date = CURDATE()
            WHERE id = ?
        `;

        await allServices.query(sql, [taskId]);

        ctx.body = {
            code: 200,
            message: '任务已完成'
        };
    } catch (error) {
        console.error('更新任务状态失败:', error);
        ctx.status = 500;
        ctx.body = {
            code: 500,
            message: '更新任务状态失败',
            error: error.message
        };
    }
};

// 辅助函数：将昨天录入的错题添加到今天的复习计划
async function addYesterdayQuestionsToToday(studentId) {
    try {
        // 获取昨天的日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // 获取今天的日期
        const today = new Date().toISOString().split('T')[0];

        // 查找昨天录入但未加入今天计划的错题
        const findSql = `
            SELECT wq.id
            FROM wrong_questions wq
            WHERE wq.student_id = ?
            AND DATE(wq.created_at) = ?
            AND NOT EXISTS (
                SELECT 1 FROM daily_review_tasks drt
                WHERE drt.question_id = wq.id
                AND drt.student_id = ?
                AND drt.assignment_date = ?
            )
        `;

        const questionsToAdd = await allServices.query(
            findSql,
            [studentId, yesterdayStr, studentId, today]
        );

        // 批量添加到今天的复习计划
        if (questionsToAdd.length > 0) {
            const values = questionsToAdd.map(q =>
                `(${studentId}, ${q.id}, '${today}')`
            ).join(',');

            const insertSql = `
                INSERT INTO daily_review_tasks 
                (student_id, question_id, assignment_date)
                VALUES ${values}
            `;

            await allServices.query(insertSql);
            console.log(`已自动添加${questionsToAdd.length}道昨天的错题到今天的复习计划`);
        }
    } catch (error) {
        console.error('自动添加昨天错题失败:', error);
    }
}
// 更新错题的AI解析和解答
const updateQuestionAI = async (ctx) => {
    const { id } = ctx.params;
    const { aiSolution, aiAnalysis } = ctx.request.body;

    try {
        // 更新数据库
        const result = await allServices.query( // 修复这里
            'UPDATE wrong_questions SET ai_solution = ?, ai_analysis = ? WHERE id = ?',
            [aiSolution, aiAnalysis, id]
        );

        if (result.affectedRows > 0) {
            ctx.body = {
                code: 200,
                message: 'AI解析和解答已更新'
            };
        } else {
            ctx.body = {
                code: 404,
                message: '错题不存在'
            };
        }
    } catch (error) {
        console.error('更新错题AI内容失败:', error);
        ctx.body = {
            code: 500,
            message: '更新失败，请重试',
            error: error.message
        };
    }
};
// 获取学生掌握度
const getMasteryRate = async (ctx) => {
    try {
      const { studentId } = ctx.query;
      
      if (!studentId) {
        ctx.body = { code: 400, message: '缺少学生ID参数' };
        return;
      }
      
      // 查询该学生的所有错题
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM wrong_questions WHERE student_id = ?',
        [studentId]
      );
      
      // 查询该学生已复习过的错题（last_review_time不为空）
      const [reviewedResult] = await pool.execute(
        'SELECT COUNT(*) as reviewed FROM wrong_questions WHERE student_id = ? AND last_review_time IS NOT NULL',
        [studentId]
      );
      
      const total = totalResult[0].total;
      const reviewed = reviewedResult[0].reviewed;
      
      // 计算掌握度百分比
      const masteryRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;
      
      ctx.body = {
        code: 200,
        data: {
          total,
          reviewed,
          masteryRate
        }
      };
    } catch (err) {
      console.error('获取掌握度失败:', err);
      ctx.body = { code: 500, message: '服务器错误' };
    }
  };
module.exports = {
    userLogin,
    userRegister,
    getErrorTypes,
    saveWrongQuestion,
    getRecentWrongQuestions,
    getLastWeekWrongQuestions,
    getWeeklyWrongQuestions,
    getSubjectDistribution,
    deleteWrongQuestion,
    getWrongQuestionDetail,
    addToReviewPlan,
    getReviewTasks,
    completeReviewTask,
    resetPassword,
    updateQuestionAI,
    getMasteryRate
};