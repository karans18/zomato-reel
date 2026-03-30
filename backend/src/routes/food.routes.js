const express = require("express");
const multer = require("multer");

const foodController = require("../controllers/food.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();
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

/* GET /api/food/ [public] */
router.get("/", foodController.getFoodItems);

/* POST /api/food/like [protected] */
router.post(
  "/like",
  authMiddleware.authUserOrPartnerMiddleware,
  foodController.likeFood,
);

/* POST /api/food/save [protected] */
router.post(
  "/save",
  authMiddleware.authUserOrPartnerMiddleware,
  foodController.saveFood,
);

/* GET /api/food/save [protected] */
router.get(
  "/save",
  authMiddleware.authUserOrPartnerMiddleware,
  foodController.getSaveFood,
);

/* GET /api/food/comments/:reelId [public] */
router.get("/comments/:reelId", foodController.getCommentsByReel);

/* GET /api/food/cart [protected - user only] */
router.get(
  "/cart",
  authMiddleware.authUserMiddleware,
  foodController.getCart,
);

/* POST /api/food/cart [protected - user only] */
router.post(
  "/cart",
  authMiddleware.authUserMiddleware,
  foodController.addToCart,
);

/* DELETE /api/food/cart/:foodId [protected - user only] */
router.delete(
  "/cart/:foodId",
  authMiddleware.authUserMiddleware,
  foodController.removeFromCart,
);

module.exports = router;
