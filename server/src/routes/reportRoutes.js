const router = require("express").Router();
const { getReport } = require("../controllers/reportController");
const { authMiddleware } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "instructor"),
  getReport,
);

module.exports = router;
