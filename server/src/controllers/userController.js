const db = require("../config/db");

exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role, avatar_url, total_points, created_at FROM users ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role, avatar_url, total_points, created_at FROM users WHERE id=$1",
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const targetId = parseInt(req.params.id);

    if (req.user.id !== targetId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Role change rules: only admin can change roles, but not their own, and not other admins
    let role = undefined;
    if (req.body.role && req.user.role === "admin") {
      if (req.user.id === targetId) {
        return res
          .status(400)
          .json({ error: "You cannot change your own role" });
      }
      const targetRes = await db.query("SELECT role FROM users WHERE id=$1", [
        targetId,
      ]);
      if (targetRes.rows[0]?.role === "admin") {
        return res
          .status(400)
          .json({ error: "Cannot change role of another admin" });
      }
      role = req.body.role;
    }

    const result = await db.query(
      `UPDATE users SET name=COALESCE($1,name), avatar_url=COALESCE($2,avatar_url),
        role=COALESCE($3,role), updated_at=NOW()
       WHERE id=$4 RETURNING id,name,email,role,avatar_url,total_points`,
      [name, avatar_url, role || null, targetId],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

exports.getUserBadges = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT total_points FROM users WHERE id=$1",
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "User not found" });
    const { total_points } = result.rows[0];

    const BADGE_LEVELS = [
      { name: "Newbie", minPoints: 0, icon: "🌱" },
      { name: "Explorer", minPoints: 20, icon: "🧭" },
      { name: "Achiever", minPoints: 40, icon: "🎯" },
      { name: "Specialist", minPoints: 60, icon: "🔧" },
      { name: "Expert", minPoints: 80, icon: "💡" },
      { name: "Master", minPoints: 100, icon: "🏆" },
    ];

    const currentBadge = [...BADGE_LEVELS]
      .reverse()
      .find((b) => total_points >= b.minPoints);
    const nextBadge =
      BADGE_LEVELS.find((b) => b.minPoints > total_points) || null;

    res.json({
      total_points,
      current_badge: currentBadge,
      next_badge: nextBadge,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch badges" });
  }
};
