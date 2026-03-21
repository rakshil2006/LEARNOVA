const router = require("express").Router();
const courseController = require("../controllers/courseController");
const {
  authMiddleware,
  optionalAuth,
} = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../config/multer");

// Public routes
router.get("/public/courses", optionalAuth, courseController.getPublicCourses);
router.get(
  "/public/courses/:id",
  optionalAuth,
  courseController.getPublicCourse,
);
router.post(
  "/public/courses/:id/enroll",
  authMiddleware,
  courseController.enrollCourse,
);
router.post("/public/courses/:id/view", courseController.incrementView);
router.get("/public/stats", courseController.getPublicStats);

// Admin/Instructor routes
router.get(
  "/courses",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.getCourses,
);
router.post(
  "/courses",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.createCourse,
);
router.get(
  "/courses/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.getCourse,
);
router.put(
  "/courses/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.updateCourse,
);
router.delete(
  "/courses/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.deleteCourse,
);
router.patch(
  "/courses/:id/publish",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.publishCourse,
);
router.post(
  "/courses/:id/cover",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  upload.single("cover"),
  courseController.uploadCover,
);
router.get(
  "/courses/:id/share-link",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.getShareLink,
);
router.post(
  "/courses/:id/attendees",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.addAttendees,
);
router.get(
  "/courses/:id/attendees",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.getAttendees,
);
router.post(
  "/courses/:id/contact",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  courseController.contactAttendees,
);

module.exports = router;
