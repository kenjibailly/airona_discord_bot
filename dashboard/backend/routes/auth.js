const express = require("express");
const axios = require("axios");
const router = express.Router();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.DOMAIN}/auth/callback`;

router.get("/login", (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify guilds`;
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
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

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const guildsResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      }
    );

    // Get bot's guilds
    const botGuildsResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      }
    );

    // Filter user guilds to only include ones where bot is present
    const botGuildIds = new Set(botGuildsResponse.data.map((g) => g.id));
    const mutualGuilds = guildsResponse.data.filter((g) =>
      botGuildIds.has(g.id)
    );

    req.session.user = userResponse.data;
    req.session.guilds = mutualGuilds;

    res.redirect(`/dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error during OAuth2 login");
  }
});
// Add this new endpoint
router.get("/session", (req, res) => {
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
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.redirect(process.env.FRONTEND_URL || "/");
  });
});

module.exports = router;
