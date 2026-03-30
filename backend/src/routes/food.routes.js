const express = require("express");
const foodController = require("../controllers/food.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

/* POST /api/food/ [protected - food partner only] */
router.post(
  "/",
  authMiddleware.authFoodPartnerMiddleware,
  upload.single("mama"),
  foodController.createFood,
);

/* GET /api/food/ [public] ✅ FIXED */
router.get("/", foodController.getFoodItems);

/* POST /api/food/like [protected] */
router.post(
  "/like",
  authMiddleware.authUserOrPartnerMiddleware, // ✅ UPDATED
  foodController.likeFood,
);

/* POST /api/food/save [protected] */
router.post(
  "/save",
  authMiddleware.authUserOrPartnerMiddleware, // ✅ UPDATED
  foodController.saveFood,
);

/* GET /api/food/save [protected] */
router.get(
  "/save",
  authMiddleware.authUserOrPartnerMiddleware, // ✅ UPDATED
  foodController.getSaveFood,
);

// GET /api/food/comments/:reelId [public]
router.get("/comments/:reelId", foodController.getCommentsByReel);

module.exports = router;
