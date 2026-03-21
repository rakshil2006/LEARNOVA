const router = require("express").Router({ mergeParams: true });
const pc = require("../controllers/purchaseController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, pc.purchase);
router.get("/", authMiddleware, pc.checkPurchase);

module.exports = router;
