const router = require("express").Router();
const progressController = require("../controllers/progressController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.patch(
  "/lessons/:lessonId",
  authMiddleware,
  progressController.updateLessonProgress,
);
router.post(
  "/quizzes/:quizId/attempt",
  authMiddleware,
  progressController.submitQuizAttempt,
);
router.get(
  "/courses/:courseId",
  authMiddleware,
  progressController.getCourseProgress,
);
router.patch(
  "/courses/:courseId/complete",
  authMiddleware,
  progressController.completeCourse,
);

module.exports = router;
