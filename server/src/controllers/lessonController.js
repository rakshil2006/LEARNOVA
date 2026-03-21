const db = require("../config/db");

exports.getLessons = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, 
        json_agg(json_build_object('id',la.id,'type',la.type,'label',la.label,'url',la.url) ORDER BY la.id) 
          FILTER (WHERE la.id IS NOT NULL) AS attachments
       FROM lessons l
       LEFT JOIN lesson_attachments la ON la.lesson_id = l.id
       WHERE l.course_id=$1
       GROUP BY l.id
       ORDER BY l.position`,
      [req.params.courseId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
};

exports.createLesson = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      video_url,
      duration_seconds,
      allow_download,
      responsible_id,
    } = req.body;
    const courseId = req.params.courseId;
    const posRes = await db.query(
      "SELECT COALESCE(MAX(position),0)+1 AS pos FROM lessons WHERE course_id=$1",
      [courseId],
    );
    const position = posRes.rows[0].pos;
    const result = await db.query(
      `INSERT INTO lessons (course_id, title, type, description, video_url, duration_seconds, allow_download, responsible_id, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        courseId,
        title,
        type,
        description,
        video_url,
        duration_seconds || null,
        allow_download || false,
        responsible_id || null,
        position,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create lesson" });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      video_url,
      duration_seconds,
      allow_download,
      responsible_id,
    } = req.body;
    const result = await db.query(
      `UPDATE lessons SET
        title=COALESCE($1,title), type=COALESCE($2,type), description=COALESCE($3,description),
        video_url=COALESCE($4,video_url), duration_seconds=COALESCE($5,duration_seconds),
        allow_download=COALESCE($6,allow_download), responsible_id=COALESCE($7,responsible_id),
        updated_at=NOW()
       WHERE id=$8 AND course_id=$9 RETURNING *`,
      [
        title,
        type,
        description,
        video_url,
        duration_seconds,
        allow_download,
        responsible_id,
        req.params.id,
        req.params.courseId,
      ],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Lesson not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update lesson" });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    await db.query("DELETE FROM lessons WHERE id=$1 AND course_id=$2", [
      req.params.id,
      req.params.courseId,
    ]);
    res.json({ message: "Lesson deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lesson" });
  }
};

exports.uploadLessonFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    await db.query(
      "UPDATE lessons SET file_url=$1, updated_at=NOW() WHERE id=$2",
      [url, req.params.id],
    );
    res.json({ file_url: url });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload file" });
  }
};

exports.addAttachment = async (req, res) => {
  try {
    const { type, label, url } = req.body;
    let attachUrl = url;
    if (req.file) attachUrl = `/uploads/${req.file.filename}`;
    const result = await db.query(
      "INSERT INTO lesson_attachments (lesson_id, type, label, url) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.params.id, type, label, attachUrl],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add attachment" });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM lesson_attachments WHERE id=$1 AND lesson_id=$2",
      [req.params.attachmentId, req.params.lessonId],
    );
    res.json({ message: "Attachment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};

exports.reorderLessons = async (req, res) => {
  try {
    const { lessonIds } = req.body;
    for (let i = 0; i < lessonIds.length; i++) {
      await db.query(
        "UPDATE lessons SET position=$1 WHERE id=$2 AND course_id=$3",
        [i, lessonIds[i], req.params.courseId],
      );
    }
    res.json({ message: "Reordered" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reorder lessons" });
  }
};
