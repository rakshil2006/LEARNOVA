const db = require("../config/db");

exports.getQuizzes = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT q.*, COUNT(qq.id) AS question_count
       FROM quizzes q
       LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
       WHERE q.course_id=$1
       GROUP BY q.id ORDER BY q.created_at`,
      [req.params.courseId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, lesson_id } = req.body;
    const courseId = req.params.courseId;

    // Auto-create a lesson of type 'quiz' if no lesson_id provided
    let lessonId = lesson_id || null;
    if (!lessonId) {
      const posRes = await db.query(
        "SELECT COALESCE(MAX(position),0)+1 AS pos FROM lessons WHERE course_id=$1",
        [courseId],
      );
      const position = posRes.rows[0].pos;
      const lessonRes = await db.query(
        "INSERT INTO lessons (course_id, title, type, position) VALUES ($1,$2,'quiz',$3) RETURNING *",
        [courseId, title, position],
      );
      lessonId = lessonRes.rows[0].id;
    }

    const result = await db.query(
      "INSERT INTO quizzes (course_id, lesson_id, title) VALUES ($1,$2,$3) RETURNING *",
      [courseId, lessonId, title],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create quiz" });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const quizRes = await db.query(
      "SELECT * FROM quizzes WHERE id=$1 AND course_id=$2",
      [req.params.id, req.params.courseId],
    );
    if (!quizRes.rows.length)
      return res.status(404).json({ error: "Quiz not found" });
    const quiz = quizRes.rows[0];

    const questionsRes = await db.query(
      `SELECT qq.*, json_agg(json_build_object('id',qo.id,'option_text',qo.option_text,'is_correct',qo.is_correct) ORDER BY qo.id) AS options
       FROM quiz_questions qq
       LEFT JOIN quiz_options qo ON qo.question_id = qq.id
       WHERE qq.quiz_id=$1
       GROUP BY qq.id ORDER BY qq.position`,
      [quiz.id],
    );

    const rewardsRes = await db.query(
      "SELECT * FROM quiz_rewards WHERE quiz_id=$1 ORDER BY attempt_number",
      [quiz.id],
    );

    res.json({
      ...quiz,
      questions: questionsRes.rows,
      rewards: rewardsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { title } = req.body;
    const result = await db.query(
      "UPDATE quizzes SET title=$1 WHERE id=$2 AND course_id=$3 RETURNING *",
      [title, req.params.id, req.params.courseId],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update quiz" });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    // Delete the auto-created quiz lesson too
    const quizRes = await db.query(
      "SELECT lesson_id FROM quizzes WHERE id=$1 AND course_id=$2",
      [req.params.id, req.params.courseId],
    );
    await db.query("DELETE FROM quizzes WHERE id=$1 AND course_id=$2", [
      req.params.id,
      req.params.courseId,
    ]);
    if (quizRes.rows[0]?.lesson_id) {
      await db.query("DELETE FROM lessons WHERE id=$1 AND type='quiz'", [
        quizRes.rows[0].lesson_id,
      ]);
    }
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete quiz" });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const { question_text, options } = req.body;
    const posRes = await db.query(
      "SELECT COALESCE(MAX(position),0)+1 AS pos FROM quiz_questions WHERE quiz_id=$1",
      [req.params.id],
    );
    const position = posRes.rows[0].pos;
    const qRes = await db.query(
      "INSERT INTO quiz_questions (quiz_id, question_text, position) VALUES ($1,$2,$3) RETURNING *",
      [req.params.id, question_text, position],
    );
    const question = qRes.rows[0];
    if (options && options.length) {
      const vals = options
        .map((_, i) => `($1,$${i * 2 + 2},$${i * 2 + 3})`)
        .join(",");
      const params = [question.id];
      options.forEach((opt) => {
        params.push(opt.option_text);
        params.push(opt.is_correct || false);
      });
      await db.query(
        `INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES ${vals}`,
        params,
      );
    }
    const full = await db.query(
      `SELECT qq.*, json_agg(json_build_object('id',qo.id,'option_text',qo.option_text,'is_correct',qo.is_correct)) AS options
       FROM quiz_questions qq LEFT JOIN quiz_options qo ON qo.question_id=qq.id
       WHERE qq.id=$1 GROUP BY qq.id`,
      [question.id],
    );
    res.status(201).json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add question" });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { question_text, options } = req.body;
    await db.query("UPDATE quiz_questions SET question_text=$1 WHERE id=$2", [
      question_text,
      req.params.id,
    ]);
    if (options) {
      await db.query("DELETE FROM quiz_options WHERE question_id=$1", [
        req.params.id,
      ]);
      if (options.length) {
        const vals = options
          .map((_, i) => `($1,$${i * 2 + 2},$${i * 2 + 3})`)
          .join(",");
        const params = [req.params.id];
        options.forEach((opt) => {
          params.push(opt.option_text);
          params.push(opt.is_correct || false);
        });
        await db.query(
          `INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES ${vals}`,
          params,
        );
      }
    }
    const full = await db.query(
      `SELECT qq.*, json_agg(json_build_object('id',qo.id,'option_text',qo.option_text,'is_correct',qo.is_correct)) AS options
       FROM quiz_questions qq LEFT JOIN quiz_options qo ON qo.question_id=qq.id
       WHERE qq.id=$1 GROUP BY qq.id`,
      [req.params.id],
    );
    res.json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update question" });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    await db.query("DELETE FROM quiz_questions WHERE id=$1 AND quiz_id=$2", [
      req.params.id,
      req.params.quizId,
    ]);
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete question" });
  }
};

exports.setRewards = async (req, res) => {
  const client = await db.connect();
  try {
    const { rewards } = req.body;
    await client.query("BEGIN");
    await client.query("DELETE FROM quiz_rewards WHERE quiz_id=$1", [
      req.params.id,
    ]);
    for (const r of rewards) {
      await client.query(
        "INSERT INTO quiz_rewards (quiz_id, attempt_number, points) VALUES ($1,$2,$3)",
        [req.params.id, r.attempt_number, r.points],
      );
    }
    await client.query("COMMIT");
    res.json({ message: "Rewards saved" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to set rewards" });
  } finally {
    client.release();
  }
};
