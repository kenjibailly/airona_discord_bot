require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth");
const guildRoutes = require("./routes/guilds");

const app = express();
const PORT = process.env.DASHBOARD_PORT || 8080;

// CORS - must come before routes
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true if HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Important for cross-origin cookies
    },
  })
);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

// API Routes - these must come BEFORE static file serving
app.use("/auth", authRoutes);
app.use("/guilds", guildRoutes);

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all route to serve index.html for React Router
// This must be LAST so it doesn't catch API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () =>
  console.log(`Dashboard backend running on port ${PORT}`)
);
