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

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

// Routes
app.use("/auth", authRoutes);
app.use("/guilds", guildRoutes);

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all route to serve index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () =>
  console.log(`Dashboard backend running on port ${PORT}`)
);
