const db = require("../config/db");

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
         qwa.quiz_id,
         qz.title        AS quiz_title,
         qwa.course_id,
         c.title         AS course_title,
         l.id            AS lesson_id,
         qwa.total_attempts,
         qwa.avg_score_pct
       FROM quiz_weak_areas qwa
       JOIN quizzes  qz ON qz.id = qwa.quiz_id
       JOIN courses  c  ON c.id  = qwa.course_id
       JOIN lessons  l  ON l.id  = qz.lesson_id
       WHERE qwa.user_id = $1
         AND qwa.is_weak = TRUE
       ORDER BY qwa.avg_score_pct ASC, qwa.last_attempted ASC
       LIMIT 5`,
      [userId],
    );

    const recommendations = result.rows.map((r) => ({
      ...r,
      player_url: `/courses/${r.course_id}/lessons/${r.lesson_id}`,
    }));

    if (recommendations.length === 0) {
      return res.json({
        recommendations: [],
        message: "Great job! No weak areas detected.",
      });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error("getRecommendations error:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};
