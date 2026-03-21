const db = require("../config/db");

exports.getReport = async (req, res) => {
  try {
    const { status, courseId, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;
    const role = req.user.role;

    // Build separate param arrays for data query and count query
    const baseParams = [
      status || null,
      courseId ? parseInt(courseId) : null,
      search || null,
    ];

    let instructorFilter = "";
    let instructorParam = [];
    if (role === "instructor") {
      instructorFilter = `AND c.created_by = $${baseParams.length + 1}`;
      instructorParam = [userId];
    }

    const dataParams = [
      ...baseParams,
      ...instructorParam,
      parseInt(limit),
      parseInt(offset),
    ];
    const limitIdx = baseParams.length + instructorParam.length + 1;
    const offsetIdx = limitIdx + 1;

    const query = `
      SELECT
        e.id, c.id AS course_id, c.title AS course_name,
        u.id AS user_id, u.name AS participant_name, u.email AS participant_email,
        e.enrolled_at, e.started_at, e.completed_at, e.status,
        ROUND(
          (COUNT(lp.id) FILTER (WHERE lp.status = 'completed')::decimal /
          NULLIF(COUNT(l.id), 0)) * 100
        ) AS completion_percent,
        COALESCE(SUM(lp.time_spent_seconds), 0) AS time_spent_seconds
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = e.user_id
      WHERE
        ($1::text IS NULL OR e.status = $1)
        AND ($2::int IS NULL OR e.course_id = $2)
        AND ($3::text IS NULL OR u.name ILIKE '%' || $3 || '%' OR c.title ILIKE '%' || $3 || '%')
        ${instructorFilter}
      GROUP BY e.id, c.id, c.title, u.id, u.name, u.email, e.enrolled_at, e.started_at, e.completed_at, e.status
      ORDER BY e.enrolled_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countParams = [...baseParams, ...instructorParam];
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) AS total
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      JOIN courses c ON c.id = e.course_id
      WHERE
        ($1::text IS NULL OR e.status = $1)
        AND ($2::int IS NULL OR e.course_id = $2)
        AND ($3::text IS NULL OR u.name ILIKE '%' || $3 || '%' OR c.title ILIKE '%' || $3 || '%')
        ${instructorFilter}
    `;

    // Stats query — use parameterized for instructor filter
    let statsQuery, statsParams;
    if (role === "instructor") {
      statsQuery = `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE e.status='yet_to_start') AS yet_to_start,
          COUNT(*) FILTER (WHERE e.status='in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE e.status='completed') AS completed
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE c.created_by = $1
      `;
      statsParams = [userId];
    } else {
      statsQuery = `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE e.status='yet_to_start') AS yet_to_start,
          COUNT(*) FILTER (WHERE e.status='in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE e.status='completed') AS completed
        FROM enrollments e
      `;
      statsParams = [];
    }

    const [dataRes, countRes, statsRes] = await Promise.all([
      db.query(query, dataParams),
      db.query(countQuery, countParams),
      db.query(statsQuery, statsParams),
    ]);

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit),
      stats: statsRes.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};
