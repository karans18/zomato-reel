const foodModel = require("../models/food.model");
const storageService = require("../services/storage.service");
const likeModel = require("../models/likes.model");
const saveModel = require("../models/save.model");
const commentModel = require("../models/comments.model");
const cartModel = require("../models/cart.model");
const { v4: uuid } = require("uuid");
const { normalizeComment } = require("../utils/comment.utils");

async function buildCommentCountMap(reelIds = []) {
  if (reelIds.length === 0) {
    return new Map();
  }

  const commentCounts = await commentModel.aggregate([
    {
      $match: {
        reel: {
          $in: reelIds,
        },
      },
    },
    {
      $group: {
        _id: "$reel",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return new Map(commentCounts.map(({ _id, count }) => [String(_id), count]));
}

function normalizeCart(cart) {
  const items = Array.isArray(cart?.items)
    ? cart.items.filter((item) => item?.food?._id)
    : [];

  return {
    _id: cart?._id ?? null,
    user: cart?.user ?? null,
    items,
    totalItems: items.reduce(
      (total, item) => total + Math.max(item.quantity ?? 0, 0),
      0,
    ),
  };
}

async function getPopulatedCart(userId) {
  return cartModel.findOne({ user: userId }).populate("items.food").lean();
}

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

async function getFoodItems(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const foodItems = await foodModel
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const commentCountMap = await buildCommentCountMap(
      foodItems.map((item) => item._id),
    );

    res.status(200).json({
      message: "Food items fetched successfully",
      foodItems: foodItems.map((item) => ({
        ...item,
        commentsCount: commentCountMap.get(String(item._id)) ?? 0,
      })),
    });
  } catch (err) {
    console.error("getFoodItems error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

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

async function getSaveFood(req, res) {
  try {
    const user = req.user || req.foodPartner;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const savedFoods = await saveModel
      .find({ user: user._id })
      .populate("food")
      .lean();

    const commentCountMap = await buildCommentCountMap(
      savedFoods.map((item) => item.food?._id).filter(Boolean),
    );

    res.status(200).json({
      message: "Saved foods retrieved successfully",
      savedFoods: savedFoods.map((item) => {
        if (!item.food?._id) {
          return item;
        }

        return {
          ...item,
          food: {
            ...item.food,
            commentsCount: commentCountMap.get(String(item.food._id)) ?? 0,
          },
        };
      }),
    });
  } catch (err) {
    console.error("getSaveFood error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

async function getCommentsByReel(req, res) {
  try {
    const comments = await commentModel
      .find({ reel: req.params.reelId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Comments fetched successfully",
      comments: comments.map(normalizeComment),
    });
  } catch (err) {
    console.error("getCommentsByReel error:", err);
    res.status(500).json({ message: err.message });
  }
}

async function getCart(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cart = await getPopulatedCart(user._id);

    res.status(200).json({
      message: "Cart fetched successfully",
      cart: normalizeCart(cart),
    });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ message: err.message });
  }
}

async function addToCart(req, res) {
  try {
    const { foodId } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!foodId) {
      return res.status(400).json({ message: "foodId is required" });
    }

    const foodExists = await foodModel.exists({ _id: foodId });

    if (!foodExists) {
      return res.status(404).json({ message: "Food item not found" });
    }

    let cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      cart = await cartModel.create({
        user: user._id,
        items: [{ food: foodId, quantity: 1 }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.food.toString() === foodId,
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ food: foodId, quantity: 1 });
      }

      await cart.save();
    }

    const populatedCart = await getPopulatedCart(user._id);

    res.status(200).json({
      message: "Item added to cart successfully",
      cart: normalizeCart(populatedCart),
    });
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createFood,
  getFoodItems,
  likeFood,
  saveFood,
  getSaveFood,
  getCommentsByReel,
  getCart,
  addToCart,
};
