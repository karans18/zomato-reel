const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const foodRoutes = require("./routes/food.routes");
const foodPartnerRoutes = require("./routes/food-partner.routes");
const cors = require("cors");
const { corsOptions } = require("./config/client.config");

const app = express();
app.set("trust proxy", 1);

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Food View API is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/food-partner", foodPartnerRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
