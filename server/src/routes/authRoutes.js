const router = require("express").Router();
const {
  register,
  login,
  logout,
  refresh,
  me,
  getSecurityQuestion,
  resetPasswordWithSecurityAnswer,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later" },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, me);
router.post("/forgot-password/question", authLimiter, getSecurityQuestion);
router.post(
  "/forgot-password/reset",
  authLimiter,
  resetPasswordWithSecurityAnswer,
);

module.exports = router;
