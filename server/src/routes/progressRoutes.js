const router = require("express").Router();
const pc = require("../controllers/progressController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.patch("/lessons/:lessonId", authMiddleware, pc.updateLessonProgress);
router.post("/quizzes/:quizId/attempt", authMiddleware, pc.submitQuizAttempt);
router.get("/courses/:courseId", authMiddleware, pc.getCourseProgress);
router.patch("/courses/:courseId/complete", authMiddleware, pc.completeCourse);

module.exports = router;
