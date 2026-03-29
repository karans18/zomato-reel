const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── User Auth ────────────────────────────────────────────────────────────────

async function registerUser(req, res) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const isUserAlreadyExists = await userModel.findOne({ email });
    if (isUserAlreadyExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      fullName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "User registered successfully",
      user: { _id: user._id, email: user.email, fullName: user.fullName },
    });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "User logged in successfully",
      user: { _id: user._id, email: user.email, fullName: user.fullName },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

function logoutUser(req, res) {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
}

// ─── Food Partner Auth ────────────────────────────────────────────────────────

async function registerFoodPartner(req, res) {
  try {
    const { name, email, password, phone, address, contactName } = req.body;

    if (!name || !email || !password || !phone || !address || !contactName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const isAccountAlreadyExists = await foodPartnerModel.findOne({ email });
    if (isAccountAlreadyExists) {
      return res
        .status(400)
        .json({ message: "Food partner account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const foodPartner = await foodPartnerModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      contactName,
    });

    const token = jwt.sign({ id: foodPartner._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "Food partner registered successfully",
      foodPartner: {
        _id: foodPartner._id,
        email: foodPartner.email,
        name: foodPartner.name,
        address: foodPartner.address,
        contactName: foodPartner.contactName,
        phone: foodPartner.phone,
      },
    });
  } catch (err) {
    console.error("registerFoodPartner error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

async function loginFoodPartner(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const foodPartner = await foodPartnerModel.findOne({ email });
    if (!foodPartner) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      foodPartner.password,
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: foodPartner._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Food partner logged in successfully",
      foodPartner: {
        _id: foodPartner._id,
        email: foodPartner.email,
        name: foodPartner.name,
      },
    });
  } catch (err) {
    console.error("loginFoodPartner error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

function logoutFoodPartner(req, res) {
  res.clearCookie("token");
  res.status(200).json({ message: "Food partner logged out successfully" });
}

function getMe(req, res) {
  const user = req.user || req.foodPartner;

  if (!user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.status(200).json({ user });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  registerFoodPartner,
  loginFoodPartner,
  logoutFoodPartner,
    getMe,
};
