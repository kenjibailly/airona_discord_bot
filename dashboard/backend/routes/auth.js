const express = require("express");
const axios = require("axios");
const router = express.Router();

const CLIENT_ID = process.env.VITE_DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.DOMAIN}/auth/callback`;

// Add logging to see what env vars are set
console.log("=== Auth Route Configuration ===");
console.log("CLIENT_ID:", CLIENT_ID);
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "SET" : "NOT SET");
console.log("REDIRECT_URI:", REDIRECT_URI);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("================================");

router.get("/login", (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify guilds`;
  console.log("Login redirect URL:", url);
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  console.log("Callback received with code:", code ? "YES" : "NO");

  if (!code) return res.status(400).send("No code provided");

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        scope: "identify guilds",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("Token received successfully");

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    console.log("User fetched:", userResponse.data.username);

    const guildsResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }
    );

    const botGuildsResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      }
    );

    const MANAGE_GUILD = 0x20;
    const botGuildIds = new Set(botGuildsResponse.data.map((g) => g.id));
    const mutualGuilds = guildsResponse.data.filter((g) => {
      const hasBot = botGuildIds.has(g.id);
      const hasPermission =
        (parseInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
      return hasBot && hasPermission;
    });

    console.log("Mutual guilds found:", mutualGuilds.length);

    req.session.user = userResponse.data;
    req.session.guilds = mutualGuilds;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Failed to save session");
      }
      console.log("Session saved, redirecting to frontend dashboard");
      // CHANGE THIS LINE - redirect to frontend URL
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    });
  } catch (err) {
    console.error("OAuth error:", err.response?.data || err.message);
    res.status(500).send("Error during OAuth2 login");
  }
});

router.get("/session", (req, res) => {
  console.log(
    "Session check - User:",
    req.session.user ? "EXISTS" : "NOT FOUND"
  );

  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    user: req.session.user,
    guilds: req.session.guilds || [],
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.redirect(process.env.FRONTEND_URL || "/");
  });
});

module.exports = router;
