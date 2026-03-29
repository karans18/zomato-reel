const foodModel = require("../models/food.model");
const storageService = require("../services/storage.service");
const likeModel = require("../models/likes.model");
const saveModel = require("../models/save.model");
const { v4: uuid } = require("uuid");

// ✅ CREATE FOOD
async function createFood(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    if (!req.body.name) {
      return res.status(400).json({ message: "Food name is required" });
    }

    if (!req.foodPartner) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fileUploadResult = await storageService.uploadFile(
      req.file.buffer,
      uuid(),
    );

    const foodItem = await foodModel.create({
      name: req.body.name,
      description: req.body.description || "",
      video: fileUploadResult.url,
      foodPartner: req.foodPartner._id,
    });

    res.status(201).json({
      message: "Food created successfully",
      food: foodItem,
    });
  } catch (err) {
    console.error("createFood error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

// ✅ GET FOOD ITEMS (PAGINATION)
async function getFoodItems(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const foodItems = await foodModel
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Food items fetched successfully",
      foodItems,
    });
  } catch (err) {
    console.error("getFoodItems error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

// ✅ LIKE FOOD
async function likeFood(req, res) {
  try {
    const { foodId } = req.body;
    const user = req.user || req.foodPartner;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!foodId) {
      return res.status(400).json({ message: "foodId is required" });
    }

    const isAlreadyLiked = await likeModel.findOne({
      user: user._id,
      food: foodId,
    });

    if (isAlreadyLiked) {
      await likeModel.deleteOne({
        user: user._id,
        food: foodId,
      });

      await foodModel.findByIdAndUpdate(foodId, {
        $inc: { likeCount: -1 },
      });

      return res.status(200).json({
        message: "Food unliked successfully",
        like: false,
      });
    }

    await likeModel.create({
      user: user._id,
      food: foodId,
    });

    await foodModel.findByIdAndUpdate(foodId, {
      $inc: { likeCount: 1 },
    });

    res.status(201).json({
      message: "Food liked successfully",
      like: true,
    });
  } catch (err) {
    console.error("likeFood error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

// ✅ SAVE FOOD
async function saveFood(req, res) {
  try {
    const { foodId } = req.body;
    const user = req.user || req.foodPartner;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!foodId) {
      return res.status(400).json({ message: "foodId is required" });
    }

    const isAlreadySaved = await saveModel.findOne({
      user: user._id,
      food: foodId,
    });

    if (isAlreadySaved) {
      await saveModel.deleteOne({
        user: user._id,
        food: foodId,
      });

      await foodModel.findByIdAndUpdate(foodId, {
        $inc: { savesCount: -1 },
      });

      return res.status(200).json({
        message: "Food unsaved successfully",
        save: false,
      });
    }

    await saveModel.create({
      user: user._id,
      food: foodId,
    });

    await foodModel.findByIdAndUpdate(foodId, {
      $inc: { savesCount: 1 },
    });

    res.status(201).json({
      message: "Food saved successfully",
      save: true,
    });
  } catch (err) {
    console.error("saveFood error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

// ✅ GET SAVED FOODS
async function getSaveFood(req, res) {
  try {
    const user = req.user || req.foodPartner;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const savedFoods = await saveModel
      .find({ user: user._id })
      .populate("food");

    res.status(200).json({
      message: "Saved foods retrieved successfully",
      savedFoods: savedFoods || [],
    });
  } catch (err) {
    console.error("getSaveFood error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

module.exports = {
  createFood,
  getFoodItems,
  likeFood,
  saveFood,
  getSaveFood,
};
