// Add this to your API routes (e.g., app/routes/events.js or similar)
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Get events configuration
router.get("/", (req, res) => {
  try {
    // Try multiple possible paths for different environments
    const possiblePaths = [
      path.join(__dirname, "..", "config", "events.json"),
      path.join(process.cwd(), "config", "events.json"),
    ];

    let eventsData = null;
    let eventsPath = null;

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        eventsData = fs.readFileSync(filePath, "utf8");
        eventsPath = filePath;
        break;
      }
    }

    if (!eventsData) {
      throw new Error("events.json not found in any expected location");
    }

    const events = JSON.parse(eventsData);
    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error reading events.json:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load events",
      error: error.message,
    });
  }
});

module.exports = router;
