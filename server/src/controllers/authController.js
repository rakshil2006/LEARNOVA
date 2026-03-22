const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, security_question, security_answer } =
      req.body;
    const existing = await db.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length)
      return res.status(409).json({ error: "Email already registered" });
    const password_hash = await bcrypt.hash(password, 12);
    const sq = security_question || null;
    const sa_hash = security_answer
      ? await bcrypt.hash(security_answer.trim().toLowerCase(), 12)
      : null;
    const result = await db.query(
      "INSERT INTO users (name, email, password_hash, role, security_question, security_answer_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role",
      [name, email, password_hash, role || "learner", sq, sa_hash],
    );
    res
      .status(201)
      .json({ message: "Registration successful", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Invalid email or password" });
    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        total_points: user.total_points,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

exports.refresh = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken } = generateTokens(decoded);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role, avatar_url, total_points, created_at FROM users WHERE id=$1",
      [req.user.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Step 1 — look up email, return the security question (never the answer)
exports.getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await db.query(
      "SELECT security_question FROM users WHERE email=$1",
      [email],
    );
    const user = result.rows[0];
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found with that email" });
    if (!user.security_question)
      return res
        .status(400)
        .json({ error: "No security question set for this account" });
    res.json({ security_question: user.security_question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Step 2 — verify answer + set new password
exports.resetPasswordWithSecurityAnswer = async (req, res) => {
  try {
    const { email, security_answer, new_password } = req.body;
    if (!email || !security_answer || !new_password)
      return res.status(400).json({ error: "All fields are required" });
    if (new_password.length < 8)
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });

    const result = await db.query(
      "SELECT id, security_answer_hash FROM users WHERE email=$1",
      [email],
    );
    const user = result.rows[0];
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found with that email" });
    if (!user.security_answer_hash)
      return res
        .status(400)
        .json({ error: "No security question set for this account" });

    const match = await bcrypt.compare(
      security_answer.trim().toLowerCase(),
      user.security_answer_hash,
    );
    if (!match) return res.status(401).json({ error: "Incorrect answer" });

    const password_hash = await bcrypt.hash(new_password, 12);
    await db.query(
      "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2",
      [password_hash, user.id],
    );
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
