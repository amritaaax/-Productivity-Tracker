const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const UserData = require("./models/UserData");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { dbName: "tracker" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const PRODUCTIVE_SITES = [
  "github.com", "chatgpt.com", "leetcode.com", "hackerrank.com",
  "geeksforgeeks.org", "stackoverflow.com", "coursera.org", "udemy.com",
];

const DISTRACTING_SITES = [
  "youtube.com", "instagram.com", "facebook.com", "reddit.com",
  "tiktok.com", "snapchat.com", "pinterest.com", "twitter.com", "x.com",
];

function getProductivityScore(productive, distracting) {
  const total = productive + distracting;
  if (total === 0) return 50;
  const ratio = productive / total;
  const penalty = Math.min(distracting / (60 * 60 * 1000 * 3), 1) * 20;
  return Math.max(0, Math.min(100, Math.round(ratio * 100 - penalty)));
}

// Track usage
app.post("/api/track", async (req, res) => {
  const { hostname, duration, productivityType } = req.body;
  try {
    const data = new UserData({
      hostname,
      timeSpent: duration,
      productivityType: productivityType || "neutral",
    });
    await data.save();
    res.json({ message: "Saved", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Today's data
app.get("/api/today", async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const data = await UserData.find({ createdAt: { $gte: startOfDay } });
  res.json(data);
});

// Weekly data
app.get("/api/weekly", async (req, res) => {
  const last7 = new Date();
  last7.setDate(last7.getDate() - 7);
  const data = await UserData.find({ createdAt: { $gte: last7 } });
  res.json(data);
});

// Analytics endpoint
app.get("/api/analytics", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);

    const todayData = await UserData.find({ createdAt: { $gte: startOfDay } });
    const weeklyData = await UserData.find({ createdAt: { $gte: last7 } });

    // Group by site
    const groupBySite = (data) => {
      const grouped = {};
      data.forEach((item) => {
        const host = item.hostname.replace(/^www\./, "");
        if (!grouped[host]) grouped[host] = { time: 0, type: item.productivityType };
        grouped[host].time += item.timeSpent;
      });
      return grouped;
    };

    const todaySites = groupBySite(todayData);
    const weeklySites = groupBySite(weeklyData);

    // Productive vs distracting
    let productiveTime = 0, distractingTime = 0, neutralTime = 0;
    Object.values(todaySites).forEach(({ time, type }) => {
      if (type === "productive") productiveTime += time;
      else if (type === "distracting") distractingTime += time;
      else neutralTime += time;
    });

    const totalTime = productiveTime + distractingTime + neutralTime;
    const score = getProductivityScore(productiveTime, distractingTime);

    // Top 5 sites today
    const top5 = Object.entries(todaySites)
      .sort((a, b) => b[1].time - a[1].time)
      .slice(0, 5)
      .map(([site, val]) => ({ site, time: val.time, type: val.type }));

    // Most distracting
    const distractingEntries = Object.entries(todaySites)
      .filter(([, v]) => v.type === "distracting")
      .sort((a, b) => b[1].time - a[1].time);

    // Most productive
    const productiveEntries = Object.entries(todaySites)
      .filter(([, v]) => v.type === "productive")
      .sort((a, b) => b[1].time - a[1].time);

    // Overused sites (exceeded 1hr limit)
    const overused = Object.entries(todaySites)
      .filter(([site, val]) => {
        return DISTRACTING_SITES.some((s) => site.includes(s)) && val.time >= 60 * 60 * 1000;
      })
      .map(([site, val]) => ({ site, time: val.time }));

    // Weekly trend (group by date)
    const weeklyTrend = {};
    weeklyData.forEach((item) => {
      const d = item.createdAt.toISOString().split("T")[0];
      if (!weeklyTrend[d]) weeklyTrend[d] = { productive: 0, distracting: 0 };
      if (item.productivityType === "productive") weeklyTrend[d].productive += item.timeSpent;
      if (item.productivityType === "distracting") weeklyTrend[d].distracting += item.timeSpent;
    });

    // Daily insights
    const insights = [];
    if (distractingTime > productiveTime) {
      insights.push("⚠️ You spent more time on distracting sites today.");
    }
    if (productiveTime >= 2 * 60 * 60 * 1000) {
      insights.push("🎯 Great focus! Over 2 hours of productive browsing.");
    }
    if (overused.length > 0) {
      insights.push(`🚨 ${overused.map((o) => o.site).join(", ")} exceeded daily limit.`);
    }
    if (score >= 80) insights.push("🏆 Excellent productivity score today!");
    else if (score <= 30) insights.push("📉 Low productivity. Try enabling Focus Mode.");

    res.json({
      today: {
        totalTime,
        productiveTime,
        distractingTime,
        neutralTime,
        score,
        top5,
        mostDistracting: distractingEntries[0] ? { site: distractingEntries[0][0], time: distractingEntries[0][1].time } : null,
        mostProductive: productiveEntries[0] ? { site: productiveEntries[0][0], time: productiveEntries[0][1].time } : null,
        overused,
        insights,
        sites: todaySites,
      },
      weekly: {
        trend: weeklyTrend,
        sites: weeklySites,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port 5000")
);