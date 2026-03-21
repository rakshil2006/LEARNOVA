const router = require("express").Router({ mergeParams: true });
const qc = require("../controllers/quizController");
const { authMiddleware } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.getQuizzes,
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.createQuiz,
);
router.get("/:id", authMiddleware, qc.getQuiz);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.updateQuiz,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.deleteQuiz,
);
router.post(
  "/:id/questions",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.addQuestion,
);
router.put(
  "/:quizId/questions/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.updateQuestion,
);
router.delete(
  "/:quizId/questions/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.deleteQuestion,
);
router.put(
  "/:id/rewards",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  qc.setRewards,
);

module.exports = router;
