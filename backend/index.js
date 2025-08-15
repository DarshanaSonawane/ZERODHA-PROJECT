// ------------------- index.js -------------------
require("dotenv").config(); // load .env at the very top

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Import models
const { HoldingsModel } = require("./model/HoldingModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL; // ensure your .env has this variable

// ------------------- Middleware -------------------
app.use(cors());
app.use(bodyParser.json());

// ------------------- API Routes -------------------

// Sample route to add positions
app.get("/addPositions", async (req, res) => {
  let tempPositions = [
    { product: "CNC", name: "EVEREADY", qty: 2, avg: 316.27, price: 312.35, net: "+0.58%", day: "-1.24%", isLoss: true },
    { product: "CNC", name: "JUBLFOOD", qty: 1, avg: 3124.75, price: 3082.65, net: "+10.04%", day: "-1.35%", isLoss: true },
  ];

  try {
    for (const item of tempPositions) {
      let newPosition = new PositionsModel(item);
      await newPosition.save();
    }
    res.send("Positions added!");
  } catch (err) {
    res.status(500).json({ error: "Failed to add positions" });
  }
});

// Fetch all holdings
app.get("/allHoldings", async (req, res) => {
  const allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

// Fetch all positions
app.get("/allPositions", async (req, res) => {
  const allPositions = await PositionsModel.find({});
  res.json(allPositions);
});

// Create new order
app.post("/newOrder", async (req, res) => {
  try {
    const newOrder = new OrdersModel(req.body);
    await newOrder.save();
    res.json({ message: "Order saved!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save order" });
  }
});

// ---------- SIGNUP API ----------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new UserModel({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ------------------- Connect to MongoDB -------------------
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ------------------- Start Server -------------------
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
