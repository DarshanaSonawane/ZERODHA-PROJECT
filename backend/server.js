// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
const User = mongoose.model("User", UserSchema);

// Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving user" });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));