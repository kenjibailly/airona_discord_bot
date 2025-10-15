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

    req.session.user = userResponse.data;
    req.session.guilds = guildsResponse.data;

    res.redirect(`/dashboard`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error during OAuth2 login");
  }
});

module.exports = router;
