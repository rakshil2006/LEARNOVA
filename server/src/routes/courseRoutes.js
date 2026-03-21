const router = require("express").Router();
const c = require("../controllers/courseController");
const {
  authMiddleware,
  optionalAuth,
} = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../config/multer");

// Public routes
router.get("/public/courses", optionalAuth, c.getPublicCourses);
router.get("/public/courses/:id", optionalAuth, c.getPublicCourse);
router.post("/public/courses/:id/enroll", authMiddleware, c.enrollCourse);
router.post("/public/courses/:id/view", c.incrementView);
router.get("/public/stats", c.getPublicStats);

// Admin/Instructor routes
router.get(
  "/courses",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.getCourses,
);
router.post(
  "/courses",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.createCourse,
);
router.get(
  "/courses/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.getCourse,
);
router.put(
  "/courses/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.updateCourse,
);
router.delete(
  "/courses/:id",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.deleteCourse,
);
router.patch(
  "/courses/:id/publish",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.publishCourse,
);
router.post(
  "/courses/:id/cover",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  upload.single("cover"),
  c.uploadCover,
);
router.get(
  "/courses/:id/share-link",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.getShareLink,
);
router.post(
  "/courses/:id/attendees",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.addAttendees,
);
router.get(
  "/courses/:id/attendees",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.getAttendees,
);
router.post(
  "/courses/:id/contact",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  c.contactAttendees,
);

module.exports = router;
