const router = require("express").Router({ mergeParams: true });
const lc = require("../controllers/lessonController");
const { authMiddleware } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../config/multer");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  lc.getLessons,
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  lc.createLesson,
);
router.patch(
  "/reorder",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  lc.reorderLessons,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  lc.updateLesson,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  lc.deleteLesson,
);
router.post(
  "/:id/file",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  upload.single("file"),
  lc.uploadLessonFile,
);
router.post(
  "/:id/attachments",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  upload.single("file"),
  lc.addAttachment,
);
router.delete(
  "/:lessonId/attachments/:attachmentId",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  lc.deleteAttachment,
);

module.exports = router;
