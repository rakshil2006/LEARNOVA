const db = require("../config/db");

async function recalculateCourseStatus(userId, courseId, dbClient) {
  const client = dbClient || db;
  const {
    rows: [{ total, completed }],
  } = await client.query(
    `SELECT COUNT(l.id) AS total,
            COUNT(lp.id) FILTER (WHERE lp.status = 'completed') AS completed
     FROM lessons l
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
     WHERE l.course_id = $2`,
    [userId, courseId],
  );
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  let newStatus = "yet_to_start";
  if (completed > 0 && completed < total) newStatus = "in_progress";

  await client.query(
    `UPDATE enrollments
     SET status = $1::varchar,
         started_at = CASE WHEN started_at IS NULL AND $1::varchar != 'yet_to_start' THEN NOW() ELSE started_at END
     WHERE user_id = $2 AND course_id = $3 AND status != 'completed'`,
    [newStatus, userId, courseId],
  );
  return pct;
}

exports.updateLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { status, courseId, time_spent_seconds } = req.body;
    const userId = req.user.id;

    const lessonRes = await db.query("SELECT * FROM lessons WHERE id=$1", [
      lessonId,
    ]);
    if (!lessonRes.rows.length)
      return res.status(404).json({ error: "Lesson not found" });
    const lesson = lessonRes.rows[0];
    const cId = parseInt(courseId) || lesson.course_id;

    // Auto-enroll for open/invitation courses if not already enrolled
    const enrollCheck = await db.query(
      "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2",
      [userId, cId],
    );
    if (!enrollCheck.rows.length) {
      const courseRes = await db.query(
        "SELECT access_rule FROM courses WHERE id=$1",
        [cId],
      );
      const rule = courseRes.rows[0]?.access_rule;
      if (rule === "open" || rule === "invitation") {
        await db.query(
          `INSERT INTO enrollments (user_id, course_id, status) VALUES ($1,$2,'yet_to_start') ON CONFLICT DO NOTHING`,
          [userId, cId],
        );
      } else {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }
    }

    const existing = await db.query(
      "SELECT * FROM lesson_progress WHERE user_id=$1 AND lesson_id=$2",
      [userId, lessonId],
    );

    if (existing.rows.length) {
      const current = existing.rows[0];
      const newStatus = status || current.status;
      const addTime = time_spent_seconds || 0;
      await db.query(
        `UPDATE lesson_progress SET
          status = CASE WHEN $1 = 'completed' THEN 'completed' ELSE status END,
          time_spent_seconds = time_spent_seconds + $2,
          completed_at = CASE WHEN $1 = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END
         WHERE user_id=$3 AND lesson_id=$4`,
        [newStatus, addTime, userId, lessonId],
      );
    } else {
      const completedAt = status === "completed" ? "NOW()" : "NULL";
      await db.query(
        `INSERT INTO lesson_progress (user_id, lesson_id, course_id, status, time_spent_seconds, completed_at)
         VALUES ($1,$2,$3,$4,$5, ${status === "completed" ? "NOW()" : "NULL"})`,
        [
          userId,
          lessonId,
          cId,
          status || "in_progress",
          time_spent_seconds || 0,
        ],
      );
    }

    const pct = await recalculateCourseStatus(userId, cId);
    res.json({ success: true, completion_percent: pct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update progress" });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, courseId } = req.body;
    const userId = req.user.id;

    const quizRes = await db.query("SELECT * FROM quizzes WHERE id=$1", [
      quizId,
    ]);
    if (!quizRes.rows.length)
      return res.status(404).json({ error: "Quiz not found" });
    const quiz = quizRes.rows[0];
    const cId = parseInt(courseId) || quiz.course_id;

    // Auto-enroll for open/invitation courses if not already enrolled
    const enrollCheck = await db.query(
      "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2",
      [userId, cId],
    );
    if (!enrollCheck.rows.length) {
      const courseRes = await db.query(
        "SELECT access_rule FROM courses WHERE id=$1",
        [cId],
      );
      const rule = courseRes.rows[0]?.access_rule;
      if (rule === "open" || rule === "invitation") {
        await db.query(
          `INSERT INTO enrollments (user_id, course_id, status) VALUES ($1,$2,'yet_to_start') ON CONFLICT DO NOTHING`,
          [userId, cId],
        );
      } else {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }
    }

    const attemptsRes = await db.query(
      "SELECT COUNT(*) AS cnt FROM quiz_attempts WHERE user_id=$1 AND quiz_id=$2",
      [userId, quizId],
    );
    const attemptCount = parseInt(attemptsRes.rows[0].cnt);
    const newAttemptNumber = attemptCount + 1;

    // Get points for this attempt
    let rewardRow;
    if (newAttemptNumber <= 3) {
      const r = await db.query(
        "SELECT * FROM quiz_rewards WHERE quiz_id=$1 AND attempt_number=$2",
        [quizId, newAttemptNumber],
      );
      rewardRow = r.rows[0];
    }
    if (!rewardRow) {
      const r = await db.query(
        "SELECT * FROM quiz_rewards WHERE quiz_id=$1 AND attempt_number=0",
        [quizId],
      );
      rewardRow = r.rows[0];
    }
    const pointsEarned = rewardRow ? rewardRow.points : 0;

    const attemptRes = await db.query(
      "INSERT INTO quiz_attempts (user_id, quiz_id, attempt_number, points_earned) VALUES ($1,$2,$3,$4) RETURNING *",
      [userId, quizId, newAttemptNumber, pointsEarned],
    );
    const attempt = attemptRes.rows[0];

    if (answers && answers.length) {
      const validAnswers = answers.filter(
        (ans) => ans.question_id != null && ans.selected_option_id != null,
      );
      for (const ans of validAnswers) {
        await db.query(
          "INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_id) VALUES ($1,$2,$3) ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option_id=EXCLUDED.selected_option_id",
          [attempt.id, ans.question_id, ans.selected_option_id],
        );
      }
    }

    await db.query(
      "UPDATE users SET total_points = total_points + $1 WHERE id=$2",
      [pointsEarned, userId],
    );

    // Mark quiz lesson as completed
    if (quiz.lesson_id) {
      const existing = await db.query(
        "SELECT id FROM lesson_progress WHERE user_id=$1 AND lesson_id=$2",
        [userId, quiz.lesson_id],
      );
      if (existing.rows.length) {
        await db.query(
          `UPDATE lesson_progress SET status='completed', completed_at=COALESCE(completed_at,NOW()) WHERE user_id=$1 AND lesson_id=$2`,
          [userId, quiz.lesson_id],
        );
      } else {
        await db.query(
          `INSERT INTO lesson_progress (user_id, lesson_id, course_id, status, completed_at) VALUES ($1,$2,$3,'completed',NOW())`,
          [userId, quiz.lesson_id, cId],
        );
      }
    }

    const pct = await recalculateCourseStatus(userId, cId);

    const userRes = await db.query(
      "SELECT total_points FROM users WHERE id=$1",
      [userId],
    );
    const totalPoints = userRes.rows[0].total_points;

    res.json({
      attempt_number: newAttemptNumber,
      points_earned: pointsEarned,
      total_points: totalPoints,
      completion_percent: pct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit quiz attempt" });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollRes = await db.query(
      "SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2",
      [userId, courseId],
    );
    const enrollment = enrollRes.rows[0] || null;

    const lessonsRes = await db.query(
      `SELECT l.id, l.title, l.type, l.position,
              lp.status AS progress_status, lp.time_spent_seconds
       FROM lessons l
       LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1
       WHERE l.course_id=$2 ORDER BY l.position`,
      [userId, courseId],
    );

    const total = lessonsRes.rows.length;
    const completed = lessonsRes.rows.filter(
      (l) => l.progress_status === "completed",
    ).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      enrollment,
      lessons: lessonsRes.rows,
      completion_percent: pct,
      total,
      completed,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
};

exports.completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    await db.query(
      `UPDATE enrollments SET status='completed', completed_at=NOW() WHERE user_id=$1 AND course_id=$2`,
      [userId, courseId],
    );
    res.json({ message: "Course marked as completed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete course" });
  }
};

exports.recalculateCourseStatus = recalculateCourseStatus;
