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
    const { name, email, password } = req.body; // role is always 'learner' on self-register
    const existing = await db.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length)
      return res.status(409).json({ error: "Email already registered" });
    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role",
      [name, email, password_hash, "learner"],
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
