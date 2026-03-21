const db = require("../config/db");
const path = require("path");

const courseSelect = `
  SELECT c.*,
    COALESCE(SUM(l.duration_seconds) FILTER (WHERE l.type = 'video'), 0) AS total_duration_seconds,
    COUNT(DISTINCT l.id) AS total_lessons,
    u.name AS course_admin_name
  FROM courses c
  LEFT JOIN lessons l ON l.course_id = c.id
  LEFT JOIN users u ON u.id = c.course_admin_id
`;

exports.getCourses = async (req, res) => {
  try {
    const { q } = req.query;
    let query = courseSelect;
    const params = [];
    const conditions = [];

    if (req.user.role === "instructor") {
      params.push(req.user.id);
      conditions.push(`c.created_by = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`c.title ILIKE $${params.length}`);
    }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY c.id, u.name ORDER BY c.created_at DESC";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const result = await db.query(
      courseSelect + " WHERE c.id=$1 GROUP BY c.id, u.name",
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Course not found" });
    const course = result.rows[0];
    if (req.user.role === "instructor" && course.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Title must be at least 3 characters" });
    }
    const result = await db.query(
      "INSERT INTO courses (title, created_by, course_admin_id) VALUES ($1,$2,$2) RETURNING *",
      [title.trim(), req.user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query("SELECT * FROM courses WHERE id=$1", [id]);
    if (!existing.rows.length)
      return res.status(404).json({ error: "Course not found" });
    if (
      req.user.role === "instructor" &&
      existing.rows[0].created_by !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }
    const {
      title,
      tags,
      website_slug,
      short_description,
      description,
      visibility,
      access_rule,
      price,
      course_admin_id,
    } = req.body;
    const result = await db.query(
      `UPDATE courses SET
        title=COALESCE($1,title), tags=COALESCE($2,tags), website_slug=COALESCE($3,website_slug),
        short_description=COALESCE($4,short_description), description=COALESCE($5,description),
        visibility=COALESCE($6,visibility), access_rule=COALESCE($7,access_rule),
        price=COALESCE($8::numeric,price), course_admin_id=COALESCE($9::integer,course_admin_id),
        updated_at=NOW()
      WHERE id=$10 RETURNING *`,
      [
        title || null,
        tags || null,
        website_slug || null,
        short_description || null,
        description || null,
        visibility || null,
        access_rule || null,
        price != null && price !== "" ? price : null,
        course_admin_id != null && course_admin_id !== ""
          ? course_admin_id
          : null,
        id,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update course" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query("SELECT * FROM courses WHERE id=$1", [id]);
    if (!existing.rows.length)
      return res.status(404).json({ error: "Course not found" });
    if (
      req.user.role === "instructor" &&
      existing.rows[0].created_by !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }
    await db.query("DELETE FROM courses WHERE id=$1", [id]);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course" });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query("SELECT * FROM courses WHERE id=$1", [id]);
    if (!existing.rows.length)
      return res.status(404).json({ error: "Course not found" });
    const course = existing.rows[0];
    if (req.user.role === "instructor" && course.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const newPublished = !course.is_published;
    if (newPublished && (!course.website_slug || !course.website_slug.trim())) {
      return res
        .status(400)
        .json({ error: "Website slug is required to publish this course" });
    }
    const result = await db.query(
      "UPDATE courses SET is_published=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [newPublished, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle publish" });
  }
};

exports.uploadCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    await db.query(
      "UPDATE courses SET cover_image_url=$1, updated_at=NOW() WHERE id=$2",
      [url, req.params.id],
    );
    res.json({ cover_image_url: url });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload cover" });
  }
};

exports.getShareLink = async (req, res) => {
  res.json({ url: `http://localhost:5174/courses/${req.params.id}` });
};

exports.addAttendees = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails))
      return res.status(400).json({ error: "emails array required" });
    const enrolled = [];
    const skipped = [];
    for (const email of emails) {
      const userRes = await db.query("SELECT id FROM users WHERE email=$1", [
        email.trim(),
      ]);
      if (!userRes.rows.length) {
        skipped.push(email);
        continue;
      }
      const userId = userRes.rows[0].id;
      await db.query(
        `INSERT INTO enrollments (user_id, course_id, status) VALUES ($1,$2,'yet_to_start') ON CONFLICT DO NOTHING`,
        [userId, req.params.id],
      );
      enrolled.push(email);
    }
    res.json({ enrolled, skipped });
  } catch (err) {
    res.status(500).json({ error: "Failed to add attendees" });
  }
};

exports.getAttendees = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, e.status, e.enrolled_at
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.course_id = $1
       ORDER BY e.enrolled_at DESC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attendees" });
  }
};

exports.contactAttendees = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const result = await db.query(
      "SELECT u.email FROM enrollments e JOIN users u ON u.id=e.user_id WHERE e.course_id=$1",
      [req.params.id],
    );
    const emails = result.rows.map((r) => r.email);
    console.log(
      `[Email Simulation] Subject: ${subject}\nMessage: ${message}\nSending to:`,
      emails,
    );
    res.json({ sent: emails.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to contact attendees" });
  }
};

