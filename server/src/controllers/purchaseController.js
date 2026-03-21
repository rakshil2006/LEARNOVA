const db = require("../config/db");

exports.purchase = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const courseRes = await db.query("SELECT * FROM courses WHERE id=$1", [
      courseId,
    ]);
    if (!courseRes.rows.length)
      return res.status(404).json({ error: "Course not found" });
    const course = courseRes.rows[0];

    if (course.access_rule !== "payment") {
      return res
        .status(400)
        .json({ error: "This course does not require payment" });
    }

    const existing = await db.query(
      "SELECT id FROM purchases WHERE user_id=$1 AND course_id=$2",
      [userId, courseId],
    );
    if (existing.rows.length)
      return res
        .status(409)
        .json({ error: "You have already purchased this course" });

    try {
      await db.query("BEGIN");
      await db.query(
        "INSERT INTO purchases (user_id, course_id, amount_paid) VALUES ($1,$2,$3)",
        [userId, courseId, course.price || 0],
      );
      await db.query(
        `INSERT INTO enrollments (user_id, course_id, status) VALUES ($1,$2,'yet_to_start') ON CONFLICT DO NOTHING`,
        [userId, courseId],
      );
      await db.query("COMMIT");
      res.json({ success: true, message: "Purchase successful" });
    } catch (err) {
      await db.query("ROLLBACK");
      if (err.code === "23505") {
        return res
          .status(409)
          .json({ error: "You have already purchased this course" });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Purchase failed. Please try again." });
  }
};

exports.checkPurchase = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id FROM purchases WHERE user_id=$1 AND course_id=$2",
      [req.user.id, req.params.courseId],
    );
    res.json({ purchased: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to check purchase" });
  }
};
