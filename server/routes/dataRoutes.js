const express = require("express");
const router = express.Router();
const UserData = require("../models/UserData");

const PRODUCTIVE_SITES = [
  "github.com", "chatgpt.com", "leetcode.com", "hackerrank.com",
  "geeksforgeeks.org", "stackoverflow.com", "coursera.org", "udemy.com",
];
const DISTRACTING_SITES = [
  "youtube.com", "instagram.com", "facebook.com", "reddit.com",
  "tiktok.com", "snapchat.com", "pinterest.com", "twitter.com", "x.com",
];

// Save site usage
router.post("/save", async (req, res) => {
  const { hostname, timeSpent } = req.body;
  const host = hostname.replace(/^www\./, "");
  const productivityType = PRODUCTIVE_SITES.some((s) => host.includes(s))
    ? "productive"
    : DISTRACTING_SITES.some((s) => host.includes(s))
    ? "distracting"
    : "neutral";
  await UserData.create({ hostname: host, timeSpent, productivityType });
  res.send("Data saved");
});

// Full report
router.get("/report", async (req, res) => {
  const data = await UserData.find().sort({ createdAt: -1 }).limit(500);
  res.json(data);
});

// Today stats
router.get("/today", async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const data = await UserData.find({ createdAt: { $gte: start, $lte: end } });
  res.json(data);
});

// Weekly stats
router.get("/weekly", async (req, res) => {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const data = await UserData.find({ createdAt: { $gte: lastWeek } });
  res.json(data);
});

module.exports = router;