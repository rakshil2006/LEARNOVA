const router = require("express").Router({ mergeParams: true });
const rc = require("../controllers/reviewController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", rc.getReviews);
router.post("/", authMiddleware, rc.addReview);
router.put("/:id", authMiddleware, rc.updateReview);

module.exports = router;
