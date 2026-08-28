// ------------------- index.js -------------------
require("dotenv").config(); // load .env at the very top

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

// ------------------- Socket.io (real-time prices) -------------------
const http = require("http");
const { Server } = require("socket.io");
const STOCKS = require("./stockData");

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

// ------------------- HTTP server + Socket.io -------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // fine for local dev — restrict before deploying
});

// Simulated price ticker: nudges each stock by up to ±0.2% every 2.5s
const livePrices = new Map(STOCKS.map((s) => [s.name, s.price]));
const TICK_MS = 2500;

setInterval(() => {
  const updates = [];

  livePrices.forEach((price, name) => {
    const maxMove = price * 0.002;
    const newPrice = +(price + (Math.random() * 2 - 1) * maxMove).toFixed(2);
    if (newPrice === price) return;

    livePrices.set(name, newPrice);
    updates.push({
      name,
      price: newPrice,
      change: +(((newPrice - price) / price) * 100).toFixed(2), // signed %
    });
  });

  if (updates.length > 0) {
    io.emit("priceUpdate", updates);
  }
}, TICK_MS);

io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
});

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

// Fetch all holdings (protected)
app.get("/allHoldings", authMiddleware, async (req, res) => {
  const allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

// Fetch all positions
app.get("/allPositions", async (req, res) => {
  const allPositions = await PositionsModel.find({});
  res.json(allPositions);
});

// Create new order (protected)
app.post("/newOrder", authMiddleware, async (req, res) => {
  try {
    const { name, mode } = req.body;
    const qty = Number(req.body.qty);
    const price = Number(req.body.price);

    // ---------- input validation ----------
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Instrument name is required" });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ message: "qty must be a number greater than 0" });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res
        .status(400)
        .json({ message: "price must be a number greater than 0" });
    }
    if (mode !== "BUY" && mode !== "SELL") {
      return res
        .status(400)
        .json({ message: 'mode must be either "BUY" or "SELL"' });
    }

    const newOrder = new OrdersModel({
      name: String(name).trim(),
      qty,
      price,
      mode,
    });
    await newOrder.save();
    res.json({ message: "Order saved!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save order" });
  }
});

// Fetch all orders, newest first (protected)
app.get("/allOrders", authMiddleware, async (req, res) => {
  const allOrders = await OrdersModel.find({}).sort({ createdAt: -1 });
  res.json(allOrders);
});

// ---------- PORTFOLIO INSIGHT (Gemini AI, protected) ----------
// Simple per-user in-memory cache: { [userId]: { text, timestamp } }
const insightCache = new Map();
const INSIGHT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

app.post("/portfolio-insight", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const force = req.query.force === "true";

    // Serve from cache unless ?force=true explicitly skips the check
    if (!force) {
      const cached = insightCache.get(userId);
      if (cached && Date.now() - cached.timestamp < INSIGHT_CACHE_TTL_MS) {
        return res.json({
          insight: cached.text,
          generatedAt: new Date(cached.timestamp).toISOString(),
          cached: true,
        });
      }
      // Stale entry — drop it so a fresh one replaces it below
      insightCache.delete(userId);
    }

    const holdings = await HoldingsModel.find({});

    if (!holdings || holdings.length === 0) {
      return res
        .status(400)
        .json({ message: "No holdings found to analyze" });
    }

    // Enrich each holding with computed metrics so the model has context
    const enriched = holdings.map((h) => {
      const invested = h.avg * h.qty;
      const current = h.price * h.qty;
      return {
        name: h.name,
        qty: h.qty,
        avgCost: h.avg,
        currentPrice: h.price,
        invested: +invested.toFixed(2),
        currentValue: +current.toFixed(2),
        pnl: +(current - invested).toFixed(2),
        netChangePercent: h.net,
      };
    });

    const totalInvested = enriched.reduce((s, h) => s + h.invested, 0);
    const totalCurrent = enriched.reduce((s, h) => s + h.currentValue, 0);

    const prompt = `Here is a user's stock portfolio as JSON:\n${JSON.stringify(
      enriched,
      null,
      2
    )}\n\nTotal invested: ${totalInvested.toFixed(
      2
    )}. Total current value: ${totalCurrent.toFixed(
      2
    )}.\n\nGive a short, plain-English 3-4 sentence summary of their portfolio's performance, concentration risk (if one stock dominates), and one actionable observation. Keep it neutral, not financial advice.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res
        .status(500)
        .json({ message: "AI service is not configured (missing GEMINI_API_KEY)" });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          // Newer Gemini models spend some of this budget on internal
          // "thinking", so keep the cap generous
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!aiRes.ok) {
      console.error("Gemini API error:", aiRes.status, await aiRes.text());
      return res.status(502).json({ message: "AI service failed to respond" });
    }

    const data = await aiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("")
        .trim() ?? "";

    if (!text || text.length < 40) {
      // Debug aid: shows finishReason / token counts when output looks wrong
      console.error(
        "Gemini short response:",
        JSON.stringify(data).slice(0, 600)
      );
    }

    if (!text) {
      return res.status(502).json({ message: "AI returned an empty response" });
    }

    // Only successful generations are cached
    const timestamp = Date.now();
    insightCache.set(userId, { text, timestamp });

    res.json({
      insight: text,
      generatedAt: new Date(timestamp).toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error("Portfolio insight error:", error);
    res.status(500).json({ message: "Failed to generate portfolio insight" });
  }
});

// ---------- SIGNUP API ----------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // ---------- input validation ----------
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before storing (never save plain text)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new UserModel({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ---------- LOGIN API ----------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });

    // Same generic message for both cases so the API doesn't reveal
    // which emails are registered
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Sign a JWT valid for 1 day
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ------------------- Connect to MongoDB -------------------
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ------------------- Start Server -------------------
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT} (HTTP + Socket.io)`);
});

// CI/CD deployment test
