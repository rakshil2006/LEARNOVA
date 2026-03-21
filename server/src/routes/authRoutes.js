const router = require("express").Router();
const {
  register,
  login,
  logout,
  refresh,
  me,
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

module.exports = router;
