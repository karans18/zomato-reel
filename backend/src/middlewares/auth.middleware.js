const foodPartnerModel = require("../models/foodpartner.model");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authFoodPartnerMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const foodPartner = await foodPartnerModel.findById(decoded.id).select('-password');

        if (!foodPartner) {
            return res.status(401).json({ message: "Account not found. Please login again." });
        }

        req.foodPartner = foodPartner;
        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }
}

async function authUserMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: "Account not found. Please login again." });
        }

        req.user = user;
        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }
}

async function authUserOrPartnerMiddleware(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [user, foodPartner] = await Promise.all([
            userModel.findById(decoded.id).select('-password'),
            foodPartnerModel.findById(decoded.id).select('-password'),
        ]);

        if (user) req.user = user;
        if (foodPartner) req.foodPartner = foodPartner;

        if (!user && !foodPartner) {
            return res.status(401).json({ message: "Invalid token" });
        }

        next();
    } catch (err) {
        res.status(401).json({ message: "Auth failed" });
    }
}

module.exports = {
    authFoodPartnerMiddleware,
    authUserMiddleware,
    authUserOrPartnerMiddleware
};
