const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// user auth APIs
router.post("/user/register", authController.registerUser);
router.post("/user/login", authController.loginUser);
router.get("/user/logout", authController.logoutUser);

// food partner auth APIs
router.post("/food-partner/register", authController.registerFoodPartner);
router.post("/food-partner/login", authController.loginFoodPartner);
router.get("/food-partner/logout", authController.logoutFoodPartner);
router.get(
  "/me",
  authMiddleware.authUserOrPartnerMiddleware,
  authController.getMe
);

// get current user
router;
module.exports = router;
