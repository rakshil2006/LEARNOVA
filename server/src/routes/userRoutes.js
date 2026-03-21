const router = require("express").Router();
const uc = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  uc.getUsers,
);
router.get("/:id", authMiddleware, uc.getUser);
router.put("/:id", authMiddleware, uc.updateUser);
router.get("/:id/badges", authMiddleware, uc.getUserBadges);

module.exports = router;
