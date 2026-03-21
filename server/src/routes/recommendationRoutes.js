const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getRecommendations,
} = require("../controllers/recommendationController");

router.get(
  "/recommendations",
  authMiddleware,
  roleMiddleware("learner"),
  getRecommendations,
);

module.exports = router;
