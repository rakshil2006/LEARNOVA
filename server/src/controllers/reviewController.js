const db = require("../config/db");

exports.getReviews = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.course_id=$1 ORDER BY r.created_at DESC`,
      [req.params.courseId],
    );
    const avgRes = await db.query(
      "SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS total FROM reviews WHERE course_id=$1",
      [req.params.courseId],
    );
    res.json({
      reviews: result.rows,
      avg_rating: avgRes.rows[0].avg_rating,
      total: avgRes.rows[0].total,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { rating, review_text } = req.body;
    const result = await db.query(
      `INSERT INTO reviews (user_id, course_id, rating, review_text) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, course_id) DO UPDATE SET rating=$3, review_text=$4
       RETURNING *`,
      [req.user.id, req.params.courseId, rating, review_text],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add review" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, review_text } = req.body;
    const result = await db.query(
      "UPDATE reviews SET rating=$1, review_text=$2 WHERE id=$3 AND user_id=$4 RETURNING *",
      [rating, review_text, req.params.id, req.user.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Review not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update review" });
  }
};