// Public endpoints
exports.getPublicCourses = async (req, res) => {
  try {
    const { q } = req.query;
    const params = [];
    let conditions = ["c.is_published = true"];

    if (!req.user) {
      conditions.push(`c.visibility = 'everyone'`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(
        `(c.title ILIKE $${params.length} OR c.short_description ILIKE $${params.length})`,
      );
    }

    const query = `
      ${courseSelect}
      WHERE ${conditions.join(" AND ")}
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, params);

    let courses = result.rows;
    if (req.user) {
      const enrollRes = await db.query(
        "SELECT course_id, status FROM enrollments WHERE user_id=$1",
        [req.user.id],
      );
      const purchaseRes = await db.query(
        "SELECT course_id FROM purchases WHERE user_id=$1",
        [req.user.id],
      );
      // Get completion percent per course
      const progressRes = await db.query(
        `SELECT l.course_id,
                COUNT(l.id) AS total,
                COUNT(lp.id) FILTER (WHERE lp.status = 'completed') AS completed
         FROM lessons l
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
         GROUP BY l.course_id`,
        [req.user.id],
      );
      const progressMap = {};
      progressRes.rows.forEach((r) => {
        progressMap[r.course_id] =
          r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
      });
      const enrollMap = {};
      enrollRes.rows.forEach((e) => (enrollMap[e.course_id] = e.status));
      const purchasedSet = new Set(purchaseRes.rows.map((p) => p.course_id));
      courses = courses.map((c) => ({
        ...c,
        enrollment_status: enrollMap[c.id] || null,
        is_purchased: purchasedSet.has(c.id),
        completion_percent: progressMap[c.id] ?? 0,
      }));
    }
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.getPublicCourse = async (req, res) => {
  try {
    const isPrivileged =
      req.user?.role === "admin" || req.user?.role === "instructor";

    // Check enrollment first for learners (enrolled learners can access even unpublished)
    let isEnrolled = false;
    if (req.user && !isPrivileged) {
      const eCheck = await db.query(
        "SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2",
        [req.user.id, req.params.id],
      );
      isEnrolled = eCheck.rows.length > 0;
    }

    const publishFilter =
      isPrivileged || isEnrolled ? "" : "AND c.is_published=true";
    const result = await db.query(
      courseSelect + ` WHERE c.id=$1 ${publishFilter} GROUP BY c.id, u.name`,
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Course not found" });
    const course = result.rows[0];
    if (!req.user && course.visibility === "signed_in") {
      return res
        .status(403)
        .json({ error: "Please sign in to view this course" });
    }

    let enrollment = null;
    let is_purchased = false;
    if (req.user) {
      const eRes = await db.query(
        "SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2",
        [req.user.id, req.params.id],
      );
      enrollment = eRes.rows[0] || null;
      const pRes = await db.query(
        "SELECT id FROM purchases WHERE user_id=$1 AND course_id=$2",
        [req.user.id, req.params.id],
      );
      is_purchased = pRes.rows.length > 0;
    }

    const lessonsRes = await db.query(
      `SELECT l.id, l.title, l.type, l.position, l.duration_seconds,
              l.video_url, l.file_url, l.description, l.allow_download,
              COALESCE(
                json_agg(json_build_object('id',la.id,'label',la.label,'url',la.url,'type',la.type))
                FILTER (WHERE la.id IS NOT NULL), '[]'
              ) AS attachments
       FROM lessons l
       LEFT JOIN lesson_attachments la ON la.lesson_id = l.id
       WHERE l.course_id=$1
       GROUP BY l.id
       ORDER BY l.position`,
      [req.params.id],
    );

    let lessonProgress = [];
    if (req.user) {
      const lpRes = await db.query(
        "SELECT lesson_id, status FROM lesson_progress WHERE user_id=$1 AND course_id=$2",
        [req.user.id, req.params.id],
      );
      lessonProgress = lpRes.rows;
    }

    const lpMap = {};
    lessonProgress.forEach((lp) => (lpMap[lp.lesson_id] = lp.status));
    const lessons = lessonsRes.rows.map((l) => ({
      ...l,
      progress_status: lpMap[l.id] || "not_started",
    }));

    const reviewsRes = await db.query(
      `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.course_id=$1 ORDER BY r.created_at DESC`,
      [req.params.id],
    );

    res.json({
      ...course,
      lessons,
      enrollment,
      is_purchased,
      reviews: reviewsRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const courseRes = await db.query("SELECT * FROM courses WHERE id=$1", [
      req.params.id,
    ]);
    if (!courseRes.rows.length)
      return res.status(404).json({ error: "Course not found" });
    const course = courseRes.rows[0];
    if (course.access_rule === "payment") {
      return res
        .status(403)
        .json({ error: "Please purchase this course to enroll" });
    }
    await db.query(
      `INSERT INTO enrollments (user_id, course_id, status) VALUES ($1,$2,'yet_to_start') ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id],
    );
    res.json({ message: "Enrolled successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to enroll" });
  }
};

exports.incrementView = async (req, res) => {
  try {
    await db.query(
      "UPDATE courses SET views_count = views_count + 1 WHERE id=$1",
      [req.params.id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to increment view" });
  }
};

exports.getPublicStats = async (req, res) => {
  try {
    const courses = await db.query(
      "SELECT COUNT(*) FROM courses WHERE is_published=true",
    );
    const learners = await db.query(
      "SELECT COUNT(*) FROM users WHERE role='learner'",
    );
    const lessons = await db.query(
      "SELECT COUNT(*) FROM lessons l JOIN courses c ON c.id=l.course_id WHERE c.is_published=true",
    );
    res.json({
      total_courses: parseInt(courses.rows[0].count),
      total_learners: parseInt(learners.rows[0].count),
      lessons_published: parseInt(lessons.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
