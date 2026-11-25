// Only needed on a laptop with DNS issues; skipped on Vercel
if (!process.env.VERCEL) {
  require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
}

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Allowed frontend URLs
const clean = (u) => u.trim().replace(/\/$/, "");
const allowed = [
  ...(process.env.CLIENT_URL || "").split(","),
  "https://authentication-frontend-kappa.vercel.app",
]
  .map(clean)
  .filter(Boolean);

// localhost is allowed only while developing, never in production
if (process.env.NODE_ENV !== "production") {
  allowed.push("http://localhost:5173", "http://localhost:5174");
}

app.use(cors({ origin: allowed }));
app.use(express.json());

// Reuse the DB connection (important for Vercel serverless)
let cached = global._mongo || (global._mongo = { conn: null, promise: null });

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (req, res) => res.json({ message: "MERN Auth API is running" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));

// Run a normal server locally; Vercel uses the exported app instead
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;